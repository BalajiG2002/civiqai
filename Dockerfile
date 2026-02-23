FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8080
EXPOSE 6379

# Redis environment variables
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379

# Create startup script to run Redis and FastAPI
RUN echo '#!/bin/bash\n\
redis-server --daemonize yes --bind 0.0.0.0 --port 6379\n\
sleep 2\n\
uvicorn api.main:app --host 0.0.0.0 --port 8080' > /start.sh && chmod +x /start.sh

# Set entrypoint
CMD ["/start.sh"]
