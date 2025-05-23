"""
Subject-Teacher Matching Module for FAMS
Handles matching between teacher majors and subjects with Vietnamese accent normalization
"""
import unicodedata
import re
import logging

logger = logging.getLogger(__name__)

def normalize_text(text):
    """
    Normalize Vietnamese text by removing accents and converting to lowercase
    
    Args:
        text: Text to normalize
        
    Returns:
        str: Normalized text without accents, all lowercase
    """
    if not text:
        return ""
    text = str(text).lower()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if not unicodedata.combining(c))
    # Remove non-alphanumeric characters except spaces
    text = re.sub(r'[^\w\s]', ' ', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Comprehensive subject mappings for Vietnamese high school curriculum
SUBJECT_MAPPINGS = {
    # Math subjects
    "toan": ["toan", "dai so", "hinh hoc", "giai tich", "mathematics", "math", "toan hoc", "ths toan", "ts toan", "thac si toan", "tien si toan"],
    
    # Physics
    "vatly": ["vat ly", "vatly", "ly", "physics", "ths vatly", "ts vatly", "thac si vat ly", "tien si vat ly", "vl"],
    
    # Chemistry
    "hoahoc": ["hoa", "hoahoc", "hoa hoc", "chemistry", "ths hoahoc", "ts hoahoc", "thac si hoa hoc", "tien si hoa hoc", "hh"],
    
    # Biology
    "sinhhoc": ["sinh", "sinhhoc", "sinh hoc", "biology", "ths sinhhoc", "ts sinhhoc", "thac si sinh hoc", "tien si sinh hoc", "sh"],
    
    # History
    "lichsu": ["su", "lichsu", "lich su", "history", "ths lichsu", "ts lichsu", "thac si lich su", "tien si lich su", "ls"],
    
    # Geography
    "dialy": ["dia", "dialy", "dia ly", "geography", "ths dialy", "ts dialy", "thac si dia ly", "tien si dia ly", "dl"],
    
    # Literature
    "vanhoc": ["van", "vanhoc", "van hoc", "ngu van", "nguvan", "literature", "ths vanhoc", "ts vanhoc", "thac si van hoc", "tien si van hoc", "vh", "ngữ văn"],
    
    # English
    "tienganh": ["anh", "tienganh", "tieng anh", "english", "ths tienganh", "ts tienganh", "thac si tieng anh", "tien si tieng anh", "ta"],
    
    # Informatics/Computer Science
    "tinhoc": ["tin", "tinhoc", "tin hoc", "cntt", "cong nghe thong tin", "it", "informatics", "computer science", "ths tinhoc", "ts tinhoc", "thac si tin hoc", "tien si tin hoc", "th"],
    
    # Technology
    "congnghe": ["cong nghe", "congnghe", "technology", "ths congnghe", "ts congnghe", "thac si cong nghe", "tien si cong nghe", "cn"],
    
    # Civics/Citizenship
    "gdcd": ["gdcd", "giao duc cong dan", "giaoduccongdan", "civics", "citizenship", "ths gdcd", "ts gdcd", "thac si giao duc cong dan", "tien si giao duc cong dan"],
    
    # Physical Education
    "theduc": ["theduc", "the duc", "td", "physical education", "pe", "ths theduc", "ts theduc", "thac si the duc", "tien si the duc"],
    
    # Music
    "amnhac": ["amnhac", "am nhac", "music", "ths amnhac", "ts amnhac", "thac si am nhac", "tien si am nhac", "an"],
    
    # Art
    "mythuat": ["mythuat", "my thuat", "hoa si", "artist", "art", "ths mythuat", "ts mythuat", "thac si my thuat", "tien si my thuat", "mt"],
    
    # Defense Education
    "gdqp": ["gdqp", "giao duc quoc phong", "giaoducquocphong", "defense education", "ths gdqp", "ts gdqp", "thac si giao duc quoc phong", "tien si giao duc quoc phong"],
    
    # Foreign Languages
    "ngoaingu": ["ngoaingu", "ngoai ngu", "foreign language", "ths ngoaingu", "ts ngoaingu", "thac si ngoai ngu", "tien si ngoai ngu", "nn"],
    
    # French
    "tiengphap": ["phap", "tiengphap", "tieng phap", "french", "ths tiengphap", "ts tiengphap", "thac si tieng phap", "tien si tieng phap", "tp"],
    
    # Chinese
    "tienghoa": ["hoa", "tienghoa", "tieng hoa", "chinese", "ths tienghoa", "ts tienghoa", "thac si tieng hoa", "tien si tieng hoa", "th"],
    
    # Japanese
    "tiengnhat": ["nhat", "tiengnhat", "tieng nhat", "japanese", "ths tiengnhat", "ts tiengnhat", "thac si tieng nhat", "tien si tieng nhat", "tn"],
    
    # Korean
    "tienghan": ["han", "tienghan", "tieng han", "korean", "ths tienghan", "ts tienghan", "thac si tieng han", "tien si tieng han", "tk"],
    
    # Russian
    "tiengnga": ["nga", "tiengnga", "tieng nga", "russian", "ths tiengnga", "ts tiengnga", "thac si tieng nga", "tien si tieng nga", "tn"],
    
    # German
    "tiengduc": ["duc", "tiengduc", "tieng duc", "german", "ths tiengduc", "ts tiengduc", "thac si tieng duc", "tien si tieng duc", "td"],
    
    # Philosophy
    "trietly": ["trietly", "triet ly", "triet", "philosophy", "ths trietly", "ts trietly", "thac si triet ly", "tien si triet ly", "tl"],
    
    # Economics
    "kinhte": ["kinhte", "kinh te", "kt", "economics", "ths kinhte", "ts kinhte", "thac si kinh te", "tien si kinh te"],
    
    # Psychology
    "tamly": ["tamly", "tam ly", "tamlyhocsupham", "tam ly hoc su pham", "psychology", "ths tamly", "ts tamly", "thac si tam ly", "tien si tam ly", "tl"],
    
    # Social Sciences
    "xahoi": ["xahoi", "xa hoi", "social studies", "social sciences", "ths xahoi", "ts xahoi", "thac si xa hoi", "tien si xa hoi", "xh"]
}

def match_teacher_to_subject(teacher_major, subject_name, similarity_threshold=0.6):
    """
    Match teacher major to subject with Vietnamese accent normalization
    
    Args:
        teacher_major: Teacher's area of expertise
        subject_name: Name of the subject
        similarity_threshold: Minimum similarity score (0-1) to consider a match
        
    Returns:
        bool: True if there's a match, False otherwise
    """
    if not teacher_major or not subject_name:
        return False
    
    # Normalize both texts
    normalized_major = normalize_text(teacher_major)
    normalized_subject = normalize_text(subject_name)
    
    # Log for debugging
    logger.debug(f"Matching subject: '{subject_name}' ({normalized_subject}) with teacher major: '{teacher_major}' ({normalized_major})")
    
    # Direct match check
    if normalized_subject in normalized_major or normalized_major in normalized_subject:
        logger.debug(f"Direct match found between {normalized_subject} and {normalized_major}")
        return True
    
    # Check for word-level matches
    subject_words = normalized_subject.split()
    major_words = normalized_major.split()
    for word in subject_words:
        if len(word) > 3 and word in major_words:
            logger.debug(f"Word-level match found: '{word}' is in both subject and major")
            return True
    
    # Check against subject mappings
    for key, values in SUBJECT_MAPPINGS.items():
        # First check if the subject matches this category
        subject_match = key in normalized_subject or any(val in normalized_subject for val in values)
        
        # Then check if the teacher's major matches this category
        major_match = key in normalized_major or any(val in normalized_major for val in values)
        
        if subject_match and major_match:
            logger.debug(f"Mapping match found: Both subject and major match category '{key}'")
            return True
    
    # No match found
    logger.debug(f"No match found between subject '{subject_name}' and major '{teacher_major}'")
    return False

def get_matching_teachers(teachers, subject_name):
    """
    Find teachers that match a given subject
    
    Args:
        teachers: List of teacher objects with "major" field
        subject_name: Name of the subject
        
    Returns:
        list: Sorted list of matching teachers (best matches first)
    """
    if not teachers or not subject_name:
        return []
    
    matching_teachers = []
    for teacher in teachers:
        major = teacher.get("major", "")
        if match_teacher_to_subject(major, subject_name):
            # Store the teacher with a match indicator
            matching_teachers.append(teacher)
    
    # Sort by weeklyCapacity to prioritize teachers with more available time
    return sorted(matching_teachers, key=lambda t: t.get("weeklyCapacity", 0), reverse=True) 