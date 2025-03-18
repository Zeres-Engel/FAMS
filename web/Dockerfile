FROM python:3.9-slim

# Cài đặt các gói phụ thuộc hệ thống
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy các tệp cấu hình đầu tiên
COPY requirements.txt .

# Cài đặt các thư viện Python
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn
COPY . .

# Mặc định mở cổng 8000
EXPOSE 8000

# Biến môi trường mặc định
ENV PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=fams.settings \
    DATABASE_URL=sqlite:///db.sqlite3 \
    DEBUG=False

# Migrate cơ sở dữ liệu và khởi động ứng dụng
CMD python manage.py migrate && \
    python manage.py collectstatic --noinput && \
    gunicorn fams.wsgi:application --bind 0.0.0.0:8000
