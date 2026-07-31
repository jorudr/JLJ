interface Env {
  ACCESS_KEY_PEPPER: string
  ACCESS_ADMIN_TOKEN: string
  FIREBASE_PROJECT_ID: string
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_PRIVATE_KEY: string
}

interface FirestoreValue {
  nullValue?: null
  booleanValue?: boolean
  integerValue?: string
  doubleValue?: number
  timestampValue?: string
  stringValue?: string
  mapValue?: { fields?: Record<string, FirestoreValue> }
}

interface FirestoreDocumentResponse {
  name: string
  fields?: Record<string, FirestoreValue>
  createTime?: string
  updateTime?: string
}

interface FirestoreDocument {
  id: string
  name: string
  data: Record<string, unknown>
  updateTime?: string
}

interface FirestoreWrite {
  update: {
    name: string
    fields: Record<string, FirestoreValue>
  }
  updateMask?: { fieldPaths: string[] }
  updateTransforms?: Array<{
    fieldPath: string
    setToServerValue: 'REQUEST_TIME'
  }>
  currentDocument?: {
    exists?: boolean
    updateTime?: string
  }
}

interface AccessKeyRecord {
  id: string
  keyHash: string
  status: 'active' | 'disabled'
  grant: string
  redeemedCount: number
  maxRedemptions: number | null
  expiresAtMs: number | null
  updateTime?: string
}

interface FirebaseIdentity {
  uid: string
}

interface FirebaseJwk extends JsonWebKey {
  kid?: string
}

interface CreateKeysInput {
  count: number
  maxRedemptions: number | null
  expiresAt: Date | null
  label: string
}

const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const FIREBASE_JWKS_ENDPOINT = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
const MAX_KEYS_PER_REQUEST = 100
const MAX_KEY_REDEMPTIONS = 1_000_000
const ACCESS_GRANT = 'full_access'

let cachedGoogleToken: { value: string; expiresAtMs: number } | null = null
let cachedFirebaseJwks: { keys: FirebaseJwk[]; expiresAtMs: number } | null = null

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return emptyResponse(204)

    const url = new URL(request.url)

    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        return jsonResponse({ ok: true })
      }

      if (request.method === 'POST' && url.pathname === '/v1/redeem') {
        const identity = await requireFirebaseIdentity(request, env)
        const input = await readJsonBody<{ key?: unknown }>(request)
        const rawKey = typeof input.key === 'string' ? input.key : ''
        const result = await redeemAccessKey(env, identity.uid, rawKey)
        return jsonResponse(result)
      }

      if (request.method === 'POST' && url.pathname === '/v1/admin/keys') {
        await requireAdminToken(request, env)
        const input = parseCreateKeysInput(await readJsonBody<Record<string, unknown>>(request))
        const keys = await createAccessKeys(env, input)
        return jsonResponse({ keys }, 201)
      }

      const disableMatch = url.pathname.match(/^\/v1\/admin\/keys\/([^/]+)\/disable$/)
      if (request.method === 'POST' && disableMatch) {
        await requireAdminToken(request, env)
        await disableAccessKey(env, decodeURIComponent(disableMatch[1]))
        return jsonResponse({ ok: true })
      }

      return jsonResponse({ error: 'Not found.' }, 404)
    } catch (error) {
      const knownError = error instanceof AccessWorkerError ? error : null
      if (!knownError) console.error('[Access] Unexpected request failure.', error)
      return jsonResponse(
        { error: knownError?.message || 'Unable to process the request.' },
        knownError?.status || 500
      )
    }
  }
}

class AccessWorkerError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

