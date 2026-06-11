import re

with open('./src/widgets/genesis/ui/ExTradeAnalysisPanel.vue', 'r') as f:
    content = f.read()

# Replace .toFixed(1) with .toFixed(2)
content = content.replace('.toFixed(1)', '.toFixed(2)')

# Add .toFixed(2) to specific variables in template tags
content = re.sub(r'\{\{\s*strategyExecutionMetrics\.horizonSync\s*\}\}', '{{ (strategyExecutionMetrics.horizonSync || 0).toFixed(2) }}', content)
content = re.sub(r'\{\{\s*matrixAdherenceMetrics\.reqRatio\s*\}\}', '{{ (matrixAdherenceMetrics.reqRatio || 0).toFixed(2) }}', content)
content = re.sub(r'\{\{\s*behaviouralMetrics\.stability\s*\}\}', '{{ (behaviouralMetrics.stability || 0).toFixed(2) }}', content)
content = re.sub(r'\{\{\s*strategyExecutionMetrics\.executionGrade\s*\}\}', '{{ (strategyExecutionMetrics.executionGrade || 0).toFixed(2) }}', content)

with open('./src/widgets/genesis/ui/ExTradeAnalysisPanel.vue', 'w') as f:
    f.write(content)
