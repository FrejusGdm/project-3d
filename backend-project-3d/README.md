# 3D Generation Pipeline API

FastAPI web service for generating 3D models from text prompts.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
- `GOOGLE_API_KEY` - Google Gemini API key
- `REPLICATE_API_KEY` - Replicate API key
- `PORT` - Port to run on (default: 8000)

## Running Locally

```bash
python app.py
```

Or with uvicorn:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /health` - Health check
- `POST /generate` - Generate a 3D model
  ```json
  {
    "prompt": "A keycap shaped like a mountain",
    "image_model": "nanobanana",
    "three_d_model": "trellis"
  }
  ```
- `GET /files/{path}` - Download generated PLY file

## Deployment on Render

**Language:** Python 3

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
gunicorn app:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

**Environment Variables:**
- `GOOGLE_API_KEY`
- `REPLICATE_API_KEY`
- `PORT` (automatically set by Render)

