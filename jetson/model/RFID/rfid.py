import time
import threading

class RFID:
    def __init__(self):
        # Thông tin RFID hiện tại
        self.current_id = None
        self.id_callback = None
        
        # Database ánh xạ RFID ID -> Tên người dùng
        self.rfid_database = {
            "0005563074": "Thanh"
        }
        
        # Cấu hình listener
        self.listening = True
        self.input_buffer = ""
        self.last_key_time = 0
        self.listener_thread = None
        self.timeout = 0.3  # Giảm timeout để nhận diện nhanh hơn
    
    def start_listening(self):
        """Bắt đầu lắng nghe input RFID từ keyboard"""
        self.listening = True
        self.listener_thread = threading.Thread(target=self._keyboard_listener)
        self.listener_thread.daemon = True
        self.listener_thread.start()
        print("RFID listener started")
    
    def stop_listening(self):
        """Dừng lắng nghe RFID input"""
        self.listening = False
        if self.listener_thread:
            self.listener_thread.join(timeout=1.0)
    
    def set_callback(self, callback):
        """Set callback function khi RFID được quét"""
        self.id_callback = callback
    
    def _keyboard_listener(self):
        """Lắng nghe input từ bàn phím mô phỏng máy quét RFID"""
        try:
            import keyboard
            
            def on_key(event):
                current_time = time.time()
                
                # Nếu quá timeout, xóa buffer
                if current_time - self.last_key_time > self.timeout:
                    self.input_buffer = ""
                
                self.last_key_time = current_time
                
                # Xử lý các phím có thể là một phần của mã RFID
                if event.name.isdigit() or event.name.isalpha() or event.name in ['-', '_']:
                    self.input_buffer += event.name
                
                # Xử lý phím Enter hoặc tự động khi quá timeout
                elif event.name == "enter" and self.input_buffer:
                    self._process_rfid_code()
            
            # Kiểm tra timeout để xử lý RFID code
            def check_timeout():
                while self.listening:
                    current_time = time.time()
                    if self.input_buffer and (current_time - self.last_key_time > self.timeout):
                        self._process_rfid_code()
                    time.sleep(0.1)
            
            # Khởi động thread kiểm tra timeout
            timeout_thread = threading.Thread(target=check_timeout)
            timeout_thread.daemon = True
            timeout_thread.start()
            
            # Đăng ký hook bàn phím
            keyboard.on_press(on_key)
            
            # Giữ thread alive
            while self.listening:
                time.sleep(0.1)
                
        except ImportError:
            print("Vui lòng cài đặt thư viện 'keyboard': pip install keyboard")
    
    def _process_rfid_code(self):
        """Xử lý mã RFID sau khi nhận đủ"""
        if not self.input_buffer:
            return
            
        # Loại bỏ "enter" từ cuối mã RFID nếu có
        rfid_code = self.input_buffer.strip()
        if rfid_code.lower().endswith("enter"):
            rfid_code = rfid_code[:-5]
            
        print(f"Đã nhận mã RFID: {rfid_code}")
        
        # Lưu mã hiện tại và gọi callback
        self.current_id = rfid_code
        if self.id_callback:
            self.id_callback(self.current_id)
            
        self.input_buffer = ""
    
    def get_name_from_id(self, rfid_id):
        """Lấy tên người từ ID RFID"""
        return self.rfid_database.get(rfid_id, "Unknown")
    
    def verify_identity(self, rfid_id, face_name):
        """Xác thực ID RFID và kết quả nhận diện khuôn mặt"""
        rfid_name = self.get_name_from_id(rfid_id)
        
        # Tính độ tương đồng dựa trên tên
        match = rfid_name.lower() == face_name.lower()  # Case insensitive
        
        return {
            "match": match,
            "rfid_name": rfid_name,
            "face_name": face_name
        }
        
    def add_rfid_user(self, rfid_id, name):
        """Thêm người dùng mới vào database RFID"""
        self.rfid_database[rfid_id] = name
        print(f"Đã thêm người dùng: {name} với ID RFID: {rfid_id}")
        return True