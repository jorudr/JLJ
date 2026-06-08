const normalizeDateStr = (val) => {
  let str = String(val || '').trim()
  // Replace space with T
  str = str.replace(' ', 'T')
  
  // If it ends with microseconds like .123456Z or .123456, truncate to milliseconds
  str = str.replace(/(\.\d{3})\d+(Z|[\+\-]\d{2}:?\d{2})?$/, '$1$2')
  
  // Append 'Z' to ISO strings missing timezone offset
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    str += 'Z'
  }
  
  return str
}

console.log(normalizeDateStr("2026-06-08 00:49:24.196"))
console.log(normalizeDateStr("2026-06-08T00:49:24.196000Z"))
console.log(normalizeDateStr("2026-06-08T00:49:24.196Z"))
console.log(normalizeDateStr("2026-06-08T00:49:24"))
