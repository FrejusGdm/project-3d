import io
import os
import uuid
import logging
from abc import ABC, abstractmethod
from pathlib import Path

from dotenv import load_dotenv
from PIL import Image
# API's
# Google - NanoBanana
from google import genai
from google.genai import types
# Replicate - HunYuan3D
import replicate

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv(".env.local")
load_dotenv()

OUTPUT_DIR = Path("outputs")
KEYCAP_SYSTEM_PROMPT = """
You are a professional 3D asset designer specializing in mechanical keyboard keycaps.
Your task is to design a single, high-quality keycap based on the user's description.
The output must be an image of a single keycap, viewed from an isometric perspective, on a plain, neutral background (white or light gray).
Ensure the design is clear, detailed, and suitable for 3D modeling.
Do NOT generate a full keyboard.
Do NOT generate multiple keycaps unless explicitly asked (but prefer single).
Focus on the material, texture, and the specific design element requested.
"""

def _save_file_output(file_obj, suffix=".ply"):
  """Persist a Replicate FileOutput (or any file-like with read()) and return (id, filename)."""
  file_id = uuid.uuid4().hex
  filename = f"{file_id}{suffix}"
  path = OUTPUT_DIR / filename
  with open(path, "wb") as f:
    f.write(file_obj.read())
  # Return just the filename, not the full path with OUTPUT_DIR
  # This prevents double-path issues in the /files/ endpoint
  return file_id, filename


def materialize_model_output(model_output):
  """
  Convert a model_output dict from Replicate into a standardized payload:
  { "format": "<ext>", "location": "file", "path": "<relative path>" }
  """
  logger.info(f"[materialize_model_output] Input type: {type(model_output)}")
  logger.info(f"[materialize_model_output] Input: {model_output}")
  
  if isinstance(model_output, list):
    logger.info(f"[materialize_model_output] Processing list with {len(model_output)} items")
    for i, value in enumerate(model_output):
      logger.info(f"[materialize_model_output] List item {i}: type={type(value)}, hasattr('read')={hasattr(value, 'read')}")
      if hasattr(value, "read"):
        file_id, path = _save_file_output(value, suffix=".ply")
        logger.info(f"[materialize_model_output] Found file in list: {path}")
        return {"id": file_id, "format": "ply", "location": "file", "path": str(path)}
    logger.error("[materialize_model_output] No file-like objects found in list")
    raise ValueError("No file-like objects found in list output")

  if not isinstance(model_output, dict):
    logger.error(f"[materialize_model_output] Expected dict, got {type(model_output)}")
    raise ValueError(f"Expected model_output to be a dict of outputs, got {type(model_output)}")

  logger.info(f"[materialize_model_output] Dict keys: {list(model_output.keys())}")
  
  # Preferred keys in order of preference, with their expected file extensions
  # Use GLB (model_file) first because it renders properly with colors
  # Gaussian PLY is for Gaussian Splatting which needs special renderer
  preferred_keys = [
    ("model_file", ".glb"),    # GLB renders with colors in standard Three.js
    ("gaussian_ply", ".ply"),  # Gaussian PLY needs special renderer
    ("ply", ".ply"),
    ("output", ".glb"),
  ]

  for key, suffix in preferred_keys:
    if key in model_output:
      file_obj = model_output[key]
      logger.info(f"[materialize_model_output] Found key '{key}': type={type(file_obj)}, hasattr('read')={hasattr(file_obj, 'read')}")
      
      if hasattr(file_obj, "read"):
        # File-like object
        file_id, path = _save_file_output(file_obj, suffix=suffix)
        logger.info(f"[materialize_model_output] Saved file from '{key}': {path}")
        return {"id": file_id, "format": suffix.lstrip("."), "location": "file", "path": str(path)}
      elif isinstance(file_obj, str) and file_obj.startswith("http"):
        # URL string - download it
        logger.info(f"[materialize_model_output] Key '{key}' is a URL: {file_obj}")
        # Only download if it's the right file type (check URL ends with expected extension)
        if file_obj.lower().endswith(suffix.lower()) or suffix in [".ply", ".glb"] and (suffix.lstrip(".") in file_obj.lower()):
          try:
            import requests
            logger.info(f"[materialize_model_output] Downloading {suffix} file from URL: {file_obj}")
            response = requests.get(file_obj, timeout=120)
            response.raise_for_status()
            file_id, path = _save_file_output(io.BytesIO(response.content), suffix=suffix)
            logger.info(f"[materialize_model_output] Downloaded and saved: {path}")
            return {"id": file_id, "format": suffix.lstrip("."), "location": "file", "path": str(path)}
          except Exception as e:
            logger.error(f"[materialize_model_output] Failed to download from URL '{key}': {e}")
            # Continue to try other options
        else:
          logger.info(f"[materialize_model_output] Skipping '{key}' - URL doesn't match expected extension {suffix}")
      else:
        logger.info(f"[materialize_model_output] Key '{key}' is not a file-like object or URL: {type(file_obj)}")

  # Fallback: look for any .ply URL or file-like object
  logger.info("[materialize_model_output] Trying fallback: checking all dict values for .ply files")
  for key, value in model_output.items():
    if value is None:
      continue
    logger.info(f"[materialize_model_output] Checking key '{key}': type={type(value)}, hasattr('read')={hasattr(value, 'read')}")
    
    if hasattr(value, "read"):
      # File-like object
      file_id, path = _save_file_output(value, suffix=".ply")
      logger.info(f"[materialize_model_output] Found file-like object in '{key}': {path}")
      return {"id": file_id, "format": "ply", "location": "file", "path": str(path)}
    elif isinstance(value, str) and value.startswith("http"):
      # URL string - only download if it's a .ply file
      if ".ply" in value.lower():
        logger.info(f"[materialize_model_output] Found .ply URL in '{key}': {value}")
        try:
          import requests
          logger.info(f"[materialize_model_output] Downloading .ply file from URL: {value}")
          response = requests.get(value, timeout=120)
          response.raise_for_status()
          file_id, path = _save_file_output(io.BytesIO(response.content), suffix=".ply")
          logger.info(f"[materialize_model_output] Downloaded and saved: {path}")
          return {"id": file_id, "format": "ply", "location": "file", "path": str(path)}
        except Exception as e:
          logger.error(f"[materialize_model_output] Failed to download from URL '{key}': {e}")
          # Continue to try other options
      else:
        logger.info(f"[materialize_model_output] Skipping '{key}' - URL is not a .ply file")

  logger.error(f"[materialize_model_output] Could not find file-like output. Full structure: {model_output}")
  raise ValueError(f"Could not find a file-like output in model_output. Keys: {list(model_output.keys()) if isinstance(model_output, dict) else 'N/A'}. Structure: {str(model_output)[:500]}")


