from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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
import hashlib
import uuid
from pathlib import Path

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
ADMIN_USER = os.getenv("ADMIN_USER")
ADMIN_PASS = os.getenv("ADMIN_PASS")

# Containers that cannot be stopped/restarted/redeployed via the dashboard
PROTECTED_CONTAINERS = {"devops_dashboard_backend", "devops_dashboard_frontend"}

# Path to host repo (bind-mounted in docker-compose.yml as .:/host-repo)
DEPLOY_DIR = "/host-repo"
HOST_HOME_PREFIX = "/home/aditya"
CONTAINER_HOME_PREFIX = "/host-home"
GROUPS_FILE = Path(DEPLOY_DIR) / "groups.json"

app = FastAPI(title="Deployment Dashboard API")

# Run once at startup — marks the bind-mounted host repo as safe for git.
# Without this, git refuses to operate because /host-repo is owned by the
# host OS user but the container process runs as root (different UID).
subprocess.run(
    ["git", "config", "--global", "--add", "safe.directory", DEPLOY_DIR],
    capture_output=True, text=True
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

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
    container_id: str = ""
    name: str
    status: str
    ports: str
    cpu_perc: str = "N/A"
    mem_usage: str = "N/A"
    mem_perc: str = "N/A"
    net_io: str = "N/A"
    block_io: str = "N/A"
    pids: str = "N/A"
    folder: str = "N/A"

class DockerImageInfo(BaseModel):
    image_id: str
    name: str
    disk_usage: str = "N/A"
    content_size: str = "N/A"
    extra: str = ""

class DockerStorageRow(BaseModel):
    type: str
    total: str
    active: str
    size: str
    reclaimable: str

class ActionResponse(BaseModel):
    status: str
    output: str

class Group(BaseModel):
    id: str
    name: str
    containers: List[str] = []

class GroupCreate(BaseModel):
    name: str
    containers: List[str] = []

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    containers: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Security Helpers
# ---------------------------------------------------------------------------

def verify_password(plain_password: str, stored_password: str) -> bool:
    """SHA256 comparison — avoids bcrypt $ env-interpolation issues."""
    if not stored_password:
        return False
    return (
        hashlib.sha256(plain_password.encode()).hexdigest()
        == hashlib.sha256(stored_password.encode()).hexdigest()
    )

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise exc
    except JWTError:
        raise exc
    if username != ADMIN_USER:
        raise exc
    return username


# ---------------------------------------------------------------------------
# Groups File Helpers
# ---------------------------------------------------------------------------

def load_groups() -> List[dict]:
    if not GROUPS_FILE.exists():
        return []
    try:
        return json.loads(GROUPS_FILE.read_text())
    except (json.JSONDecodeError, IOError):
        return []

def save_groups(groups: List[dict]):
    GROUPS_FILE.write_text(json.dumps(groups, indent=2))


# ---------------------------------------------------------------------------
# Validation Helper
# ---------------------------------------------------------------------------

def validate_container_name(name: str):
    if not re.match(r"^[a-zA-Z0-9_-]+$", name):
        raise HTTPException(status_code=400, detail="Invalid container name format.")

def get_container_context(container_name: str) -> str:
    """Uses docker inspect to find the host-side working directory (project root)."""
    try:
        # Get labels from docker inspect
        r = subprocess.run(
            ["docker", "inspect", container_name, "--format", '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}'],
            capture_output=True, text=True, check=True
        )
        host_path = r.stdout.strip()
        if not host_path:
            # Fallback for projects not started with the working_dir label
            return DEPLOY_DIR
        
        # Translate host path to container path
        # Example: /home/aditya/Janmasethu/sakhi -> /host-home/Janmasethu/sakhi
        if host_path.startswith(HOST_HOME_PREFIX):
            container_path = host_path.replace(HOST_HOME_PREFIX, CONTAINER_HOME_PREFIX, 1)
            return container_path
        
        return host_path # Fallback
    except Exception:
        return DEPLOY_DIR

def run_command(command: List[str]) -> subprocess.CompletedProcess:
    return subprocess.run(command, capture_output=True, text=True, check=True)

def parse_json_lines(stdout: str) -> List[dict]:
    rows: List[dict] = []
    for line in stdout.strip().splitlines():
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows

def normalize_image_name(repository: str, tag: str) -> str:
    repo = repository or "<none>"
    image_tag = tag or "<none>"
    return f"{repo}:{image_tag}"

def parse_delimited_rows(stdout: str, columns: List[str], delimiter: str = "\t") -> List[dict]:
    rows: List[dict] = []
    for line in stdout.strip().splitlines():
        if not line:
            continue
        parts = line.split(delimiter)
        if len(parts) < len(columns):
            parts += [""] * (len(columns) - len(parts))
        rows.append({column: parts[index].strip() for index, column in enumerate(columns)})
    return rows

def get_docker_image_rows() -> List[DockerImageInfo]:
    try:
        tree_rows = parse_delimited_rows(
            run_command([
                "docker", "images",
                "--format", "{{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.DiskUsage}}\t{{.ContentSize}}\t{{.Extra}}"
            ]).stdout,
            ["name", "image_id", "disk_usage", "content_size", "extra"],
        )
        images: List[DockerImageInfo] = []
        for row in tree_rows:
            if not row.get("name") and not row.get("image_id"):
                continue
            images.append(DockerImageInfo(
                image_id=row.get("image_id", ""),
                name=row.get("name", "<none>:<none>"),
                disk_usage=row.get("disk_usage") or "N/A",
                content_size=row.get("content_size") or "N/A",
                extra=row.get("extra") or "",
            ))
        if images:
            return images
    except subprocess.CalledProcessError:
        pass

    fallback_rows = parse_json_lines(
        run_command(["docker", "image", "ls", "--format", "{{json .}}"]).stdout
    )
    return [
        DockerImageInfo(
            image_id=row.get("ID", ""),
            name=normalize_image_name(row.get("Repository", ""), row.get("Tag", "")),
            disk_usage=row.get("Size", "N/A"),
            content_size=row.get("Size", "N/A"),
            extra="",
        )
        for row in fallback_rows
    ]

def get_docker_storage_rows() -> List[DockerStorageRow]:
    rows = parse_json_lines(
        run_command(["docker", "system", "df", "--format", "{{json .}}"]).stdout
    )
    return [
        DockerStorageRow(
            type=row.get("Type", ""),
            total=str(row.get("TotalCount", "")),
            active=str(row.get("Active", "")),
            size=row.get("Size", "N/A"),
            reclaimable=row.get("Reclaimable", "N/A"),
        )
        for row in rows
    ]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post("/api/auth/login", response_model=Token)
async def login(req: LoginRequest):
    if req.username != ADMIN_USER or not verify_password(req.password, ADMIN_PASS):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    return {"access_token": create_access_token({"sub": req.username}), "token_type": "bearer"}


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@app.get("/api/stats/system", response_model=SystemMetrics)
def get_system_stats(current_user: str = Depends(get_current_user)):
    disk = psutil.disk_usage("/")
    return SystemMetrics(
        cpu_percent=psutil.cpu_percent(interval=None),
        ram_percent=psutil.virtual_memory().percent,
        disk_free_gb=round(disk.free / (1024 ** 3), 2),
    )

@app.get("/api/stats/containers", response_model=List[ContainerInfo])
def get_containers(current_user: str = Depends(get_current_user)):
    try:
        ps_rows = parse_json_lines(
            run_command(["docker", "ps", "-a", "--format", "{{json .}}"]).stdout
        )
        stats_rows = parse_json_lines(
            run_command(["docker", "stats", "--no-stream", "--format", "{{json .}}"]).stdout
        )
        stats_map = {row.get("Name", ""): row for row in stats_rows}

        containers = []
        for row in ps_rows:
            name = row.get("Names", "")
            stat = stats_map.get(name, {})
            containers.append(ContainerInfo(
                container_id=row.get("ID", ""),
                name=name,
                status=row.get("Status", ""),
                ports=row.get("Ports", ""),
                cpu_perc=stat.get("CPUPerc", "N/A"),
                mem_usage=stat.get("MemUsage", "N/A"),
                mem_perc=stat.get("MemPerc", "N/A"),
                net_io=stat.get("NetIO", "N/A"),
                block_io=stat.get("BlockIO", "N/A"),
                pids=stat.get("PIDs", "N/A"),
                folder=get_container_context(name).split("/")[-1] or "N/A",
            ))
        return containers
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="Failed to retrieve docker container stats.")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Docker daemon not available.")

