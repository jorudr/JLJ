import os

PUBLIC_DIR = "public"
SRC_DIR = "src"

# Get all files in public
public_files = []
for root, dirs, files in os.walk(PUBLIC_DIR):
    for f in files:
        if f == ".DS_Store": continue
        public_files.append(os.path.join(root, f))

# Get all source text
src_content = ""
for root, dirs, files in os.walk(SRC_DIR):
    for f in files:
        if f.endswith(('.DS_Store')): continue
        filepath = os.path.join(root, f)
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                src_content += file.read() + "\n"
        except UnicodeDecodeError:
            pass # ignore binary files in src

# Also add root files like nuxt.config.ts, package.json
for f in os.listdir("."):
    if os.path.isfile(f) and f.endswith(('.ts', '.json', '.html', '.cjs', '.js')):
        try:
            with open(f, 'r', encoding='utf-8') as file:
                src_content += file.read() + "\n"
        except:
            pass

unused_files = []
used_files = []

for pfile in public_files:
    basename = os.path.basename(pfile)
    rel_path = os.path.relpath(pfile, PUBLIC_DIR).replace("\\", "/")
    
    # We check if the basename is in src_content
    # or the relative path without public
    # E.g., 'assets/ui/tactical_chart_preview.png'
    # we can just check if basename is in src_content
    if basename in src_content:
        used_files.append(pfile)
    elif "robots.txt" in basename or "latest.json" in basename or "favicon" in basename:
        # Don't delete standard public files
        used_files.append(pfile)
    else:
        unused_files.append(pfile)

print(f"Total public files: {len(public_files)}")
print(f"Used public files: {len(used_files)}")
print(f"Unused public files: {len(unused_files)}")

# Delete unused files
for f in unused_files:
    os.remove(f)

# Delete empty directories in public
for root, dirs, files in os.walk(PUBLIC_DIR, topdown=False):
    for name in dirs:
        dir_path = os.path.join(root, name)
        if not os.listdir(dir_path):
            os.rmdir(dir_path)

print("Cleanup complete.")