async function redeemAccessKey(env: Env, userId: string, rawKey: string) {
  const normalizedKey = normalizeAccessKey(rawKey)
  if (!normalizedKey) throw new AccessWorkerError('Invalid access key.', 400)

  const keyHash = await hashAccessKey(normalizedKey, env.ACCESS_KEY_PEPPER)
  const keyDocument = await findAccessKeyByHash(env, keyHash)
  if (!keyDocument) throw new AccessWorkerError('Invalid or inactive access key.', 400)

  const transaction = await beginFirestoreTransaction(env)
  const keyPath = `accessKeys/${keyDocument.id}`
  const redemptionPath = `${keyPath}/redemptions/${userId}`
  const documents = await batchGetDocuments(env, transaction, [keyPath, redemptionPath])
  const latestKeyDocument = documents.get(keyPath)
  const existingRedemption = documents.get(redemptionPath)

  if (!latestKeyDocument) throw new AccessWorkerError('Invalid or inactive access key.', 400)
  const accessKey = decodeAccessKeyRecord(latestKeyDocument)

  if (existingRedemption) {
    return { activated: true, alreadyActivated: true, grant: accessKey.grant }
  }

  assertAccessKeyCanBeRedeemed(accessKey)

  const accessKeyFields = encodeFields({
    ...latestKeyDocument.data,
    redeemedCount: accessKey.redeemedCount + 1
  })
  const writes: FirestoreWrite[] = [
    {
      update: {
        name: firestoreDocumentName(env, keyPath),
        fields: accessKeyFields
      },
      updateMask: { fieldPaths: ['redeemedCount'] },
      currentDocument: latestKeyDocument.updateTime
        ? { updateTime: latestKeyDocument.updateTime }
        : undefined
    },
    {
      update: {
        name: firestoreDocumentName(env, redemptionPath),
        fields: encodeFields({
          userId,
          keyId: accessKey.id,
          grant: accessKey.grant
        })
      },
      updateTransforms: [{ fieldPath: 'redeemedAt', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: false }
    },
    {
      update: {
        name: firestoreDocumentName(env, `users/${userId}/redeemedKeys/${accessKey.id}`),
        fields: encodeFields({
          keyId: accessKey.id,
          grant: accessKey.grant
        })
      },
      updateTransforms: [{ fieldPath: 'redeemedAt', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: false }
    },
    {
      update: {
        name: firestoreDocumentName(env, `users/${userId}`),
        fields: encodeFields({
          access: {
            isActivated: true,
            grant: accessKey.grant,
            activatedKeyId: accessKey.id
          }
        })
      },
      updateMask: { fieldPaths: ['access.isActivated', 'access.grant', 'access.activatedKeyId'] },
      updateTransforms: [{ fieldPath: 'access.activatedAt', setToServerValue: 'REQUEST_TIME' }]
    }
  ]

  await commitFirestoreTransaction(env, transaction, writes)
  return { activated: true, alreadyActivated: false, grant: accessKey.grant }
}

async function createAccessKeys(env: Env, input: CreateKeysInput) {
  const keys = await Promise.all(Array.from({ length: input.count }, async () => {
    const key = createAccessKeyValue()
    return {
      id: `key_${crypto.randomUUID().replace(/-/g, '')}`,
      key,
      keyHash: await hashAccessKey(normalizeAccessKey(key), env.ACCESS_KEY_PEPPER)
    }
  }))

  const writes: FirestoreWrite[] = keys.map((entry) => ({
    update: {
      name: firestoreDocumentName(env, `accessKeys/${entry.id}`),
      fields: encodeFields({
        keyHash: entry.keyHash,
        status: 'active',
        grant: ACCESS_GRANT,
        label: input.label,
        maxRedemptions: input.maxRedemptions,
        redeemedCount: 0,
        expiresAt: input.expiresAt
      })
    },
    updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
    currentDocument: { exists: false }
  }))

  await commitFirestoreWrites(env, writes)
  return keys.map(({ id, key }) => ({ id, key }))
}

async function disableAccessKey(env: Env, keyId: string) {
  if (!/^key_[a-f0-9]{32}$/i.test(keyId)) {
    throw new AccessWorkerError('Invalid key id.', 400)
  }

  const document = await getFirestoreDocument(env, `accessKeys/${keyId}`)
  if (!document) throw new AccessWorkerError('Access key not found.', 404)

  await commitFirestoreWrites(env, [{
    update: {
      name: firestoreDocumentName(env, `accessKeys/${keyId}`),
      fields: encodeFields({ status: 'disabled' })
    },
    updateMask: { fieldPaths: ['status'] },
    updateTransforms: [{ fieldPath: 'disabledAt', setToServerValue: 'REQUEST_TIME' }],
    currentDocument: document.updateTime ? { updateTime: document.updateTime } : undefined
  }])
}

function parseCreateKeysInput(input: Record<string, unknown>): CreateKeysInput {
  const count = Number(input.count)
  if (!Number.isInteger(count) || count < 1 || count > MAX_KEYS_PER_REQUEST) {
    throw new AccessWorkerError(`count must be an integer from 1 to ${MAX_KEYS_PER_REQUEST}.`, 400)
  }

  const rawMaxRedemptions = input.maxRedemptions
  const maxRedemptions = rawMaxRedemptions == null || rawMaxRedemptions === ''
    ? null
    : Number(rawMaxRedemptions)
  if (maxRedemptions !== null && (
    !Number.isInteger(maxRedemptions)
    || maxRedemptions < 1
    || maxRedemptions > MAX_KEY_REDEMPTIONS
  )) {
    throw new AccessWorkerError('maxRedemptions must be a positive integer.', 400)
  }

  const rawExpiresAt = input.expiresAt
  const expiresAt = rawExpiresAt == null || rawExpiresAt === ''
    ? null
    : new Date(String(rawExpiresAt))
  if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) {
    throw new AccessWorkerError('expiresAt must be a future ISO date.', 400)
  }

  const label = String(input.label || '').trim().slice(0, 120)
  return { count, maxRedemptions, expiresAt, label }
}

function decodeAccessKeyRecord(document: FirestoreDocument): AccessKeyRecord {
  const keyHash = String(document.data.keyHash || '')
  const status = String(document.data.status || '').toLowerCase()
  if (!keyHash || (status !== 'active' && status !== 'disabled')) {
    throw new AccessWorkerError('Invalid or inactive access key.', 400)
  }

  const maxRedemptions = document.data.maxRedemptions == null
    ? null
    : Number(document.data.maxRedemptions)
  return {
    id: document.id,
    keyHash,
    status,
    grant: String(document.data.grant || ACCESS_GRANT),
    redeemedCount: Math.max(0, Number(document.data.redeemedCount || 0)),
    maxRedemptions: Number.isInteger(maxRedemptions) && maxRedemptions! > 0 ? maxRedemptions : null,
    expiresAtMs: toMillis(document.data.expiresAt),
    updateTime: document.updateTime
  }
}

function assertAccessKeyCanBeRedeemed(key: AccessKeyRecord) {
  if (key.status !== 'active') throw new AccessWorkerError('Invalid or inactive access key.', 400)
  if (key.expiresAtMs && key.expiresAtMs <= Date.now()) {
    throw new AccessWorkerError('This access key has expired.', 400)
  }
  if (key.maxRedemptions !== null && key.redeemedCount >= key.maxRedemptions) {
    throw new AccessWorkerError('This access key has reached its activation limit.', 400)
  }
}

async function requireFirebaseIdentity(request: Request, env: Env): Promise<FirebaseIdentity> {
  const authorization = request.headers.get('Authorization') || ''
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!token) throw new AccessWorkerError('Authentication is required.', 401)
  return verifyFirebaseIdToken(token, env.FIREBASE_PROJECT_ID)
}

