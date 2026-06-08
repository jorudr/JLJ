const parseKrakenSpotTimestamp = (value) => {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric) || numeric <= 0) return Number.NaN
  return numeric > 1_000_000_000_000 ? numeric : numeric * 1000
}

const parseKrakenFuturesTimestamp = (value) => {
  let str = String(value || '').trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    str += 'Z'
  }
  const parsed = Date.parse(str)
  if (Number.isFinite(parsed) && !isNaN(parsed)) return parsed

  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric) || numeric <= 0) return Number.NaN
  return numeric > 1_000_000_000_000 ? numeric : numeric * 1000
}

console.log("Spot 1:", parseKrakenSpotTimestamp("2026-06-08T00:48:56.734Z"))
console.log("Spot 2:", parseKrakenSpotTimestamp("2026-06-08T00:49:24.196"))

console.log("Futures 1:", parseKrakenFuturesTimestamp("2026-06-08T00:48:56.734Z"))
console.log("Futures 2:", parseKrakenFuturesTimestamp("2026-06-08T00:49:24.196"))
