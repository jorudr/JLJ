import re

with open('./src/widgets/genesis/ui/ExGenesisLog.vue', 'r') as f:
    content = f.read()

old_block = """const complianceStats = computed<{ riskPerTrade: number, riskPerSession: number, tradingStyle: number }>(() => {
  const trades = currentTrades.value;
  if (trades.length === 0) return { riskPerTrade: 100, riskPerSession: 100, tradingStyle: 100 };

  let compliantTradeCount = 0;
  let compliantSessionCount = 0;
  let compliantStyleCount = 0;

  const initDep = tradeStore.getInitialDeposit(selectedStrategyId.value) || 1000;

  const maxRiskDollars = riskValueToDollars(
    activeMatrixNodes.value.riskPerTradeValue,
    activeMatrixNodes.value.riskPerTradeUnit,
    initDep
  );

  const styleLimits: Record<number, { max?: number, min?: number }> = {
    0: { max: 1 },
    1: { min: 1, max: 14 },
    2: { min: 14 }
  };
  const extraType = activeMatrixNodes.value.tradingStyleExtraType;

  const maxSessionRiskDollars = riskValueToDollars(
    activeMatrixNodes.value.riskPerSessionValue,
    activeMatrixNodes.value.riskPerSessionUnit,
    initDep
  );

  const sessionRiskMap: Record<string, number> = {};

  trades.forEach(t => {
    // Risk Per Trade
    let actualRisk = Number((t as any).risk) || 0;
    if (actualRisk === 0 && t.entry && t.stopLoss) {
      actualRisk = Math.abs(Number(t.entry) - Number(t.stopLoss)) * (Number((t as any).size) || 1);
    }
    if (actualRisk <= maxRiskDollars) compliantTradeCount++;

    // Trading Style
    let durationMins = 0;
    if (t.date && t.dateExit) {
      durationMins = (new Date(t.dateExit).getTime() - new Date(t.date).getTime()) / 60000;
    }
    const durationDays = durationMins / 60 / 24;
    let styleCompliant = true;
    if (extraType !== undefined && styleLimits[extraType]) {
      const limit = styleLimits[extraType];
      if (limit.min !== undefined && durationDays < limit.min) styleCompliant = false;
      if (limit.max !== undefined && durationDays > limit.max) styleCompliant = false;
    }
    if (styleCompliant) compliantStyleCount++;

    // Session Risk map
    const pnl = Number((t as any).profitInCurrency) || 0;
    const dateStr = new Date(t.date).toDateString();
    sessionRiskMap[dateStr] = (sessionRiskMap[dateStr] || 0) + pnl;
  });

  let validSessions = 0;
  const sessionKeys = Object.keys(sessionRiskMap);
  sessionKeys.forEach(k => {
    if ((sessionRiskMap[k] || 0) >= -maxSessionRiskDollars) validSessions++;
  });

  return {
    riskPerTrade: (compliantTradeCount / trades.length) * 100,
    riskPerSession: sessionKeys.length > 0 ? (validSessions / sessionKeys.length) * 100 : 100,
    tradingStyle: (compliantStyleCount / trades.length) * 100
  };
});"""

new_block = """const complianceStats = computed<{ riskPerTrade: number, riskPerSession: number, tradingStyle: number }>(() => {
  const trades = currentTrades.value;
  if (trades.length === 0) return { riskPerTrade: 100, riskPerSession: 100, tradingStyle: 100 };

  let compliantTradeCount = 0;
  let compliantSessionCount = 0;
  let compliantStyleCount = 0;

  const initDep = tradeStore.getInitialDeposit(selectedStrategyId.value) || 1000;
  
  const riskUnit = activeMatrixNodes.value.riskPerTradeUnit;
  const riskVal = activeMatrixNodes.value.riskPerTradeValue;

  const sessionRiskUnit = activeMatrixNodes.value.riskPerSessionUnit;
  const sessionRiskVal = activeMatrixNodes.value.riskPerSessionValue;

  const styleLimits: Record<number, { max?: number, min?: number }> = {
    0: { max: 1 },
    1: { min: 1, max: 14 },
    2: { min: 14 }
  };
  const extraType = activeMatrixNodes.value.tradingStyleExtraType;

  const sessionRiskMap: Record<string, { pnl: number, balanceAtStart: number }> = {};

  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let currentBalance = initDep;

  sortedTrades.forEach(t => {
    const maxRiskDollars = riskValueToDollars(riskVal, riskUnit, currentBalance);

    // Risk Per Trade
    let actualRisk = Number((t as any).risk) || 0;
    if (actualRisk === 0 && t.entry && t.stopLoss) {
      actualRisk = Math.abs(Number(t.entry) - Number(t.stopLoss)) * (Number((t as any).size) || 1);
    }
    
    // Fallback if risk is 0 and trade was a loss
    if (actualRisk === 0 && t.profitInCurrency !== undefined && t.profitInCurrency < 0) {
      actualRisk = Math.abs(t.profitInCurrency);
    }
    
    if (actualRisk <= maxRiskDollars) compliantTradeCount++;

    // Trading Style
    let durationMins = 0;
    if (t.date && t.dateExit) {
      durationMins = (new Date(t.dateExit).getTime() - new Date(t.date).getTime()) / 60000;
    }
    const durationDays = durationMins / 60 / 24;
    let styleCompliant = true;
    if (extraType !== undefined && styleLimits[extraType]) {
      const limit = styleLimits[extraType];
      if (limit.min !== undefined && durationDays < limit.min) styleCompliant = false;
      if (limit.max !== undefined && durationDays > limit.max) styleCompliant = false;
    }
    if (styleCompliant) compliantStyleCount++;

    // Session Risk map
    const pnl = Number((t as any).profitInCurrency) || 0;
    const dateStr = new Date(t.date).toDateString();
    
    if (!sessionRiskMap[dateStr]) {
      sessionRiskMap[dateStr] = { pnl: 0, balanceAtStart: currentBalance };
    }
    sessionRiskMap[dateStr].pnl += pnl;

    currentBalance += pnl;
  });

  let validSessions = 0;
  const sessionKeys = Object.keys(sessionRiskMap);
  sessionKeys.forEach(k => {
    const maxSessionRiskDollars = riskValueToDollars(sessionRiskVal, sessionRiskUnit, sessionRiskMap[k].balanceAtStart);
    if (sessionRiskMap[k].pnl >= -maxSessionRiskDollars) validSessions++;
  });

  return {
    riskPerTrade: (compliantTradeCount / trades.length) * 100,
    riskPerSession: sessionKeys.length > 0 ? (validSessions / sessionKeys.length) * 100 : 100,
    tradingStyle: (compliantStyleCount / trades.length) * 100
  };
});"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('./src/widgets/genesis/ui/ExGenesisLog.vue', 'w') as f:
        f.write(content)
    print("Replaced successfully.")
else:
    print("Could not find block in ExGenesisLog.vue")

