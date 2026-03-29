from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import subprocess
import psutil
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
import re
import json
import shlex
import hashlib

# Ensure we load env variables from .env
load_dotenv()

# App Security Settings from Env
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
ADMIN_USER = os.getenv("ADMIN_USER")
# Store plaintext password in env - Python hashes it at runtime, bypassing
# the $ interpolation issue that corrupts bcrypt hashes in .env files
ADMIN_PASS = os.getenv("ADMIN_PASS")

app = FastAPI(title="Deployment Dashboard API")

# Setup CORS for the React frontend, allowing localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Wildcard allows ANY server IP now
    allow_credentials=False, # Must be False for wildcard (*) to work in CORS
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

ALLOWED_ACTIONS = {
    "redeploy": "/opt/deployment-scripts/redeploy.sh"
}

# --- Models ---
class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class SystemMetrics(BaseModel):
    cpu_percent: float
    ram_percent: float
    disk_free_gb: float

class ContainerInfo(BaseModel):
    name: str
    status: str
    ports: str
    cpu_perc: str = "N/A"
    mem_usage: str = "N/A"

class ActionResponse(BaseModel):
    status: str
    output: str

class LogResponse(BaseModel):
    logs: str

# --- Security Functions ---
def verify_password(plain_password: str, stored_password: str) -> bool:
    """Compare passwords using SHA256 to avoid bcrypt $ env interpolation issues."""
    if not stored_password:
        return False
    # Hash both sides so we never compare plaintext directly
    incoming = hashlib.sha256(plain_password.encode()).hexdigest()
    expected = hashlib.sha256(stored_password.encode()).hexdigest()
    return incoming == expected

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    if username != ADMIN_USER:
        raise credentials_exception
    return username

# --- Endpoints ---

@app.post("/api/auth/login", response_model=Token)
async def login(req: LoginRequest):
    if req.username != ADMIN_USER or not verify_password(req.password, ADMIN_PASS):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token = create_access_token(data={"sub": req.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/stats/system", response_model=SystemMetrics)
def get_system_stats(current_user: str = Depends(get_current_user)):
    disk_usage = psutil.disk_usage('/')
    return SystemMetrics(
        cpu_percent=psutil.cpu_percent(interval=None),
        ram_percent=psutil.virtual_memory().percent,
        disk_free_gb=round(disk_usage.free / (1024 ** 3), 2)
    )

@app.get("/api/stats/containers", response_model=List[ContainerInfo])
def get_containers(current_user: str = Depends(get_current_user)):
    try:
        # Get basic container info (ps)
        ps_result = subprocess.run(
            ["docker", "ps", "--format", '{"Names":"{{.Names}}", "Status":"{{.Status}}", "Ports":"{{.Ports}}"}'],
            capture_output=True, text=True, check=True
        )
        
        # Get container stats (CPU/RAM)
        stats_result = subprocess.run(
            ["docker", "stats", "--no-stream", "--format", '{"Name":"{{.Name}}", "CPUPerc":"{{.CPUPerc}}", "MemUsage":"{{.MemUsage}}"}'],
            capture_output=True, text=True, check=True
        )
        
        # Parse stats into a dictionary mapped by container name
        stats_map = {}
        for line in stats_result.stdout.strip().split("\n"):
            if not line: continue
            try:
                data = json.loads(line)
                stats_map[data.get("Name", "")] = data
            except json.JSONDecodeError:
                continue

        # Merge ps and stats data
        containers = []
        for line in ps_result.stdout.strip().split("\n"):
            if not line:
                continue
            try:
                data = json.loads(line)
                name = data.get("Names", "")
                c_stat = stats_map.get(name, {})
                containers.append(ContainerInfo(
                    name=name,
                    status=data.get("Status", ""),
                    ports=data.get("Ports", ""),
                    cpu_perc=c_stat.get("CPUPerc", "N/A"),
                    mem_usage=c_stat.get("MemUsage", "N/A")
                ))
            except json.JSONDecodeError:
                continue
        return containers
    except subprocess.CalledProcessError:
         raise HTTPException(status_code=500, detail="Failed to retrieve docker container stats")
    except FileNotFoundError:
         raise HTTPException(status_code=500, detail="Docker daemon is not available or installed")

@app.post("/api/actions/{action_id}", response_model=ActionResponse)
def execute_action(action_id: str, current_user: str = Depends(get_current_user)):
    # 1. Check if action_id exists in ALLOWED_ACTIONS
    if action_id not in ALLOWED_ACTIONS:
        raise HTTPException(status_code=400, detail="Invalid action_id")
        
    script_to_run = ALLOWED_ACTIONS[action_id]
    
    try:
        # Use shlex split to correctly split commands with spaces if needed
        # Since it's predefined and trusted, simple split is usually sufficient,
        # but caution is taken not to use shell=True
        cmd = shlex.split(script_to_run)
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return ActionResponse(status="error", output=result.stderr or result.stdout)
            
        return ActionResponse(status="success", output=result.stdout)
    except Exception as e:
        return ActionResponse(status="error", output=str(e))

@app.get("/api/logs/{container_name}", response_model=LogResponse)
def get_logs(container_name: str, current_user: str = Depends(get_current_user)):
    # Validate container_name using regex ^[a-zA-Z0-9_-]+$
    if not re.match(r"^[a-zA-Z0-9_-]+$", container_name):
        raise HTTPException(status_code=400, detail="Invalid container name format")
        
    try:
        result = subprocess.run(
            ["docker", "logs", "--tail", "100", container_name],
            capture_output=True, text=True
        )
        # docker logs output depends on how the container logs things (stdout/stderr)
        output = result.stdout
        if result.stderr:
             output += "\n" + result.stderr

        return LogResponse(logs=output.strip())
    except FileNotFoundError:
         raise HTTPException(status_code=500, detail="Docker daemon not available")
    except subprocess.CalledProcessError as e:
         raise HTTPException(status_code=500, detail=f"Failed to fetch logs: {e}")