async function requireAdminToken(request: Request, env: Env): Promise<void> {
  const token = request.headers.get('X-Access-Admin-Token') || ''
  if (!token || !constantTimeEqual(token, env.ACCESS_ADMIN_TOKEN)) {
    throw new AccessWorkerError('Admin authorization is required.', 401)
  }
}

async function verifyFirebaseIdToken(token: string, projectId: string): Promise<FirebaseIdentity> {
  const [encodedHeader, encodedPayload, encodedSignature, ...extra] = token.split('.')
  if (!encodedHeader || !encodedPayload || !encodedSignature || extra.length) {
    throw new AccessWorkerError('Invalid authentication token.', 401)
  }

  const header = decodeJwtPart<{ alg?: string; kid?: string }>(encodedHeader)
  const payload = decodeJwtPart<{ aud?: string; iss?: string; sub?: string; exp?: number; iat?: number }>(encodedPayload)
  if (header.alg !== 'RS256' || !header.kid || !payload.sub || payload.aud !== projectId) {
    throw new AccessWorkerError('Invalid authentication token.', 401)
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (!Number.isFinite(payload.exp) || payload.exp! <= nowSeconds || !Number.isFinite(payload.iat) || payload.iat! > nowSeconds + 60) {
    throw new AccessWorkerError('Authentication token has expired.', 401)
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}` || payload.sub.length > 128) {
    throw new AccessWorkerError('Invalid authentication token.', 401)
  }

  const jwks = await getFirebaseJwks()
  const jwk = jwks.find((candidate) => candidate.kid === header.kid)
  if (!jwk) throw new AccessWorkerError('Invalid authentication token.', 401)

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
  const isValid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    publicKey,
    toArrayBuffer(base64UrlDecode(encodedSignature)),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  )
  if (!isValid) throw new AccessWorkerError('Invalid authentication token.', 401)

  return { uid: payload.sub }
}

async function getFirebaseJwks(): Promise<FirebaseJwk[]> {
  if (cachedFirebaseJwks && cachedFirebaseJwks.expiresAtMs > Date.now()) {
    return cachedFirebaseJwks.keys
  }

  const response = await fetch(FIREBASE_JWKS_ENDPOINT)
  const payload = await readJsonResponse(response) as { keys?: FirebaseJwk[] }
  if (!response.ok || !Array.isArray(payload.keys)) {
    throw new AccessWorkerError('Unable to verify authentication.', 503)
  }

  const cacheControl = response.headers.get('Cache-Control') || ''
  const maxAgeSeconds = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 21_600)
  cachedFirebaseJwks = {
    keys: payload.keys,
    expiresAtMs: Date.now() + Math.max(60, maxAgeSeconds) * 1000
  }
  return cachedFirebaseJwks.keys
}

async function findAccessKeyByHash(env: Env, keyHash: string): Promise<FirestoreDocument | null> {
  const token = await getGoogleAccessToken(env)
  const response = await fetch(`${firestoreBaseUrl(env)}/documents:runQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'accessKeys' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'keyHash' },
            op: 'EQUAL',
            value: { stringValue: keyHash }
          }
        },
        limit: 2
      }
    })
  })
  if (!response.ok) throw new Error(`Firestore access key lookup failed: ${response.status}`)

  const documents = parseFirestoreQueryResponse(await response.text())
  if (documents.length > 1) throw new Error('Multiple access keys share the same hash.')
  return documents[0] || null
}

