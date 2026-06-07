import type { DiaryEntry } from '~/entities/diary/model/diary.types'

export type MetaTraderPlatform = 'MT4' | 'MT5'
export type MetaTraderImportFormat = 'csv' | 'json' | 'html'

export interface MetaTraderRawTrade {
  ticket?: string
  order?: string
  positionId?: string
  symbol?: string
  type?: string
  side?: string
  openTime?: string
  closeTime?: string
  openPrice?: string | number
  closePrice?: string | number
  volume?: string | number
  lots?: string | number
  commission?: string | number
  swap?: string | number
  profit?: string | number
  comment?: string
  magic?: string | number
  currency?: string
}

export interface MetaTraderImportedTrade {
  externalId: string
  raw: MetaTraderRawTrade
  diaryTrade: DiaryEntry
}

export interface MetaTraderParseResult {
  format: MetaTraderImportFormat
  imported: MetaTraderImportedTrade[]
  skippedRows: number
}

export interface MetaTraderDedupResult {
  newTrades: MetaTraderImportedTrade[]
  duplicates: MetaTraderImportedTrade[]
}

const CSV_SPLIT_REGEX = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
const HTML_ROW_REGEX = /<tr[\s\S]*?<\/tr>/gi
const HTML_CELL_REGEX = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi

const keyAliases: Record<keyof MetaTraderRawTrade, string[]> = {
  ticket: ['ticket', 'deal', 'deal id', 'dealid'],
  order: ['order', 'order id', 'orderid'],
  positionId: ['position', 'position id', 'positionid'],
  symbol: ['symbol', 'item', 'instrument'],
  type: ['type', 'operation'],
  side: ['side', 'direction'],
  openTime: ['open time', 'time', 'entry time', 'opentime'],
  closeTime: ['close time', 'closing time', 'exit time', 'closetime'],
  openPrice: ['open price', 'price', 'entry price', 'openprice'],
  closePrice: ['close price', 'exit price', 'closeprice'],
  volume: ['volume', 'size'],
  lots: ['lots', 'lot'],
  commission: ['commission', 'comm'],
  swap: ['swap'],
  profit: ['profit', 'p/l', 'pnl', 'net profit'],
  comment: ['comment', 'comments'],
  magic: ['magic', 'magic number'],
  currency: ['currency', 'deposit currency']
}

export const detectMetaTraderFormat = (fileName: string, content: string): MetaTraderImportFormat => {
  const lowerName = fileName.toLowerCase()
  const sample = content.trim().slice(0, 500).toLowerCase()

  if (lowerName.endsWith('.json') || sample.startsWith('{') || sample.startsWith('[')) return 'json'
  if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || sample.includes('<table') || sample.includes('<tr')) return 'html'
  return 'csv'
}

export const parseMetaTraderExport = (
  content: string,
  options: { fileName?: string; platform?: MetaTraderPlatform; currency?: string } = {}
): MetaTraderParseResult => {
  const format = detectMetaTraderFormat(options.fileName || '', content)
  const rows = format === 'json'
    ? parseJsonRows(content)
    : format === 'html'
      ? parseHtmlRows(content)
      : parseCsvRows(content)

  let skippedRows = 0
  const imported = rows.flatMap((row) => {
    const raw = normalizeRawTrade(row, options.currency)
    const trade = rawToDiaryTrade(raw, options.platform)

    if (!trade) {
      skippedRows += 1
      return []
    }

    return [{
      externalId: buildMetaTraderExternalId(raw, options.platform),
      raw,
      diaryTrade: trade
    }]
  })

  return { format, imported, skippedRows }
}

