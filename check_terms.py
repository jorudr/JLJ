import re

with open('/Users/evanvosh/Documents/app1.1/src/shared/ui/components/ExEquityCurve3D.vue', 'r') as f:
    content = f.read()

# Extract all formulas
formulas = re.findall(r"formula:\s*'(.*?)'", content)

# Extract terms dictionary
terms_match = re.search(r"const terms: Record<string, \{ key: string, format: string, source\?: string \}> = \{(.*?)\};", content, re.DOTALL)
if terms_match:
    terms_block = terms_match.group(1)
    mapped_terms = re.findall(r"'([^']+)':", terms_block)
else:
    mapped_terms = []

print("Mapped terms:", len(mapped_terms))

unmapped = set()
for formula in formulas:
    # Remove all mapped terms from the formula
    remaining = formula
    for term in sorted(mapped_terms, key=len, reverse=True):
        if re.match(r'^[a-zA-Z]+$', term):
            remaining = re.sub(r'\b' + term + r'\b', '', remaining)
        else:
            remaining = remaining.replace(term, '')
    
    # Extract remaining words (variables)
    words = re.findall(r'[a-zA-ZΔαβ_]+', remaining)
    for w in words:
        if w not in ['Max', 'Min', 'Count', 'Streak', 'Σ', 'Sqrt', 'P95', 'P05', 'P50', 'Cov', 'Var', 'SS', 'res', 'tot', 'P02', 'P97', 'P', 'E', 'f', 'log', 'Log', 'Average']:
            unmapped.add(w)

print("Potentially unmapped words:", sorted(list(unmapped)))

