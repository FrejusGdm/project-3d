"""
FastAPI web server for 3D generation pipeline.
Exposes endpoints that Convex actions call to generate 3D models.
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import os
from gen_pipeline import run_pipeline

app = FastAPI(title="3D Generation Pipeline API")

# CORS middleware to allow requests from Convex
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your Convex deployment URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)


class GenerateRequest(BaseModel):
    prompt: str
    image_model: str = "nanobanana"
    three_d_model: str = "trellis"


@app.get("/health")
async def health_check():
    """Health check endpoint for Render."""
    return {"status": "ok"}


@app.post("/generate")
async def generate(request: GenerateRequest):
    """
    Generate a 3D model from a text prompt.
    Called by Convex actions to start the generation process.
    """
    try:
        result = run_pipeline(
            prompt=request.prompt,
            image_model_name=request.image_model,
            three_d_model_name=request.three_d_model,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/{file_path:path}")
async def get_file(file_path: str):
    """
    Serve generated PLY files.
    Called by Convex actions to download the generated model.
    """
    file_path_obj = OUTPUT_DIR / file_path
    
    if not file_path_obj.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security check: ensure file is within OUTPUT_DIR
    try:
        file_path_obj.resolve().relative_to(OUTPUT_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return FileResponse(
        file_path_obj,
        media_type="application/octet-stream",
        filename=file_path_obj.name,
    )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

