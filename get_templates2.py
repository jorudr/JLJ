import re

with open('./src/widgets/genesis/ui/ExGenesisLog.vue', 'r') as f:
    content = f.read()

matches = re.finditer(r'\{\{(.+?)\}\}', content)
for m in matches:
    print(m.group(1).strip())
