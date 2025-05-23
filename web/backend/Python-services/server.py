"""
FAMS - Faculty Administration Management System
API Server and Database Initialization

This file serves as:
1. FastAPI server for the application
2. Database initialization tool
"""
import os
import sys
import uvicorn

from src.api.app import app
from src.api.cli import init_db_command

if __name__ == "__main__":    
    # Check if we should initialize the database
    if len(sys.argv) > 1 and sys.argv[1] == "init":
        init_db_command()
    else:
        # Run API server
        port = int(os.getenv("PORT", "3000"))
        host = os.getenv("HOST", "0.0.0.0")
        
        # Tắt chế độ reload trong Docker để tránh lỗi bộ nhớ
        is_docker = os.getenv("IS_DOCKER", "false").lower() == "true"
        reload_mode = False if is_docker else True
        
        uvicorn.run("src.api.app:app", host=host, port=port, reload=reload_mode)