# Nginx Reverse Proxy Configuration

Cấu hình Nginx reverse proxy cho dự án FAMS với domain fams.io.vn.

## Cấu trúc thư mục

- `conf.d/`: Chứa file cấu hình Nginx
- `ssl/`: Thư mục cho chứng chỉ SSL
- `logs/`: File log của Nginx

## Cấu hình Domain fams.io.vn

Đã cấu hình sẵn domain fams.io.vn trong file `conf.d/default.conf`. Bạn cần:

1. Trỏ DNS của domain fams.io.vn đến địa chỉ IP của server:
   - Tạo bản ghi A cho fams.io.vn trỏ đến IP của server
   - Tạo bản ghi A cho www.fams.io.vn trỏ đến IP của server

2. Thiết lập chứng chỉ SSL cho domain:

### Cách 1: Sử dụng Let's Encrypt (Khuyến nghị)

```bash
# Cài đặt Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Tạo chứng chỉ (thay thế domain và email)
sudo certbot --nginx -d fams.io.vn -d www.fams.io.vn -m your-email@example.com --agree-tos

# Sao chép chứng chỉ vào thư mục nginx/ssl
sudo cp /etc/letsencrypt/live/fams.io.vn/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/fams.io.vn/privkey.pem ./nginx/ssl/
sudo chmod 644 ./nginx/ssl/fullchain.pem
sudo chmod 600 ./nginx/ssl/privkey.pem
```

### Cách 2: Sử dụng chứng chỉ đã có

Nếu bạn đã có chứng chỉ SSL:

1. Đặt file chứng chỉ và key vào thư mục `nginx/ssl/`:
   - `fullchain.pem`: File chứng chỉ đầy đủ (bao gồm cả chứng chỉ trung gian)
   - `privkey.pem`: File private key

2. Đảm bảo quyền truy cập phù hợp:
   ```bash
   chmod 644 ./nginx/ssl/fullchain.pem
   chmod 600 ./nginx/ssl/privkey.pem
   ```

## Kiểm tra cấu hình Nginx

Bạn có thể kiểm tra cấu hình Nginx trước khi triển khai:

```bash
docker-compose exec nginx nginx -t
```

## Khởi động ứng dụng

Khởi động với Docker Compose:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Ứng dụng sẽ khả dụng tại:
- https://fams.io.vn
- https://www.fams.io.vn

## Tự động gia hạn chứng chỉ Let's Encrypt

Nếu bạn sử dụng Let's Encrypt, hãy thiết lập cron job để tự động gia hạn chứng chỉ:

```bash
# Thêm cron job
echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/fams.io.vn/fullchain.pem /path/to/project/nginx/ssl/ && cp /etc/letsencrypt/live/fams.io.vn/privkey.pem /path/to/project/nginx/ssl/ && docker-compose exec nginx nginx -s reload" | sudo tee -a /etc/crontab
```

Lệnh này sẽ:
1. Chạy mỗi ngày lúc 3 giờ sáng
2. Gia hạn chứng chỉ nếu cần
3. Sao chép chứng chỉ mới vào thư mục project
4. Tải lại cấu hình Nginx 