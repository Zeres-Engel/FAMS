"""
File upload API endpoints for FAMS
Handles xlsx file uploads to data/xlsx folder
"""
import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/upload/xlsx")
async def upload_xlsx_file(file: UploadFile = File(...)):
    """
    Upload xlsx file to data/xlsx folder
    """
    # Validate file extension
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="File must be in .xlsx format")
    
    # Create directory if not exists
    os.makedirs("data/xlsx", exist_ok=True)
    
    # Save file
    file_path = os.path.join("data/xlsx", file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return JSONResponse(
            content={
                "success": True,
                "filename": file.filename,
                "message": f"File {file.filename} uploaded successfully"
            },
            status_code=200
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}") 