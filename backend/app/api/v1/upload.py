import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif",
    ".docx", ".doc", ".xlsx", ".csv", ".txt", ".md", ".zip"
}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' is not permitted. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Generate a unique safe filename
    unique_name = f"{uuid.uuid4().hex[:12]}_{filename.replace(' ', '_')}"
    dest_path = os.path.join(UPLOAD_DIR, unique_name)

    # Read and check size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 25MB")

    with open(dest_path, "wb") as f:
        f.write(contents)

    file_url = f"/uploads/{unique_name}"
    return {
        "url": file_url,
        "filename": filename,
        "size": len(contents),
        "content_type": file.content_type,
    }
