import os
import re

def fix_datetime_utcnow(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if utcnow() exists
    if 'utcnow()' not in content:
        return
    
    # Add timezone to imports if needed
    if 'from datetime import datetime' in content and 'timezone' not in content:
        content = content.replace('from datetime import datetime', 'from datetime import datetime, timezone')
    elif 'import datetime' in content and 'from datetime import datetime' not in content:
        # If they use datetime.datetime.utcnow()
        pass 

    # Replace utcnow() with now(timezone.utc) or datetime.now(datetime.timezone.utc)
    # Case 1: datetime.utcnow() -> datetime.now(timezone.utc) (assuming timezone is imported)
    content = re.sub(r'datetime\.utcnow\(\)', 'datetime.now(timezone.utc)', content)
    
    # Case 2: If timezone wasn't imported but datetime was imported as a module
    # We might need to handle datetime.datetime.utcnow() -> datetime.datetime.now(datetime.timezone.utc)
    content = re.sub(r'datetime\.datetime\.utcnow\(\)', 'datetime.datetime.now(datetime.timezone.utc)', content)

    with open(file_path, 'w') as f:
        f.write(content)

def main():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith('.py'):
                fix_datetime_utcnow(os.path.join(root, file))
    for root, dirs, files in os.walk('tests'):
        for file in files:
            if file.endswith('.py'):
                fix_datetime_utcnow(os.path.join(root, file))

if __name__ == '__main__':
    main()
