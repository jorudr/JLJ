import os
import re
from collections import defaultdict

src_dir = 'src'
components_dir = 'src/shared/ui/components'
components = [f for f in os.listdir(components_dir) if f.endswith('.vue')]

usage = defaultdict(set)

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.vue') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                for comp in components:
                    comp_name = comp[:-4]
                    if comp_name in content:
                        usage[comp].add(filepath)

for comp, files in usage.items():
    print(f"{comp}:")
    for f in sorted(files):
        print(f"  - {f}")
    print()
