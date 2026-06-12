import re

with open('./src/widgets/genesis/ui/ExTradeAnalysisPanel.vue', 'r') as f:
    content = f.read()

# Fix actualRiskDollars to use t.risk if available
old_actualRisk = """const actualRiskDollars = computed(() => {
  const t = props.trade as any;
  if (!t) return 0;

  const entry = parseFloat(t.entry);"""

new_actualRisk = """const actualRiskDollars = computed(() => {
  const t = props.trade as any;
  if (!t) return 0;

  const explicitRisk = Number(t.risk);
  if (Number.isFinite(explicitRisk) && explicitRisk > 0) {
    return explicitRisk;
  }

  const entry = parseFloat(t.entry);"""

if old_actualRisk in content:
    content = content.replace(old_actualRisk, new_actualRisk)
else:
    print("Could not find actualRiskDollars block in ExTradeAnalysisPanel.vue")

with open('./src/widgets/genesis/ui/ExTradeAnalysisPanel.vue', 'w') as f:
    f.write(content)