export const dedupeMetaTraderTrades = (
  imported: MetaTraderImportedTrade[],
  existingTrades: DiaryEntry[]
): MetaTraderDedupResult => {
  const existingIds = new Set(existingTrades.map(getExistingMetaTraderExternalId).filter(Boolean))
  const seenImportIds = new Set<string>()
  const newTrades: MetaTraderImportedTrade[] = []
  const duplicates: MetaTraderImportedTrade[] = []

  imported.forEach((trade) => {
    if (existingIds.has(trade.externalId) || seenImportIds.has(trade.externalId)) {
      duplicates.push(trade)
      return
    }

    seenImportIds.add(trade.externalId)
    newTrades.push(trade)
  })

  return { newTrades, duplicates }
}

export const attachMetaTraderSource = (
  trade: DiaryEntry,
  externalId: string,
  platform: MetaTraderPlatform,
  raw: MetaTraderRawTrade
): DiaryEntry => ({
  ...trade,
  id: trade.id || `mt-${externalId}`,
  notes: [
    trade.notes,
    `Imported from ${platform} local sync.`,
    raw.ticket ? `Ticket: ${raw.ticket}` : '',
    raw.order ? `Order: ${raw.order}` : ''
  ].filter(Boolean).join('\n'),
  source: 'metatrader',
  sourceExternalId: externalId,
  sourcePlatform: platform
} as DiaryEntry)

const parseCsvRows = (content: string): Record<string, string>[] => {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headerIndex = lines.findIndex(line => {
    const normalized = normalizeHeader(line)
    return normalized.includes('ticket') || normalized.includes('deal') || normalized.includes('symbol')
  })
  const headers = splitCsvLine(lines[Math.max(headerIndex, 0)])

  return lines.slice(Math.max(headerIndex, 0) + 1).map((line) => {
    const values = splitCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']))
  })
}

const parseJsonRows = (content: string): Record<string, unknown>[] => {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed?.trades)) return parsed.trades
    if (Array.isArray(parsed?.deals)) return parsed.deals
    if (Array.isArray(parsed?.history)) return parsed.history
    return []
  } catch {
    return []
  }
}

const parseHtmlRows = (content: string): Record<string, string>[] => {
  const rows = content.match(HTML_ROW_REGEX) || []
  const tableRows = rows.map(extractHtmlCells).filter(row => row.length)
  const headerIndex = tableRows.findIndex(row => row.some(cell => ['ticket', 'deal', 'symbol', 'time'].includes(normalizeKey(cell))))

  if (headerIndex === -1) return []

  const headers = tableRows[headerIndex]
  return tableRows.slice(headerIndex + 1).map((row) => {
    return Object.fromEntries(headers.map((header, index) => [header, row[index] || '']))
  })
}

const extractHtmlCells = (row: string): string[] => {
  const cells: string[] = []
  let match: RegExpExecArray | null
  HTML_CELL_REGEX.lastIndex = 0

  while ((match = HTML_CELL_REGEX.exec(row))) {
    cells.push(stripHtml(match[1]))
  }

  return cells
}

const normalizeRawTrade = (row: Record<string, unknown>, fallbackCurrency?: string): MetaTraderRawTrade => {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeKey(key), cleanCell(value)] as const)
  const read = (field: keyof MetaTraderRawTrade) => {
    const aliases = keyAliases[field]
    return normalizedEntries.find(([key]) => aliases.some(alias => key === normalizeKey(alias)))?.[1]
  }

  return {
    ticket: read('ticket'),
    order: read('order'),
    positionId: read('positionId'),
    symbol: read('symbol'),
    type: read('type'),
    side: read('side'),
    openTime: read('openTime'),
    closeTime: read('closeTime'),
    openPrice: read('openPrice'),
    closePrice: read('closePrice'),
    volume: read('volume'),
    lots: read('lots'),
    commission: read('commission'),
    swap: read('swap'),
    profit: read('profit'),
    comment: read('comment'),
    magic: read('magic'),
    currency: read('currency') || fallbackCurrency || 'USD'
  }
}

