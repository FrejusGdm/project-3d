# Gunicorn configuration file
# This file can be used with: gunicorn -c gunicorn.conf.py app:app

# Worker class for FastAPI (ASGI)
worker_class = "uvicorn.workers.UvicornWorker"

# Number of worker processes
workers = 1

# Timeout for worker processes (in seconds)
# Set to 5 minutes (300 seconds) to handle long-running 3D generation
timeout = 300

# Keep-alive timeout
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "3d-generation-api"

