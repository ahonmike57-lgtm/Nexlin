import os

def search_text(root_dir, text):
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in root or '.next' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        if text in f.read():
                            print(f"FOUND IN: {path}")
                except Exception as e:
                    pass

search_text('.', 'This section is under construction')
search_text('.', 'under construction')