class ImageModel(ABC):
  @abstractmethod
  def gen(self, prompt: str, ref_image: Image.Image = None):
    pass


class NanoBanana(ImageModel):
  def __init__(self) -> None:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
      raise RuntimeError("GOOGLE_API_KEY not set; place it in .env or your environment")
    self.client = genai.Client(api_key=api_key)
    self.model = "gemini-2.5-flash-image"

  def gen(self, prompt: str, ref_image: Image.Image = None):
    full_prompt = f"{KEYCAP_SYSTEM_PROMPT}\n\nUser Request: {prompt}"
    if ref_image:
      logger.info(f"[NanoBanana] Generating image with reference image...")
      contents = [full_prompt, ref_image]
    else:
      logger.info(f"[NanoBanana] Generating image for prompt: {prompt[:50]}...")
      contents = [full_prompt]
      
    try:
      response = self.client.models.generate_content(
          model=self.model,
          contents=contents,
      )
      logger.info(f"[NanoBanana] Received response, type: {type(response)}")
      logger.info(f"[NanoBanana] Response attributes: {dir(response)}")

      image = None
      # Handle different response structures
      if hasattr(response, 'parts') and response.parts:
        # Old API structure
        logger.info(f"[NanoBanana] Using 'parts' attribute, count: {len(response.parts)}")
        for part in response.parts:
          if hasattr(part, 'inline_data') and part.inline_data is not None:
            image = Image.open(io.BytesIO(part.inline_data.data))
            logger.info("[NanoBanana] Found image in parts")
            break
      elif hasattr(response, 'candidates') and response.candidates:
        # New API structure - check candidates
        logger.info(f"[NanoBanana] Using 'candidates' attribute, count: {len(response.candidates)}")
        for candidate in response.candidates:
          if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
            for part in candidate.content.parts:
              if hasattr(part, 'inline_data') and part.inline_data is not None:
                image = Image.open(io.BytesIO(part.inline_data.data))
                logger.info("[NanoBanana] Found image in candidates")
                break
          if image is not None:
            break
      
      if image is None:
        logger.error(f"[NanoBanana] No image found in response. Response structure: {type(response)}")
        raise RuntimeError("Model response did not include an image")
      
      logger.info("[NanoBanana] Image generated successfully")
      return image
    except Exception as e:
      logger.error(f"[NanoBanana] Error generating image: {str(e)}")
      raise


class GPTImage(ImageModel):
  def gen(self, prompt: str, ref_image: Image.Image = None):
    raise NotImplementedError


class ThreeDModel(ABC):
  @abstractmethod
  def gen(self, image: Image.Image):
    pass

