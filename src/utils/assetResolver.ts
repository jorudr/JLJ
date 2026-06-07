import globalAssets from '~/shared/data/global_assets.json'
import type { DiaryEntry } from '~/entities/diary/model/diary.types'

type DiaryAssetType = NonNullable<DiaryEntry['assetType']>
type RegistryAsset = {
  symbol: string
  name?: string
  type?: string
  icon?: string
  description?: string
}

type BrokerFamily = 'crypto-broker' | 'forex-broker' | 'stock-broker' | 'generic'

export interface ResolvedImportedAsset {
  symbol: string
  assetType: DiaryAssetType
  assetIcon?: string
  matched: boolean
  matchSource?: string
}

const registry = (globalAssets as RegistryAsset[]).filter(asset => asset?.symbol)
const cryptoQuoteSuffixes = [
  'USDT', 'USDC', 'FDUSD', 'TUSD', 'BUSD', 'DAI', 'USD', 'BTC', 'ETH', 'EUR', 'BRL', 'TRY'
]
const cryptoContractSuffixes = ['PERP', 'USDTPERP', 'USDTM', 'USDCM']

const normalizeSymbol = (value: string) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')

const normalizeRegistryType = (value: string | undefined): DiaryAssetType => {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'CRYPTO') return 'Crypto'
  if (normalized === 'FOREX') return 'Forex'
  if (normalized === 'METALS' || normalized === 'COMMODITIES') return 'Metals'
  return 'Stocks'
}

const findExactRegistryMatch = (normalizedSymbol: string, allowedTypes?: DiaryAssetType[]) => {
  return registry.find((asset) => {
    const assetType = normalizeRegistryType(asset.type)
    if (allowedTypes?.length && !allowedTypes.includes(assetType)) return false
    return normalizeSymbol(asset.symbol) === normalizedSymbol
  }) || null
}

const buildCryptoBaseCandidates = (normalizedSymbol: string) => {
  const candidates = new Set<string>([normalizedSymbol])

  cryptoContractSuffixes.forEach((suffix) => {
    if (normalizedSymbol.endsWith(suffix) && normalizedSymbol.length > suffix.length) {
      candidates.add(normalizedSymbol.slice(0, -suffix.length))
    }
  })

  Array.from(candidates).forEach((candidate) => {
    cryptoQuoteSuffixes.forEach((suffix) => {
      if (candidate.endsWith(suffix) && candidate.length > suffix.length) {
        candidates.add(candidate.slice(0, -suffix.length))
      }
    })
  })

  return Array.from(candidates).filter(Boolean)
}

const findCryptoBaseMatch = (normalizedSymbol: string) => {
  const candidates = buildCryptoBaseCandidates(normalizedSymbol)

  for (const candidate of candidates) {
    const exact = findExactRegistryMatch(candidate, ['Crypto'])
    if (exact) return { asset: exact, baseSymbol: candidate, suffix: 'candidate' }
  }

  for (const suffix of cryptoQuoteSuffixes) {
    if (!normalizedSymbol.endsWith(suffix) || normalizedSymbol.length <= suffix.length) continue
    const baseSymbol = normalizedSymbol.slice(0, -suffix.length)
    const exact = findExactRegistryMatch(baseSymbol, ['Crypto'])
    if (exact) return { asset: exact, baseSymbol, suffix }
  }

  return null
}

const findForexStyleMatch = (normalizedSymbol: string) => {
  const forexLike = registry.find((asset) => {
    if (normalizeRegistryType(asset.type) !== 'Forex') return false
    return normalizeSymbol(asset.symbol) === normalizedSymbol
  })
  if (forexLike) return forexLike

  const metalsLike = registry.find((asset) => {
    if (normalizeRegistryType(asset.type) !== 'Metals') return false
    return normalizeSymbol(asset.symbol) === normalizedSymbol
  })
  return metalsLike || null
}

export const resolveImportedAsset = (
  brokerSymbol: string,
  family: BrokerFamily = 'generic'
): ResolvedImportedAsset => {
  const normalized = normalizeSymbol(brokerSymbol)

  if (!normalized) {
    return { symbol: '', assetType: 'Stocks', matched: false }
  }

  if (family === 'crypto-broker') {
    const exactCrypto = findExactRegistryMatch(normalized, ['Crypto'])
    if (exactCrypto) {
      return {
        symbol: exactCrypto.symbol,
        assetType: 'Crypto',
        assetIcon: exactCrypto.icon,
        matched: true,
        matchSource: 'crypto-exact'
      }
    }

    const cryptoBaseMatch = findCryptoBaseMatch(normalized)
    if (cryptoBaseMatch) {
      return {
        symbol: cryptoBaseMatch.asset.symbol,
        assetType: 'Crypto',
        assetIcon: cryptoBaseMatch.asset.icon,
        matched: true,
        matchSource: `crypto-base:${cryptoBaseMatch.suffix}`
      }
    }

    const fallbackBase = buildCryptoBaseCandidates(normalized).sort((left, right) => left.length - right.length)[0] || normalized

    return {
      symbol: fallbackBase,
      assetType: 'Crypto',
      matched: false,
      matchSource: 'crypto-fallback'
    }
  }

  if (family === 'forex-broker') {
    const forexMatch = findForexStyleMatch(normalized)
    if (forexMatch) {
      const assetType = normalizeRegistryType(forexMatch.type)
      return {
        symbol: forexMatch.symbol,
        assetType,
        assetIcon: forexMatch.icon,
        matched: true,
        matchSource: 'forex-exact'
      }
    }
  }

  if (family === 'stock-broker') {
    const exactStock = findExactRegistryMatch(normalized, ['Stocks'])
    if (exactStock) {
      return {
        symbol: exactStock.symbol,
        assetType: 'Stocks',
        assetIcon: exactStock.icon,
        matched: true,
        matchSource: 'stock-exact'
      }
    }
  }

  const genericExact = findExactRegistryMatch(normalized)
  if (genericExact) {
    return {
      symbol: genericExact.symbol,
      assetType: normalizeRegistryType(genericExact.type),
      assetIcon: genericExact.icon,
      matched: true,
      matchSource: 'generic-exact'
    }
  }

  return {
    symbol: normalized,
    assetType: family === 'forex-broker' ? 'Forex' : family === 'crypto-broker' ? 'Crypto' : 'Stocks',
    matched: false,
    matchSource: 'generic-fallback'
  }
}
