import os

def search_text(root_dir, text):
    text = text.lower()
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in root or '.next' in root or '.git' in root:
            continue
        for file in files:
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    if text in content:
                        print(f"FOUND IN: {path}")
            except Exception as e:
                pass

print("Searching...")
search_text('.', 'under construction')
print("Done.")
