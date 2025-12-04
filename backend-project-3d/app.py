"""
FastAPI web server for 3D generation pipeline.
Exposes endpoints that Convex actions call to generate 3D models.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import os
import logging
import traceback
from gen_pipeline import run_pipeline, generate_image, generate_3d

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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


class Generate3DRequest(BaseModel):
    image_path: str
    three_d_model: str = "trellis"


@app.get("/health")
async def health_check():
    """Health check endpoint for Render."""
    return {"status": "ok"}


@app.post("/generate/image")
async def generate_image_endpoint(
    prompt: str = Form(...),
    image_model: str = Form("nanobanana"),
    ref_image: Optional[UploadFile] = File(None)
):
    """
    Generate an image design for a keycap.
    Accepts a prompt and optional reference image.
    """
    logger.info(f"Received image generation request: prompt='{prompt[:50]}...', model={image_model}, has_ref={ref_image is not None}")
    
    try:
        ref_image_data = None
        if ref_image:
            ref_image_data = await ref_image.read()

        result = generate_image(
            prompt=prompt,
            image_model_name=image_model,
            ref_image_data=ref_image_data
        )
        logger.info(f"Image generation completed: {result}")
        return result
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Image generation failed: {error_msg}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/3d")
async def generate_3d_endpoint(request: Generate3DRequest):
    """
    Generate a 3D model from a previously generated image.
    """
    logger.info(f"Received 3D generation request: image_path={request.image_path}, model={request.three_d_model}")
    
    try:
        result = generate_3d(
            image_path_str=request.image_path,
            three_d_model_name=request.three_d_model
        )
        logger.info(f"3D generation completed: {result}")
        return result
    except Exception as e:
        error_msg = str(e)
        logger.error(f"3D generation failed: {error_msg}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate")
async def generate(request: GenerateRequest):
    """
    Generate a 3D model from a text prompt.
    Called by Convex actions to start the generation process.
    
    Note: This is a long-running operation (can take 1-2 minutes).
    Render free tier has a 30s timeout, so this may timeout.
    Consider upgrading to a paid plan or using background tasks.
    """
    logger.info(f"Received generation request: prompt='{request.prompt[:50]}...', model={request.image_model}, 3d_model={request.three_d_model}")
    
    try:
        logger.info("Starting pipeline execution...")
        result = run_pipeline(
            prompt=request.prompt,
            image_model_name=request.image_model,
            three_d_model_name=request.three_d_model,
        )
        logger.info(f"Pipeline completed successfully: {result}")
        return result
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        logger.error(f"Pipeline failed: {error_msg}")
        logger.error(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500, 
            detail=f"Pipeline failed: {error_msg}. Check logs for details."
        )


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

