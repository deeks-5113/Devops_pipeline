FROM python:3.10-slim

WORKDIR /app

# CRITICAL: We must install the Docker CLI inside the container 
# so 'subprocess.run(["docker", "ps"])' works inside Python. 
# We also install 'git' because redeploy.sh relies on it.
RUN apt-get update && \
    apt-get install -y docker.io git && \
    rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

EXPOSE 8720

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8720"]
