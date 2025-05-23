import time
import threading
import json
import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from utils.config_utils import config

class RFID:
    def __init__(self):
        # Thông tin RFID hiện tại
        self.current_id = None
        self.id_callback = None
        self.last_scan_time = 0
        self.last_scan_id = None
        self.min_scan_interval = 2.0  # Khoảng thời gian tối thiểu giữa các lần quét cùng thẻ (giây)
        
        # Đọc database từ file JSON
        self.rfid_database = self._load_rfid_database()
        
        # Cấu hình listener
        self.listening = True
        self.input_buffer = ""
        self.last_key_time = 0
        self.listener_thread = None
        self.timeout = 0.8  # Tăng timeout để đảm bảo phần đọc đủ và không bị cắt
        self.debug_mode = False  # Chế độ debug để xem từng key được nhận
        self.show_keys = False   # Không hiển thị từng phím nữa
    
    def _load_rfid_database(self):
        """Đọc database RFID từ file JSON"""
        try:
            rfid_file = config.data.rfid_file
            if os.path.exists(rfid_file):
                with open(rfid_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                print(f"Warning: RFID database file not found at {rfid_file}")
                return {}
        except Exception as e:
            print(f"Error loading RFID database: {e}")
    
    def _save_rfid_database(self):
        """Lưu database RFID vào file JSON"""
        try:
            rfid_file = config.data.rfid_file
            os.makedirs(os.path.dirname(rfid_file), exist_ok=True)
            
            with open(rfid_file, 'w', encoding='utf-8') as f:
                json.dump(self.rfid_database, f, indent=4, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error saving RFID database: {e}")
            return False
    
    def start_listening(self):
        """Bắt đầu lắng nghe input RFID từ keyboard"""
        self.listening = True
        self.listener_thread = threading.Thread(target=self._keyboard_listener)
        self.listener_thread.daemon = True
        self.listener_thread.start()
        print("RFID listener started in keyboard emulation mode")
    
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
                # Xử lý riêng cho Enter/Return (nhiều RFID reader gửi kèm newline)
                if event.name == "enter" or event.name == "\n" or event.name == "\r" or event.scan_code == 28:
                    # Kiểm tra nếu buffer có dữ liệu thì xử lý như một mã RFID hoàn chỉnh
                    if self.input_buffer:
                        if self.debug_mode:
                            print(f"Enter/Newline detected, processing RFID code: {self.input_buffer}")
                        self._process_rfid_code()
                    return
                
                # Xử lý các phím khác
                current_time = time.time()
                # Nếu quá timeout, xóa buffer
                if current_time - self.last_key_time > self.timeout and self.input_buffer:
                    if self.debug_mode:
                        print(f"Timeout reset, discarding buffer: {self.input_buffer}")
                    self.input_buffer = ""
                
                self.last_key_time = current_time
                
                # Debug mode to see each key (chỉ hiển thị nếu show_keys=True)
                if self.debug_mode and self.show_keys:
                    key_char = event.name
                    ascii_val = ord(key_char) if len(key_char) == 1 else f"scan_code={event.scan_code}"
                    print(f"Key detected: {key_char}, ASCII/Code: {ascii_val}")
                
                # Chỉ xử lý các ký tự hợp lệ cho mã RFID
                if event.name.isdigit() or event.name.isalpha() or event.name in ['-', '_']:
                    self.input_buffer += event.name
                    if self.debug_mode and self.show_keys:
                        print(f"Current buffer: {self.input_buffer}")
            
            # Đăng ký hook bàn phím  
            keyboard.on_press(on_key)
            
            # Giữ thread alive và xử lý timeout
            while self.listening:
                time.sleep(0.1)
                
                # Kiểm tra buffer timeout cho trường hợp không phát hiện được Enter/newline
                current_time = time.time()
                if self.input_buffer and (current_time - self.last_key_time > self.timeout):
                    if self.debug_mode:
                        print(f"Processing buffer by timeout (no newline detected): {self.input_buffer}")
                    self._process_rfid_code()
                
        except ImportError:
            print("Vui lòng cài đặt thư viện 'keyboard': pip install keyboard")
            print("Chạy lệnh: pip install keyboard")
        except Exception as e:
            print(f"Error in RFID keyboard listener: {e}")
    
    def _process_rfid_code(self):
        """Xử lý mã RFID sau khi nhận đủ"""
        if not self.input_buffer:
            return
            
        # Loại bỏ ký tự không mong muốn
        rfid_code = self.input_buffer.strip()
        self.input_buffer = ""
        
        # Kiểm tra độ dài hợp lý của mã RFID (thường từ 5-20 ký tự)
        if len(rfid_code) < 3 or len(rfid_code) > 30:
            print(f"Ignoring invalid RFID code length: {len(rfid_code)} chars")
            return
        
        # Kiểm tra xem thẻ này đã được quét gần đây chưa (tránh quét 2 lần)
        current_time = time.time()
        if (self.last_scan_id == rfid_code and 
            current_time - self.last_scan_time < self.min_scan_interval):
            print(f"Ignoring duplicate scan of RFID: {rfid_code} (within {self.min_scan_interval}s)")
            return
            
        # Cập nhật thời gian quét và ID
        self.last_scan_time = current_time
        self.last_scan_id = rfid_code
        
        # Lưu mã hiện tại
        self.current_id = rfid_code
        print(f"RFID DETECTED: {rfid_code} ✓")
        
        # Gọi callback để tiếp tục quy trình xác thực
        if self.id_callback:
            try:
                self.id_callback(self.current_id)
                print(f"Callback executed successfully for RFID: {rfid_code}")
            except Exception as e:
                print(f"Error in RFID callback: {e}")
    
    def get_name_from_id(self, rfid_id):
        """Lấy tên người từ ID RFID"""
        name = self.rfid_database.get(rfid_id, "Unknown")
        print(f"Looking up RFID {rfid_id} → Found name: {name}")
        return name
    
    def verify_identity(self, rfid_id, face_name):
        """Xác thực ID RFID và kết quả nhận diện khuôn mặt"""
        rfid_name = self.get_name_from_id(rfid_id)
        
        # Tính độ tương đồng dựa trên tên
        match = rfid_name.lower() == face_name.lower()  # Case insensitive
        
        result = {
            "match": match,
            "rfid_name": rfid_name,
            "face_name": face_name
        }
        
        print(f"Verification result: RFID={rfid_name}, Face={face_name}, Match={match}")
        return result
        
    def add_rfid_user(self, rfid_id, name):
        """Thêm người dùng mới vào database RFID"""
        self.rfid_database[rfid_id] = name
        self._save_rfid_database()  # Lưu lại vào file
        print(f"Đã thêm người dùng: {name} với ID RFID: {rfid_id}")
        return True
        
    def enable_debug(self, enable=True, show_keys=False):
        """
        Bật/tắt chế độ debug để xem thông tin nhận dạng phím
        
        Args:
            enable: True để bật debug mode
            show_keys: True để hiển thị từng phím nhấn (mặc định False)
        """
        self.debug_mode = enable
        self.show_keys = show_keys
        print(f"RFID debug mode: {'ON' if enable else 'OFF'}, Show keys: {'ON' if show_keys else 'OFF'}")