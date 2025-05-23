"""
Application configuration for FAMS API
Contains FastAPI configuration and middleware setup
"""
import os
import logging
import threading
import time
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .base import router as base_router
from .database import router as db_router
from .user_management import router as user_management_router
from .schedule import router as schedule_router
from .attendance import router as attendance_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Biến theo dõi xem thread đã được khởi tạo chưa
background_thread_started = False

# Hàm chạy định kỳ để khởi tạo FAMS
def periodic_init_fams():
    from .database import init_fams_with_sample_data
    
    while True:
        try:
            logging.info("Chạy tự động khởi tạo FAMS theo lịch trình (2 tiếng/lần)")
            # Chạy hàm khởi tạo bất đồng bộ
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(init_fams_with_sample_data())
            loop.close()
            logging.info("Hoàn thành khởi tạo FAMS theo lịch trình")
        except Exception as e:
            logging.error(f"Lỗi khi chạy tự động khởi tạo FAMS: {str(e)}")
            import traceback
            logging.error(traceback.format_exc())
        
        # Ngủ 2 tiếng (7200 giây) trước khi chạy lại
        time.sleep(7200)

def create_application() -> FastAPI:
    """Create and configure FastAPI application"""
    application = FastAPI(
        title="FAMS API",
        description="Faculty Administration Management System API",
        version="1.0.0"
    )

    # Configure CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Adjust in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    application.include_router(base_router)
    application.include_router(db_router, prefix="/api/db", tags=["database"])
    application.include_router(user_management_router, prefix="/api/users", tags=["users"])
    application.include_router(schedule_router, prefix="/api/schedules", tags=["schedules"])
    application.include_router(attendance_router, prefix="/api/attendance", tags=["attendance"])

    # Khởi động thread chạy định kỳ hàm khởi tạo FAMS
    global background_thread_started
    if not background_thread_started:
        background_thread = threading.Thread(
            target=periodic_init_fams,
            daemon=True  # Đảm bảo thread sẽ kết thúc khi chương trình chính kết thúc
        )
        background_thread.start()
        background_thread_started = True
        logging.info("Đã khởi động thread chạy tự động khởi tạo FAMS mỗi 2 tiếng")

    return application

# Create app instance
app = create_application()