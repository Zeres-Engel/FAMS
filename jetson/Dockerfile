FROM nvcr.io/nvidia/l4t-base:r35.1.0

# Cài đặt các gói cơ bản
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-dev \
    libopencv-dev \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Copy các tệp cấu hình
COPY requirements.txt .

# Cài đặt các thư viện Python
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy mã nguồn
COPY . .

# Đảm bảo mọi script có quyền thực thi
RUN chmod +x *.py

# Mặc định mở cổng 8000
EXPOSE 8000

# Biến môi trường mặc định
ENV PYTHONUNBUFFERED=1 \
    SERVER_URL=http://web:8000 \
    CAMERA_ID=0 \
    LOG_LEVEL=INFO

# Chạy ứng dụng
CMD ["python3", "app.py"]
