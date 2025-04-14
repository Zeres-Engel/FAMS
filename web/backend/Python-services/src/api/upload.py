"""
File upload API endpoints for FAMS
Handles xlsx file uploads to data/xlsx folder
"""
import os
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()
logger = logging.getLogger(__name__)

def get_upload_dir():
    """Get the upload directory path"""
    # In Docker, we use absolute path
    upload_dir = "/app/data/xlsx"
    logger.info(f"Upload directory: {upload_dir}")
    return upload_dir

@router.get("/upload/list")
async def list_uploaded_files():
    """List all uploaded files"""
    upload_dir = get_upload_dir()
    try:
        if not os.path.exists(upload_dir):
            logger.warning(f"Upload directory does not exist: {upload_dir}")
            # Try to create the directory
            os.makedirs(upload_dir, exist_ok=True)
            logger.info(f"Created upload directory: {upload_dir}")
        
        files = []
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            file_stat = os.stat(file_path)
            files.append({
                "filename": filename,
                "path": file_path,
                "size": file_stat.st_size,
                "created": file_stat.st_ctime,
                "modified": file_stat.st_mtime,
                "exists": os.path.exists(file_path)
            })
        
        return JSONResponse(
            content={
                "success": True,
                "directory": upload_dir,
                "files": files,
                "total_files": len(files)
            },
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        return JSONResponse(
            content={
                "success": False,
                "error": str(e),
                "directory": upload_dir
            },
            status_code=500
        )

@router.post("/upload/xlsx")
async def upload_xlsx_file(file: UploadFile = File(...)):
    """
    Upload xlsx file to data/xlsx folder
    """
    # Validate file extension
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="File must be in .xlsx format")
    
    # Get upload directory
    upload_dir = get_upload_dir()
    
    # Create directory if not exists
    os.makedirs(upload_dir, exist_ok=True)
    logger.info(f"Using upload directory: {upload_dir}")
    
    # Save file
    file_path = os.path.join(upload_dir, file.filename)
    logger.info(f"Saving file to: {file_path}")
    
    try:
        # Ensure the file is closed after writing
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Verify file exists and get its size
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            logger.info(f"File verified at: {file_path} (size: {file_size} bytes)")
            return JSONResponse(
                content={
                    "success": True,
                    "filename": file.filename,
                    "message": f"File {file.filename} uploaded successfully",
                    "path": file_path,
                    "size": file_size,
                    "directory": upload_dir
                },
                status_code=200
            )
        else:
            logger.error(f"File was not saved correctly: {file_path}")
            raise HTTPException(status_code=500, detail="File was not saved correctly")
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}") 