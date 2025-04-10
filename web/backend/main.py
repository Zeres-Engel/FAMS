"""
FAMS - Faculty Administration Management System
API Server and Database Initialization

This file serves as:
1. FastAPI server for the application
2. Database initialization tool
"""
import os
import uvicorn
from typing import Dict, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import datetime
import logging

from src.db import connect_to_mongodb, get_database
from src.api.init_db import init_database
from src.api.models import ResponseModel, ErrorResponseModel
from src.schedule.core import generate_schedule

# Load environment variables
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

app = FastAPI(
    title="FAMS API",
    description="Faculty Administration Management System API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base route
@app.get("/")
async def root():
    return {"message": "Welcome to FAMS API", "status": "running"}

# Initialize database API
@app.post("/api/db/init")
async def initialize_database(background_tasks: BackgroundTasks):
    """Initialize database with sample data"""
    background_tasks.add_task(init_database)
    return ResponseModel(
        "Database initialization started in background",
        "Database initialization process has been queued. Check logs for progress."
    )


# Run server
if __name__ == "__main__":
    import sys
    
    # Check if we should initialize the database
    if len(sys.argv) > 1 and sys.argv[1] == "init":
        print("Initializing database...")
        init_database()
    else:
        # Run API server
        port = int(os.getenv("PORT", "5000"))
        host = os.getenv("HOST", "0.0.0.0")
        uvicorn.run("main:app", host=host, port=port, reload=True) 