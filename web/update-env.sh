#!/bin/bash

# Script để cập nhật các biến môi trường trong tất cả các service

# Kiểm tra xem người dùng đã cung cấp tên biến môi trường và giá trị chưa
if [ $# -lt 2 ]; then
  echo "Sử dụng: $0 <tên_biến> <giá_trị>"
  echo "Ví dụ: $0 MONGO_URI mongodb://new-connection-string"
  exit 1
fi

ENV_NAME=$1
ENV_VALUE=$2

# Danh sách các file .env cần cập nhật
ENV_FILES=(
  ".env"
  "backend/NodeJS-services/.env"
  "backend/Python-services/.env"
)

# Cập nhật hoặc thêm biến môi trường vào từng file
for env_file in "${ENV_FILES[@]}"; do
  if [ -f "$env_file" ]; then
    # Kiểm tra xem biến môi trường đã tồn tại trong file chưa
    if grep -q "^$ENV_NAME=" "$env_file"; then
      # Cập nhật biến môi trường nếu đã tồn tại
      sed -i "s|^$ENV_NAME=.*|$ENV_NAME=$ENV_VALUE|" "$env_file"
    else
      # Thêm biến môi trường nếu chưa tồn tại
      echo "$ENV_NAME=$ENV_VALUE" >> "$env_file"
    fi
    echo "Đã cập nhật $ENV_NAME trong $env_file"
  else
    echo "Cảnh báo: File $env_file không tồn tại"
  fi
done

echo "Hoàn tất! Tất cả các file .env đã được cập nhật." 