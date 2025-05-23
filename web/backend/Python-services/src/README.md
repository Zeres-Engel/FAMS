# FAMS - Data Generation Module

This module provides tools for generating test data for the Faculty Administration Management System (FAMS).

## Structure

The module is organized as follows:

```
src/
├── __init__.py        # Package initialization
├── db.py              # Database connection utilities
├── main.py            # Main entry point for data generation
├── cli.py             # Command-line interface
├── utils.py           # Common utility functions
├── generators/        # Data generation modules
│   ├── __init__.py
│   ├── users.py       # User (admin, teacher, student, parent) generation
│   ├── curriculum.py  # Curriculum, subject, and semester generation
│   └── classes.py     # Class and classroom generation
└── schedule/          # Schedule generation modules
    ├── __init__.py
    ├── core.py        # Core scheduling algorithm functions
    ├── export.py      # Schedule export utilities
    └── generator.py   # High-level schedule generation
```

## Usage

### Generating All Data

To generate all data:

```python
from src.main import init_database

# Initialize the database with all data
stats = init_database()
print(f"Generated {stats['students']} students and {stats['schedules']} schedules.")
```

### Command-line Interface

The module provides a command-line interface (CLI) for more flexibility:

```bash
# Initialize the database with all data
python -m src.cli init

# Generate specific data types
python -m src.cli generate-users --admin --teachers --students --parents
python -m src.cli generate-curriculum --subjects --slots --curriculum --semesters
python -m src.cli generate-schedules

# Get help on available commands
python -m src.cli --help
```

### Selective Data Generation

You can also import specific modules to generate only certain types of data:

```python
from src.db import connect_to_mongodb
from src.generators.users import import_teachers, generate_all_students
from src.generators.curriculum import import_subjects, setup_all_curriculums
from src.schedule.generator import generate_all_schedules

# Connect to the database
client = connect_to_mongodb()
db = client["fams"]

# Import specific data
teachers, _ = import_teachers(db)
subjects = import_subjects(db)
# ...
```

## Data Files

The module uses CSV files in the `src/data/` directory as data sources:

- `subject.csv` - Subject information
- `teacher.csv` - Teacher information
- `student_class_*.csv` - Student information for each grade
- `parent.csv` - Parent information
- `room.csv` - Classroom information
- `curriculum_*.csv` - Curriculum information for each grade
- `scheduleformat.csv` - Schedule format configuration

Generated schedules are saved to the `src/data/schedules/` directory.

## Configuration

The module uses environment variables for configuration:

- `MONGO_URI` - MongoDB connection string (required)

You can set these in a `.env` file in the root directory. 