const rawToDiaryTrade = (raw: MetaTraderRawTrade, platform: MetaTraderPlatform = 'MT5'): DiaryEntry | null => {
  const symbol = String(raw.symbol || '').trim().toUpperCase()
  const side = parseSide(raw.side || raw.type)
  const date = parseMetaTraderDate(raw.openTime)
  const dateExit = parseMetaTraderDate(raw.closeTime || raw.openTime)
  const profitInCurrency = parseNumber(raw.profit)

  if (!symbol || !side || !date || !hasNumericValue(raw.profit) || !Number.isFinite(profitInCurrency)) return null

  const entryFee = Math.abs(parseNumber(raw.commission) || 0)
  const swap = parseNumber(raw.swap) || 0
  const size = parseNumber(raw.volume) || parseNumber(raw.lots) || undefined

  return {
    id: `mt-${buildMetaTraderExternalId(raw, platform)}`,
    date,
    dateExit: dateExit || date,
    asset: symbol,
    side,
    entry: parseNumber(raw.openPrice) || undefined,
    exit: parseNumber(raw.closePrice) || undefined,
    size,
    entryFee,
    exitFee: Math.abs(swap),
    feeType: 'Fixed',
    currency: String(raw.currency || 'USD').toUpperCase(),
    assetType: inferAssetType(symbol),
    profitInCurrency,
    result: profitInCurrency,
    notes: raw.comment ? `MetaTrader comment: ${raw.comment}` : 'Imported from MetaTrader local sync.'
  }
}

const buildMetaTraderExternalId = (raw: MetaTraderRawTrade, platform: MetaTraderPlatform = 'MT5') => {
  return [
    platform,
    raw.ticket || raw.order || raw.positionId || 'no-ticket',
    raw.symbol || 'unknown',
    raw.openTime || 'no-open-time',
    raw.closeTime || 'no-close-time',
    raw.profit ?? 'no-profit'
  ].map(part => normalizeIdPart(String(part))).join(':')
}

const getExistingMetaTraderExternalId = (trade: DiaryEntry) => {
  const anyTrade = trade as DiaryEntry & { source?: string; sourceExternalId?: string }
  return anyTrade.source === 'metatrader' ? anyTrade.sourceExternalId : ''
}

const splitCsvLine = (line: string) => {
  if (line.includes('\t')) return line.split('\t').map(cell => cleanCell(cell))
  if (line.includes(';') && !line.includes(',')) return line.split(';').map(cell => cleanCell(cell))
  return line.split(CSV_SPLIT_REGEX).map(cell => cleanCell(cell))
}

const cleanCell = (value: unknown) => {
  return String(value ?? '')
    .replace(/^"|"$/g, '')
    .replace(/""/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

const stripHtml = (value: string) => {
  return cleanCell(value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'))
}

const normalizeHeader = (value: string) => value.toLowerCase().replace(/\s+/g, ' ')

const normalizeKey = (value: string) => {
  return normalizeHeader(value)
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim()
}

const normalizeIdPart = (value: string) => {
  return value.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '')
}

const parseSide = (value: unknown): 'Long' | 'Short' | null => {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('buy') || normalized.includes('long')) return 'Long'
  if (normalized.includes('sell') || normalized.includes('short')) return 'Short'
  return null
}

const parseNumber = (value: unknown) => {
  const normalized = String(value ?? '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const hasNumericValue = (value: unknown) => {
  return /-?\d/.test(String(value ?? ''))
}

const parseMetaTraderDate = (value: unknown) => {
  const raw = String(value || '').trim()
  if (!raw) return null

  const normalized = raw.includes('.')
    ? raw.replace(/^(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3')
    : raw
  const parsed = new Date(normalized)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const inferAssetType = (symbol: string): DiaryEntry['assetType'] => {
  if (/XAU|XAG|GOLD|SILVER/i.test(symbol)) return 'Metals'
  if (/BTC|ETH|USDT|USDC|BNB|SOL|XRP/i.test(symbol)) return 'Crypto'
  if (/^[A-Z]{6,8}$/.test(symbol)) return 'Forex'
  return 'Stocks'
}
