"""
Utility functions for the FAMS system
"""
import os
import unicodedata
import datetime
import bcrypt


def remove_accents(input_str: str) -> str:
    """Remove accents from a string"""
    s = unicodedata.normalize('NFD', input_str)
    s = s.encode('ascii', 'ignore').decode('utf-8')
    return s


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def parse_date(date_str: str):
    """Parse a date string in various formats"""
    try:
        if '/' in date_str:
            day, month, year = map(int, date_str.split('/'))
            return datetime.datetime(year, month, day)
        elif '-' in date_str:
            y, m, d = map(int, date_str.split('-'))
            return datetime.datetime(y, m, d)
    except:
        pass
    return None


def generate_username(full_name: str, id_num: int, batch: int = None, role: str = None) -> str:
    """Generate a username from a full name and ID"""
    # Handle empty names
    if not full_name or full_name.strip() == "":
        return f"user{id_num}"
    # Xử lý đặc biệt cho tiếng Việt - chuyển đ/Đ thành d/D trước khi remove_accents
    normalized_name = full_name.replace("đ", "d").replace("Đ", "D")
    
    # Loại bỏ dấu và chuyển về chữ thường
    normalized_name = remove_accents(normalized_name).lower().strip()
    
    # Tách thành các phần
    parts = normalized_name.split()
    if not parts:
        return f"user{id_num}"
    
    # Đảo ngược vì trong tiếng Việt, tên (first name) ở cuối và họ (family name) ở đầu
    first_name = parts[-1]  # Tên (last part)
    
    # Lấy chữ cái đầu của họ và tên đệm
    initials = ""
    for part in parts[:-1]:  # Tất cả các phần trừ phần cuối
        if part:
            initials += part[0]
    
    # Đảm bảo role được chuyển thành chữ thường
    if role:
        role = role.lower()
    
    # Thêm hậu tố theo role
    role_suffix = ""
    if role == "student":
        role_suffix = "st"  # Chỉ dùng 'st' không dùng 'student'
    elif role == "teacher":
        role_suffix = "tc"
    elif role == "parent":
        role_suffix = "pr"
    
    # Tạo username theo format: first_name + initials + role_suffix + [batch] + id_num
    if batch is not None:
        return f"{first_name}{initials}{role_suffix}{batch}{id_num}"
    else:
        return f"{first_name}{initials}{role_suffix}{id_num}"


def find_file_path(paths):
    """Find a file from a list of possible paths"""
    # Only use src/data path
    new_paths = [f"src/data/{os.path.basename(p)}" for p in paths]
    for p in new_paths:
        if os.path.exists(p):
            return p
    return None 