function parseFirestoreQueryResponse(body: string): FirestoreDocument[] {
  return body.split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as { document?: FirestoreDocumentResponse })
    .map((entry) => entry.document ? decodeDocument(entry.document) : null)
    .filter((entry): entry is FirestoreDocument => Boolean(entry))
}

async function getFirestoreDocument(env: Env, path: string): Promise<FirestoreDocument | null> {
  const token = await getGoogleAccessToken(env)
  const response = await fetch(`${firestoreBaseUrl(env)}/documents/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (response.status === 404) return null
  const payload = await readJsonResponse(response) as FirestoreDocumentResponse
  if (!response.ok) throw new Error(`Firestore document read failed: ${response.status}`)
  return decodeDocument(payload)
}

async function beginFirestoreTransaction(env: Env): Promise<string> {
  const token = await getGoogleAccessToken(env)
  const response = await fetch(`${firestoreBaseUrl(env)}/documents:beginTransaction`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  const payload = await readJsonResponse(response) as { transaction?: string }
  if (!response.ok || !payload.transaction) throw new Error(`Unable to start Firestore transaction: ${response.status}`)
  return payload.transaction
}

async function batchGetDocuments(env: Env, transaction: string, paths: string[]): Promise<Map<string, FirestoreDocument>> {
  const token = await getGoogleAccessToken(env)
  const response = await fetch(`${firestoreBaseUrl(env)}/documents:batchGet`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documents: paths.map((path) => firestoreDocumentName(env, path)),
      transaction
    })
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`Firestore transaction read failed: ${response.status}`)

  const documents = new Map<string, FirestoreDocument>()
  for (const line of body.split('\n')) {
    if (!line.trim()) continue
    const entry = JSON.parse(line) as { found?: FirestoreDocumentResponse }
    if (!entry.found) continue
    const document = decodeDocument(entry.found)
    documents.set(document.name.split('/documents/')[1] || '', document)
  }
  return documents
}

async function commitFirestoreTransaction(env: Env, transaction: string, writes: FirestoreWrite[]): Promise<void> {
  await commitFirestore(env, { transaction, writes })
}

async function commitFirestoreWrites(env: Env, writes: FirestoreWrite[]): Promise<void> {
  await commitFirestore(env, { writes })
}

async function commitFirestore(env: Env, payload: { transaction?: string; writes: FirestoreWrite[] }): Promise<void> {
  const token = await getGoogleAccessToken(env)
  const response = await fetch(`${firestoreBaseUrl(env)}/documents:commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    const detail = await readJsonResponse(response)
    throw new Error(`Firestore commit failed: ${response.status} ${JSON.stringify(detail)}`)
  }
}