class HunYuan3d(ThreeDModel):
  '''
  Doesn't work rn.
  '''
  def __init__(self) -> None:
    replicate_token = os.getenv("REPLICATE_API_KEY")
    if not replicate_token:
      raise RuntimeError("REPLICATE_API_KEY not set; place it in .env or your environment")
    self.replicate_client = replicate.Client(api_token=replicate_token)

  def gen(self, image: Image.Image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    input = {
      "image": buffer,  # file-like object will be uploaded by the client
      "remove_background": False
    }

    output = self.replicate_client.run(
      "ndreca/hunyuan3d-2.1:895e514f953d39e8b5bfb859df9313481ad3fa3a8631e5c54c7e5c9c85a6aa9f",
      input=input
    )
    return output
  

class Trellis(ThreeDModel):
  def __init__(self):
    replicate_token = os.getenv("REPLICATE_API_KEY")
    if not replicate_token:
      raise RuntimeError("REPLICATE_API_KEY not set; place it in .env or your environment")
    self.replicate_client = replicate.Client(api_token=replicate_token)

  def gen(self, image: Image.Image):
    logger.info("[Trellis] Starting 3D model generation...")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    input = {
      "images": [buffer],  # file-like objects will be uploaded by the client
      "texture_size": 2048,
      "mesh_simplify": 0.9,
      "generate_model": True,
      "save_gaussian_ply": True,
      "ss_sampling_steps": 38
    }

    logger.info("[Trellis] Calling Replicate API...")
    output = self.replicate_client.run(
        "firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c",
        input=input
    )
    logger.info(f"[Trellis] Replicate returned: type={type(output)}")
    logger.info(f"[Trellis] Replicate output structure: {output}")
    return output


IMAGE_MODELS = {
  "nanobanana": NanoBanana,
  "gptimage": GPTImage,
}

THREE_D_MODELS = {
  "hunyuan3d": HunYuan3d,
  "trellis": Trellis,
}


def generate_image(prompt: str, image_model_name: str = "nanobanana", ref_image_data: bytes = None):
  """
  Generate an image based on prompt and optional reference image.
  Returns the path to the saved image file.
  """
  logger.info(f"[generate_image] Starting: prompt='{prompt[:50]}...', model={image_model_name}, has_ref={ref_image_data is not None}")
  
  image_model_cls = IMAGE_MODELS.get(image_model_name.lower())
  if not image_model_cls:
    raise ValueError(f"Unknown image model '{image_model_name}'. Options: {list(IMAGE_MODELS)}")

  image_model = image_model_cls()
  
  ref_image = None
  if ref_image_data:
    ref_image = Image.open(io.BytesIO(ref_image_data))

  generated_image = image_model.gen(prompt, ref_image=ref_image)
  
  # Save generated image
  file_id = uuid.uuid4().hex
  filename = f"{file_id}.png"
  path = OUTPUT_DIR / filename
  generated_image.save(path, format="PNG")
  
  return {"id": file_id, "url": f"/files/{filename}", "path": str(path)}


def generate_3d(image_path_str: str, three_d_model_name: str = "trellis"):
  """
  Generate a 3D model from an existing image file path.
  """
  logger.info(f"[generate_3d] Starting: image_path={image_path_str}, model={three_d_model_name}")
  
  three_d_model_cls = THREE_D_MODELS.get(three_d_model_name.lower())
  if not three_d_model_cls:
    raise ValueError(f"Unknown 3D model '{three_d_model_name}'. Options: {list(THREE_D_MODELS)}")

  three_d_model = three_d_model_cls()
  
  # Load image
  # Handle both absolute paths and relative paths within OUTPUT_DIR
  image_path = Path(image_path_str)
  if not image_path.exists():
     # Try relative to OUTPUT_DIR if not absolute or relative to cwd
     image_path = OUTPUT_DIR / image_path_str
     
  if not image_path.exists():
      raise FileNotFoundError(f"Image file not found: {image_path_str}")

  with Image.open(image_path) as img:
      raw_output = three_d_model.gen(img)
      
  result = materialize_model_output(raw_output)
  return result


def run_pipeline(prompt: str, image_model_name: str = "nanobanana", three_d_model_name: str = "trellis"):
  '''
  Input the specific models you want and it will run the pipeline with those.
  '''
  logger.info(f"[run_pipeline] Starting pipeline: prompt='{prompt[:50]}...', image_model={image_model_name}, 3d_model={three_d_model_name}")
  
  # Step 1: Generate Image
  image_result = generate_image(prompt, image_model_name)
  image_path = image_result["path"]
  
  logger.info(f"[run_pipeline] Image generated at {image_path}, generating 3D model...")
  
  # Step 2: Generate 3D
  result = generate_3d(image_path, three_d_model_name)
  
  # Attach the intermediate image info to the result for completeness
  result["source_image"] = image_result
  
  logger.info(f"[run_pipeline] Pipeline completed: {result}")
  return result
