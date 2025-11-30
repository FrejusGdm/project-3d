# 3D Generation Pipeline API

FastAPI web service for generating 3D models from text prompts.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env.local` file with environment variables:
```bash
# Required: Google Gemini API Key (for image generation)
GOOGLE_API_KEY=your_google_api_key_here

# Required: Replicate API Key (for 3D model generation)
REPLICATE_API_KEY=your_replicate_api_key_here

# Optional: Port to run on (defaults to 8000, Render sets this automatically)
PORT=8000
```

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

**Start Command (Option 1 - Using config file):**
```bash
gunicorn app:app --config gunicorn.conf.py --bind 0.0.0.0:$PORT
```

**Start Command (Option 2 - Inline flags):**
```bash
gunicorn app:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 300 --workers 1
```

**Important:** 
- The `--timeout 300` sets Gunicorn timeout to 5 minutes (300 seconds)
- This should handle generation that takes 1-2 minutes
- If you still get timeouts, Render free tier may have additional limits - consider upgrading to a paid plan

**Important Notes:**
- **Timeout Issue**: Render free tier has a 30-second timeout, but generation takes ~1 minute. You'll get 502 errors.
- **Solutions**:
  1. Upgrade to Render paid plan (no timeout limits)
  2. Use Render's background workers
  3. Implement async processing with status polling

**Environment Variables:**
- `GOOGLE_API_KEY`
- `REPLICATE_API_KEY`
- `PORT` (automatically set by Render)

**Check Logs:**
- View Render service logs to see detailed error messages
- Logs will show where the pipeline is failing

