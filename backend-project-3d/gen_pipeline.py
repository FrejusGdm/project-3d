import io
import os
import uuid
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


load_dotenv()

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

def _save_file_output(file_obj, suffix=".ply"):
  """Persist a Replicate FileOutput (or any file-like with read()) and return (id, path)."""
  file_id = uuid.uuid4().hex
  path = OUTPUT_DIR / f"{file_id}{suffix}"
  with open(path, "wb") as f:
    f.write(file_obj.read())
  return file_id, path


def materialize_model_output(model_output):
  """
  Convert a model_output dict from Replicate into a standardized payload:
  { "format": "<ext>", "location": "file", "path": "<relative path>" }
  """
  if isinstance(model_output, list):
    for value in model_output:
      if hasattr(value, "read"):
        file_id, path = _save_file_output(value, suffix=".ply")
        return {"id": file_id, "format": "ply", "location": "file", "path": str(path)}
    raise ValueError("No file-like objects found in list output")

  if not isinstance(model_output, dict):
    raise ValueError("Expected model_output to be a dict of outputs")

  preferred_keys = [
    ("model_file", ".ply"),
    ("gaussian_ply", ".ply"),
  ]

  for key, suffix in preferred_keys:
    if key in model_output:
      file_obj = model_output[key]
      if hasattr(file_obj, "read"):
        file_id, path = _save_file_output(file_obj, suffix=suffix)
        return {"id": file_id, "format": suffix.lstrip("."), "location": "file", "path": str(path)}

  # Fallback: first file-like value we can read
  for value in model_output.values():
    if hasattr(value, "read"):
      file_id, path = _save_file_output(value, suffix=".ply")
      return {"id": file_id, "format": "ply", "location": "file", "path": str(path)}

  raise ValueError("Could not find a file-like output in model_output")


class ImageModel(ABC):
  @abstractmethod
  def gen(self, prompt: str):
    pass


class NanoBanana(ImageModel):
  def __init__(self) -> None:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
      raise RuntimeError("GOOGLE_API_KEY not set; place it in .env or your environment")
    self.client = genai.Client(api_key=api_key)
    self.model = "gemini-2.5-flash-image"

  def gen(self, prompt: str):
    response = self.client.models.generate_content(
        model=self.model,
        contents=[prompt],
    )

    image = None
    # Handle different response structures
    if hasattr(response, 'parts') and response.parts:
      # Old API structure
      for part in response.parts:
        if hasattr(part, 'inline_data') and part.inline_data is not None:
          image = Image.open(io.BytesIO(part.inline_data.data))
          break
    elif hasattr(response, 'candidates') and response.candidates:
      # New API structure - check candidates
      for candidate in response.candidates:
        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
          for part in candidate.content.parts:
            if hasattr(part, 'inline_data') and part.inline_data is not None:
              image = Image.open(io.BytesIO(part.inline_data.data))
              break
        if image is not None:
          break
    
    if image is None:
      raise RuntimeError("Model response did not include an image")
    return image


class GPTImage(ImageModel):
  def gen(self, prompt: str):
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

    output = self.replicate_client.run(
        "firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c",
        input=input
    )
    return output


IMAGE_MODELS = {
  "nanobanana": NanoBanana,
  "gptimage": GPTImage,
}

THREE_D_MODELS = {
  "hunyuan3d": HunYuan3d,
  "trellis": Trellis,
}


def run_pipeline(prompt: str, image_model_name: str = "nanobanana", three_d_model_name: str = "trellis"):
  '''
  Input the specific models you want and it will run the pipeline with those.
  '''
  image_model_cls = IMAGE_MODELS.get(image_model_name.lower())
  three_d_model_cls = THREE_D_MODELS.get(three_d_model_name.lower())
  if not image_model_cls:
    raise ValueError(f"Unknown image model '{image_model_name}'. Options: {list(IMAGE_MODELS)}")
  if not three_d_model_cls:
    raise ValueError(f"Unknown 3D model '{three_d_model_name}'. Options: {list(THREE_D_MODELS)}")

  image_model = image_model_cls()
  three_d_model = three_d_model_cls()

  generated_image = image_model.gen(prompt)
  raw_output = three_d_model.gen(generated_image)
  return materialize_model_output(raw_output)
