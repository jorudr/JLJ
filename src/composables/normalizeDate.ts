import { Timestamp } from "firebase/firestore"

export function normalizeDate(
  raw: any
): Date {
  if (!raw) return new Date()

  // 1. Handle actual Date object
  if (raw instanceof Date) return raw

  // 2. Handle Firestore Timestamp instance (with toDate method)
  if (typeof raw.toDate === 'function') return raw.toDate()

  // 3. Handle plain object that looks like a Firestore Timestamp (from Disk)
  if (raw && typeof raw === 'object' && typeof raw.seconds === 'number') {
    return new Date(raw.seconds * 1000 + (raw.nanoseconds || 0) / 1000000)
  }

  // 4. Handle String, Number or other Date format
  const d = new Date(raw)
  return isNaN(d.getTime()) ? new Date() : d
}