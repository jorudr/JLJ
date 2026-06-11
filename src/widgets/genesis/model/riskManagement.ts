export type RiskUnit = '%' | '$'

export interface RiskManagementData {
  riskPerTradeValue: number | null
  riskPerTradeUnit: RiskUnit
  riskPerSessionValue: number | null
  riskPerSessionUnit: RiskUnit
  riskRewardRatio: number | null
  tradingStyle: string | null
  tradingStyleExtraType: number | null
  sourceNode: any | null
}

const toNumberOrNull = (value: any): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const normalizeTradingStyle = (value: any): string | null => {
  const raw = String(value || '').trim().toUpperCase()
  if (!raw) return null
  if (raw.includes('DAY')) return 'DAY_TRADING'
  if (raw.includes('SWING')) return 'SWING_TRADING'
  if (raw.includes('INVEST')) return 'INVESTING'
  return raw
}

export const tradingStyleExtraType = (style: any): number | null => {
  const normalized = normalizeTradingStyle(style)
  if (normalized === 'DAY_TRADING') return 0
  if (normalized === 'SWING_TRADING') return 1
  if (normalized === 'INVESTING') return 2
  return null
}

const getConnectedNodes = (nodes: any[], connections: any[], nodeId: string) => {
  const childIds = connections.filter((connection: any) => connection.fromId === nodeId).map((connection: any) => connection.toId)
  return childIds.map((id: string) => nodes.find((node: any) => node.id === id)).filter(Boolean)
}

const findConnectedNode = (
  nodes: any[],
  connections: any[],
  rootId: string,
  predicate: (node: any) => boolean,
  maxDepth = 5
): any | null => {
  const visited = new Set<string>()
  const walk = (nodeId: string, depth: number): any | null => {
    if (!nodeId || depth > maxDepth || visited.has(nodeId)) return null
    visited.add(nodeId)

    const connectedNodes = getConnectedNodes(nodes, connections, nodeId)
    const found = connectedNodes.find(predicate)
    if (found) return found

    for (const node of connectedNodes) {
      const result = walk(node.id, depth + 1)
      if (result) return result
    }
    return null
  }
  return walk(rootId, 0)
}

export const resolveRiskManagementForStrategy = (
  nodes: any[],
  connections: any[],
  strategyId: string | null | undefined
): RiskManagementData => {
  if (!strategyId) {
    return {
      riskPerTradeValue: null,
      riskPerTradeUnit: '%',
      riskPerSessionValue: null,
      riskPerSessionUnit: '$',
      riskRewardRatio: null,
      tradingStyle: null,
      tradingStyleExtraType: null,
      sourceNode: null
    }
  }

  const riskPanel = findConnectedNode(nodes, connections, strategyId, (node) => node.type === 'risk')
  if (riskPanel?.params) {
    const style = normalizeTradingStyle(riskPanel.params.tradingStyle)
    return {
      riskPerTradeValue: toNumberOrNull(riskPanel.params.riskLossTrade),
      riskPerTradeUnit: riskPanel.params.riskLossTradeUnit === '$' ? '$' : '%',
      riskPerSessionValue: toNumberOrNull(riskPanel.params.riskLossDay),
      riskPerSessionUnit: riskPanel.params.riskLossDayUnit === '%' ? '%' : '$',
      riskRewardRatio: toNumberOrNull(riskPanel.params.riskRR),
      tradingStyle: style,
      tradingStyleExtraType: tradingStyleExtraType(style),
      sourceNode: riskPanel
    }
  }

  const legacyTrade = findConnectedNode(nodes, connections, strategyId, (node) => node.type === 'risk-element' && node.params?.riskType === 'trade')
  const legacySession = findConnectedNode(nodes, connections, strategyId, (node) => node.type === 'risk-element' && node.params?.riskType === 'day')
  const legacyStyle = findConnectedNode(nodes, connections, strategyId, (node) =>
    (node.type === 'risk-element' && node.params?.riskType === 'style') ||
    String(node.label || '').toLowerCase().includes('style')
  )

  const style = normalizeTradingStyle(legacyStyle?.label)
  return {
    riskPerTradeValue: toNumberOrNull(legacyTrade?.params?.value),
    riskPerTradeUnit: legacyTrade?.params?.unit === '$' ? '$' : '%',
    riskPerSessionValue: toNumberOrNull(legacySession?.params?.value),
    riskPerSessionUnit: legacySession?.params?.unit === '%' ? '%' : '$',
    riskRewardRatio: null,
    tradingStyle: style,
    tradingStyleExtraType: legacyStyle?.params?.extraType ?? tradingStyleExtraType(style),
    sourceNode: legacyTrade || legacySession || legacyStyle || null
  }
}

export const riskValueToDollars = (value: number | null, unit: RiskUnit, initialDeposit: number) => {
  if (value === null) return Infinity
  return unit === '%' ? (value / 100) * initialDeposit : value
}
