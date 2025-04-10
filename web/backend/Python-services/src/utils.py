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


def generate_username(full_name: str, id_num: int, batch: int = None) -> str:
    """Generate a username from a full name and ID"""
    parts = remove_accents(full_name).lower().strip().split()
    if not parts:
        return str(id_num)
    given_name = parts[-1]
    initials = "".join(part[0] for part in parts[:-1])
    if batch is not None:
        return f"{given_name}{initials}{batch}{id_num}"
    else:
        return f"{given_name}{initials}{id_num}"


def find_file_path(paths):
    """Find a file from a list of possible paths"""
    # Only use src/data path
    new_paths = [f"src/data/{os.path.basename(p)}" for p in paths]
    for p in new_paths:
        if os.path.exists(p):
            return p
    return None 