@app.get("/api/stats/images", response_model=List[DockerImageInfo])
def get_docker_images(current_user: str = Depends(get_current_user)):
    try:
        return get_docker_image_rows()
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="Failed to retrieve docker images.")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Docker daemon not available.")

@app.get("/api/stats/storage", response_model=List[DockerStorageRow])
def get_docker_storage(current_user: str = Depends(get_current_user)):
    try:
        return get_docker_storage_rows()
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="Failed to retrieve docker storage usage.")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Docker daemon not available.")


# ---------------------------------------------------------------------------
# Per-Container Actions
# ---------------------------------------------------------------------------

@app.post("/api/containers/{container_name}/stop", response_model=ActionResponse)
def stop_container(container_name: str, current_user: str = Depends(get_current_user)):
    validate_container_name(container_name)
    if container_name in PROTECTED_CONTAINERS:
        raise HTTPException(status_code=403, detail="This container is protected and cannot be stopped via the dashboard.")
    try:
        r = subprocess.run(
            ["docker", "stop", container_name],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            return ActionResponse(status="error", output=r.stderr or r.stdout)
        return ActionResponse(status="success", output=r.stdout.strip() or f"{container_name} stopped.")
    except Exception as e:
        return ActionResponse(status="error", output=str(e))


@app.post("/api/containers/{container_name}/start", response_model=ActionResponse)
def start_container(container_name: str, current_user: str = Depends(get_current_user)):
    validate_container_name(container_name)
    if container_name in PROTECTED_CONTAINERS:
        raise HTTPException(status_code=403, detail="This container is protected.")
    try:
        r = subprocess.run(
            ["docker", "start", container_name],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            return ActionResponse(status="error", output=r.stderr or r.stdout)
        return ActionResponse(status="success", output=r.stdout.strip() or f"{container_name} started.")
    except Exception as e:
        return ActionResponse(status="error", output=str(e))


@app.post("/api/containers/{container_name}/restart", response_model=ActionResponse)
def restart_container(container_name: str, current_user: str = Depends(get_current_user)):
    validate_container_name(container_name)
    if container_name in PROTECTED_CONTAINERS:
        raise HTTPException(status_code=403, detail="This container is protected and cannot be restarted via the dashboard.")
    try:
        r = subprocess.run(
            ["docker", "restart", container_name],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            return ActionResponse(status="error", output=r.stderr or r.stdout)
        return ActionResponse(status="success", output=r.stdout.strip() or f"{container_name} restarted.")
    except Exception as e:
        return ActionResponse(status="error", output=str(e))


@app.post("/api/containers/{container_name}/redeploy", response_model=ActionResponse)
def redeploy_container(container_name: str, current_user: str = Depends(get_current_user)):
    validate_container_name(container_name)
    if container_name in PROTECTED_CONTAINERS:
        raise HTTPException(status_code=403, detail="This container is protected and cannot be redeployed via the dashboard.")

    target_dir = get_container_context(container_name)
    log_lines: List[str] = [f"Context: {target_dir}"]
    
    steps = [
        # Ensure git trusts the directory
        (["git", "config", "--global", "--add", "safe.directory", target_dir],
                                                                    "Configuring git safe directory..."),
        (["docker", "compose", "down"],                            f"Stopping and removing containers (down)..."),
        (["git", "pull"],                                          "Pulling latest code..."),
        (["docker", "compose", "build", container_name],           f"Rebuilding {container_name} image..."),
        (["docker", "compose", "up", "-d", "--no-deps", container_name], f"Starting {container_name} up..."),
    ]
    
    for cmd, description in steps:
        log_lines.append(f">>> {description}")
        try:
            # Note: We run in the target_dir discovered from labels
            r = subprocess.run(cmd, cwd=target_dir, capture_output=True, text=True)
            if r.stdout.strip():
                log_lines.append(r.stdout.strip())
            if r.stderr.strip():
                log_lines.append(r.stderr.strip())
            if r.returncode != 0:
                error = r.stderr.strip() or r.stdout.strip() or "Unknown error"
                log_lines.append(f"ERROR: {error}")
                return ActionResponse(status="error", output="\n".join(log_lines))
        except Exception as e:
            log_lines.append(f"ERROR: {e}")
            return ActionResponse(status="error", output="\n".join(log_lines))

    log_lines.append(f"✓ Redeployment of {container_name} complete!")
    return ActionResponse(status="success", output="\n".join(log_lines))



@app.get("/api/containers/{container_name}/logs")
def stream_container_logs(container_name: str, current_user: str = Depends(get_current_user)):
    validate_container_name(container_name)

    def generate():
        try:
            proc = subprocess.Popen(
                ["docker", "logs", "--tail=100", "-f", container_name],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            for line in proc.stdout:
                yield f"data: {line.rstrip()}\n\n"
            proc.wait()
        except Exception as e:
            yield f"data: ERROR: {e}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disables nginx buffering so lines arrive in real-time
        },
    )


# ---------------------------------------------------------------------------
# Groups CRUD
# ---------------------------------------------------------------------------

@app.get("/api/groups", response_model=List[Group])
def get_groups(current_user: str = Depends(get_current_user)):
    return load_groups()


@app.post("/api/groups", response_model=Group)
def create_group(body: GroupCreate, current_user: str = Depends(get_current_user)):
    groups = load_groups()
    new_group = {"id": str(uuid.uuid4()), "name": body.name, "containers": body.containers}
    groups.append(new_group)
    save_groups(groups)
    return new_group


@app.put("/api/groups/{group_id}", response_model=Group)
def update_group(group_id: str, body: GroupUpdate, current_user: str = Depends(get_current_user)):
    groups = load_groups()
    for g in groups:
        if g["id"] == group_id:
            if body.name is not None:
                g["name"] = body.name
            if body.containers is not None:
                g["containers"] = body.containers
            save_groups(groups)
            return g
    raise HTTPException(status_code=404, detail="Group not found.")


@app.delete("/api/groups/{group_id}")
def delete_group(group_id: str, current_user: str = Depends(get_current_user)):
    groups = load_groups()
    new_groups = [g for g in groups if g["id"] != group_id]
    if len(new_groups) == len(groups):
        raise HTTPException(status_code=404, detail="Group not found.")
    save_groups(new_groups)
    return {"status": "deleted", "id": group_id}