async function getGoogleAccessToken(env: Env): Promise<string> {
  if (cachedGoogleToken && cachedGoogleToken.expiresAtMs - Date.now() > 60_000) {
    return cachedGoogleToken.value
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const assertion = await createServiceAccountJwt({
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKeyPem: env.FIREBASE_PRIVATE_KEY,
    issuedAtSeconds: nowSeconds - 30,
    expiresAtSeconds: nowSeconds + 3300
  })
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  })
  const payload = await readJsonResponse(response) as { access_token?: string; expires_in?: number }
  if (!response.ok || !payload.access_token) throw new Error(`Google OAuth token exchange failed: ${response.status}`)

  cachedGoogleToken = {
    value: payload.access_token,
    expiresAtMs: Date.now() + (payload.expires_in || 3600) * 1000
  }
  return cachedGoogleToken.value
}

async function createServiceAccountJwt(input: {
  clientEmail: string
  privateKeyPem: string
  issuedAtSeconds: number
  expiresAtSeconds: number
}): Promise<string> {
  const header = base64UrlEncodeText(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64UrlEncodeText(JSON.stringify({
    iss: input.clientEmail,
    sub: input.clientEmail,
    aud: GOOGLE_TOKEN_ENDPOINT,
    scope: FIRESTORE_SCOPE,
    iat: input.issuedAtSeconds,
    exp: input.expiresAtSeconds
  }))
  const unsignedToken = `${header}.${payload}`
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    await importPrivateKey(input.privateKeyPem),
    new TextEncoder().encode(unsignedToken)
  )
  return `${unsignedToken}.${base64UrlEncodeBytes(new Uint8Array(signature))}`
}

async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  const base64 = privateKeyPem.replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
  if (!base64) throw new Error('FIREBASE_PRIVATE_KEY is empty or invalid.')

  return crypto.subtle.importKey(
    'pkcs8',
    Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

function normalizeAccessKey(value: string): string {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return /^EXG[A-F0-9]{32}$/.test(normalized) ? normalized : ''
}

function createAccessKeyValue(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `EXG-${hex.match(/.{1,8}/g)?.join('-') || hex}`
}

async function hashAccessKey(normalizedKey: string, pepper: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(normalizedKey))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function decodeDocument(document: FirestoreDocumentResponse): FirestoreDocument {
  const name = document.name
  return {
    id: name.split('/').at(-1) || '',
    name,
    data: decodeFields(document.fields || {}),
    updateTime: document.updateTime
  }
}

function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]))
}

function decodeValue(value: FirestoreValue): unknown {
  if ('nullValue' in value) return null
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('timestampValue' in value) return new Date(value.timestampValue as string)
  if ('stringValue' in value) return value.stringValue
  if ('mapValue' in value) return decodeFields(value.mapValue?.fields || {})
  return undefined
}

function encodeFields(fields: Record<string, unknown>): Record<string, FirestoreValue> {
  return Object.fromEntries(Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, encodeValue(value)]))
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } }
  }
  throw new Error('Unsupported Firestore value.')
}

function firestoreBaseUrl(env: Env): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)`
}

function firestoreDocumentName(env: Env, path: string): string {
  return `${firestoreBaseUrl(env)}/documents/${path}`
}

function toMillis(value: unknown): number | null {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function decodeJwtPart<T>(encoded: string): T {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(encoded))) as T
  } catch {
    throw new AccessWorkerError('Invalid authentication token.', 401)
  }
}

function base64UrlEncodeText(value: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(value))
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left)
  const rightBytes = new TextEncoder().encode(right)
  let difference = leftBytes.length ^ rightBytes.length
  const length = Math.max(leftBytes.length, rightBytes.length)
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0)
  }
  return difference === 0
}

async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return await request.json() as T
  } catch {
    throw new AccessWorkerError('Request body must be valid JSON.', 400)
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Access-Admin-Token',
      'Cache-Control': 'no-store'
    }
  })
}

function emptyResponse(status: number): Response {
  return new Response(null, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Access-Admin-Token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  })
}
