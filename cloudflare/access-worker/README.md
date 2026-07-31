# ExGenesis access worker

Отдельный Cloudflare Worker для активации одноразовых или лимитированных ключей.

## Secrets

В Cloudflare добавьте:

```text
ACCESS_KEY_PEPPER
ACCESS_KEY_ENCRYPTION_KEY
ACCESS_ADMIN_TOKEN
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Обычная переменная:

```text
FIREBASE_PROJECT_ID=voes-a88f4
```

## API

### Создать ключи

```bash
curl -X POST "https://YOUR-WORKER.workers.dev/v1/admin/keys" \
  -H "Content-Type: application/json" \
  -H "X-Access-Admin-Token: YOUR_ACCESS_ADMIN_TOKEN" \
  --data '{"count":10,"maxRedemptions":1,"label":"private beta"}'
```

`maxRedemptions: 1` означает один пользователь на один ключ. Можно не передавать поле для ключа без лимита. Ответ содержит исходные ключи только в этот момент; в Firestore сохраняются исключительно HMAC-hash.

### Активировать ключ

```text
POST /v1/redeem
Authorization: Bearer FIREBASE_ID_TOKEN
Content-Type: application/json

{ "key": "EXG-..." }
```

### Отключить ключ

```bash
curl -X POST "https://YOUR-WORKER.workers.dev/v1/admin/keys/KEY_ID/disable" \
  -H "X-Access-Admin-Token: YOUR_ACCESS_ADMIN_TOKEN"
```

### Автоматическая пара ключей

Worker запускается строго раз в два месяца: в `00:00 UTC` первого числа февраля, апреля, июня, августа, октября и декабря. Он создаёт ровно два ключа, каждый с `maxRedemptions: 1` и сроком действия до следующего запуска.

Чтобы сразу создать или получить текущую пару, используйте:

```bash
curl -X POST "https://YOUR-WORKER.workers.dev/v1/admin/rotation/run" \
  -H "X-Access-Admin-Token: YOUR_ACCESS_ADMIN_TOKEN"
```

Ответ содержит два ключа и дату окончания. Исходные ключи сохраняются между запусками только в зашифрованном виде и доступны исключительно через защищённый admin endpoint:

```bash
curl "https://YOUR-WORKER.workers.dev/v1/admin/rotation" \
  -H "X-Access-Admin-Token: YOUR_ACCESS_ADMIN_TOKEN"
```

## Данные Firestore

```text
accessKeys/{keyId}                         # только Worker
accessKeys/{keyId}/redemptions/{userId}    # только Worker
accessKeyBatches/{batchId}                 # только Worker, ключи зашифрованы
users/{userId}/redeemedKeys/{keyId}        # пользователь может только читать
users/{userId}.access                      # пользователь может только читать
```

Один Firestore transaction создаёт запись активации, историю ключа у пользователя и увеличивает счётчик использования. Это исключает двойную активацию при параллельных запросах.

## Проверка и deploy

```bash
cd cloudflare/access-worker
npm install
npm run check
npm run deploy
```
