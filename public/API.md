# SMSSync API

Search, filter, export and delete the SMS messages synced to your account.

## Authentication

Create or rotate your API key in **Dashboard → Connect**, then send it on every request:

```
Authorization: Bearer <apiKey>
# or
X-API-Key: <apiKey>
```

Every request is scoped to the key’s account. Rate limit: **120 requests/minute** (`X-RateLimit-Limit`, `-Remaining`, `-Reset` headers). Base URL: `https://YOUR-DOMAIN` (your deployment).

## Endpoints

### `GET /api/messages` — Search & list messages

The main endpoint. Combine any filters below. Results are always scoped to the API key’s account.

```bash
curl -G "https://YOUR-DOMAIN/api/messages" -H "Authorization: Bearer $API_KEY" \
  --data-urlencode 'q=from:bkash has:otp -promo' \
  -d preset=last7d -d tz=360 -d highlight=true -d limit=20
```

Response:

```json
{
  "success": true,
  "data": [
    { "_id": "6740…", "deviceId": "pixel-7", "sender": "bKash",
      "body": "Your code is 482913", "receivedAt": "2026-11-07T08:12:00.000Z",
      "simSlot": "0", "type": "incoming",
      "highlight": "Your code is **482913**" }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1,
                  "hasNextPage": false, "hasPreviousPage": false, "nextCursor": null },
  "meta": { "tookMs": 12, "sort": { "by": "receivedAt", "order": "desc" },
            "query": { "text": [], "excluded": ["promo"], "conditions": 4, "tz": 360 } }
}
```

### `GET /api/messages?count=true` — Count

Same filters, returns only the number of matches.

```bash
curl -G "https://YOUR-DOMAIN/api/messages" -H "Authorization: Bearer $API_KEY" -d count=true -d type=incoming -d preset=today
```

Response:

```json
{ "success": true, "count": 37, "meta": { "tookMs": 4, "query": { … } } }
```

### `GET /api/messages?group=day` — Statistics / group-by

Aggregate matches by sender, deviceId, type, simSlot, day, hour or month.

```bash
curl -G "https://YOUR-DOMAIN/api/messages" -H "Authorization: Bearer $API_KEY" -d group=day -d tz=360 -d preset=last30d
```

Response:

```json
{
  "success": true, "group": "day",
  "data": [ { "key": "2026-11-07", "count": 41, "incoming": 35, "outgoing": 6,
              "first": "…", "last": "…" } ]
}
```

### `GET /api/messages?format=csv` — Export

Download matches as CSV or NDJSON (up to 5000 rows per request; use cursor to continue). Cells starting with = + - @ are escaped.

```bash
curl -G "https://YOUR-DOMAIN/api/messages" -H "Authorization: Bearer $API_KEY" -d format=csv -d limit=5000 -d from=2026-11-01 -o sms.csv
```

Response:

```json
_id,deviceId,messageId,sender,body,receivedAt,simSlot,type
6740…,pixel-7,1042,bKash,"Your code is 482913",2026-11-07T08:12:00.000Z,0,incoming
```

### `POST /api/messages` — Search / count / delete with a JSON body

Use when filters are too long for a URL. Body: { action: "search" | "count" | "delete", filters?: {…} }. Filters may also sit at the top level. Arrays are accepted for list fields.

```bash
curl -X POST "https://YOUR-DOMAIN/api/messages" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"search","filters":{"q":"has:otp","deviceId":["pixel-7","redmi-9"],"preset":"last24h"},"limit":10}'
```

Response:

```json
Same as GET /api/messages
```

### `DELETE /api/messages` — Bulk delete

Delete everything matching the filters (query string and/or JSON body). Safety rails: (1) needs a filter, ids, or confirmAll:true; (2) dryRun:true previews without deleting; (3) more than 1000 matches returns 409 until you resend with confirmCount equal to the match count. Also accepts ids (Mongo _ids) and messageIds, up to 1000 each.

```bash
# preview first
curl -X DELETE "https://YOUR-DOMAIN/api/messages" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q":"from:promo before:2026-10-01","dryRun":true}'

# then really delete
curl -X DELETE "https://YOUR-DOMAIN/api/messages" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q":"from:promo before:2026-10-01"}'

# by ids
curl -X DELETE "https://YOUR-DOMAIN/api/messages" -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"ids":["6740aa…","6740bb…"]}'
```

Response:

```json
{ "success": true, "matched": 214, "deletedCount": 214 }

// dry run
{ "success": true, "dryRun": true, "matched": 214, "sample": [ … 5 messages … ] }

// > 1000 matches
{ "success": false, "error": "This would delete 5230 messages. Repeat the request with confirmCount: 5230 to proceed.", "matched": 5230, "confirmCount": 5230 }
```

### `GET /api/messages/:id` — Get one message

:id is a Mongo _id or a messageId (add ?deviceId= to disambiguate messageIds).

```bash
curl "https://YOUR-DOMAIN/api/messages/6740aa…" -H "Authorization: Bearer $API_KEY"
```

Response:

```json
{ "success": true, "data": { "_id": "6740aa…", "sender": "bKash", … } }
```

### `DELETE /api/messages/:id` — Delete one message

Same :id rules as above.

```bash
curl -X DELETE "https://YOUR-DOMAIN/api/messages/6740aa…" -H "Authorization: Bearer $API_KEY"
```

Response:

```json
{ "success": true, "deletedCount": 1 }
```

### `POST /api/messages/sync/:userId` — Device sync (used by the Android app)

No API key — the User ID identifies the account and the deviceId must be on the allowed list (403 otherwise). Duplicates are ignored.

```bash
curl -X POST "https://YOUR-DOMAIN/api/messages/sync/USER_ID" -H "Content-Type: application/json" \
  -d '{"deviceId":"pixel-7","messageId":"1042","sender":"bKash","body":"Your code is 482913","receivedAt":"2026-11-07T08:12:00Z","simSlot":0,"type":"incoming"}'
```

Response:

```json
{ "success": true, "inserted": true, "duplicate": false }
```

## Parameters (GET /api/messages)

### Filtering

| Param | Type | Description | Example |
|---|---|---|---|
| `q` | string | Advanced query — operators, quotes, negation (see Query syntax). | `q=from:bkash has:otp -promo after:2026-11-01` |
| `search` | string | Simple global substring match over sender, body, deviceId, messageId. | `search=otp` |
| `sender` | list | Exact sender(s), comma-separated. | `sender=bKash,Nagad` |
| `senderNot` | list | Exclude exact sender(s). | `senderNot=Promo` |
| `senderSearch` | string | Sender contains (case-insensitive). | `senderSearch=bank` |
| `senderRegex` | regex | Sender matches regex (max 120 chars). | `senderRegex=^\+880` |
| `deviceId` | list | Only these device IDs. | `deviceId=pixel-7,redmi-9` |
| `deviceNot` | list | Exclude device IDs. | `deviceNot=old-phone` |
| `deviceSearch` | string | Device ID contains. | `deviceSearch=pixel` |
| `type` | list | incoming and/or outgoing. | `type=incoming` |
| `simSlot` | list | SIM slot(s). | `simSlot=0,1` |
| `messageId` | list | Exact message ID(s). | `messageId=1042` |
| `body / bodySearch` | string | Body contains. | `body=verification` |
| `bodyNot` | string | Body must NOT contain. | `bodyNot=unsubscribe` |
| `bodyRegex` | regex | Body matches regex (max 120 chars). | `bodyRegex=code\s*\d{6}` |
| `phrase` | string | Exact phrase inside body. | `phrase=your code is` |
| `has` | list | Body contains pattern: otp, link, digits, email, amount. | `has=otp,link` |
| `minLength / maxLength` | int | Body length in characters. | `minLength=20&maxLength=160` |
| `match` | all|any | How free-text terms in q combine. Default all. | `match=any` |

### Dates

| Param | Type | Description | Example |
|---|---|---|---|
| `date` | date | Whole day (YYYY-MM-DD) in the given tz. | `date=2026-11-07` |
| `from / to` | date | Inclusive range. YYYY-MM-DD or ISO 8601. | `from=2026-11-01&to=2026-11-07` |
| `preset` | enum | last1h, last24h, last7d, last30d, today, yesterday, thisMonth. | `preset=last7d` |
| `tz` | int | Client UTC offset in minutes (Bangladesh = 360). Affects day boundaries and group=day. | `tz=360` |

### Output

| Param | Type | Description | Example |
|---|---|---|---|
| `sort` | enum | newest (default), oldest, asc, desc. | `sort=oldest` |
| `sortBy` | enum | receivedAt (default), createdAt, sender, deviceId, type. | `sortBy=sender` |
| `page / limit` | int | Offset pagination. limit max 500 (5000 for exports). Max offset 100,000. | `page=2&limit=100` |
| `cursor` | string | Keyset pagination — pass pagination.nextCursor. Fast at any depth; needs sortBy=receivedAt. | `cursor=MTc2Mj…` |
| `fields` | list | Projection. _id and receivedAt are always included. | `fields=sender,body,receivedAt` |
| `highlight` | bool | Adds a highlight snippet with **matched** text to each result. | `highlight=true` |
| `total` | bool | total=false skips the count query (faster on huge sets). | `total=false` |
| `count` | bool | Return only {count}. | `count=true` |
| `group` | enum | Aggregate instead of list: sender, deviceId, type, simSlot, day, hour, month. | `group=day&tz=360` |
| `groupLimit` | int | Max groups (default 100, max 500). | `groupLimit=20` |
| `format` | enum | json (default), csv, ndjson — file download. | `format=csv&limit=5000` |

## Query syntax (`q=`)

| Token | Meaning |
|---|---|
| `from:bank` | Sender contains “bank”. Alias: sender: |
| `device:pixel-7` | Device ID exactly matches |
| `type:incoming` | incoming / outgoing |
| `sim:0` | SIM slot |
| `id:1042` | Message ID |
| `after:2026-11-01` | On/after date or ISO time |
| `before:2026-11-07` | Strictly before |
| `on:2026-11-07` | Whole day |
| `has:otp` | Contains otp / link / digits / email / amount |
| `body:invoice` | Body contains |
| `"your code"` | Exact phrase (sender or body) |
| `-promo` | Exclude: works on words, phrases and any operator (-from:ads, -has:link, -type:outgoing) |
| `word1 word2` | Free words are ANDed across sender+body (use match=any for OR) |

Combine freely: `q=from:bank has:otp -promo after:2026-11-01 "your code"`. All conditions are ANDed; the same filters also work as plain parameters and can be mixed with `q`.

## Recipes

| Goal | Query |
|---|---|
| All OTPs from the last 24h, any bank | `q=has:otp&preset=last24h&fields=sender,body,receivedAt` |
| Incoming SMS from two senders, excluding ads | `sender=bKash,Nagad&type=incoming&bodyNot=offer` |
| Messages containing a 6-digit code | `bodyRegex=(?<!\d)\d{6}(?!\d)` |
| Anything with a link or amount, not from Promo | `q=-from:promo&has=link,amount&match=any` |
| Messages per hour today (Bangladesh time) | `group=hour&preset=today&tz=360` |
| Top senders this month | `group=sender&preset=thisMonth&groupLimit=10` |
| Page through everything fast | `limit=500&total=false → then cursor=<nextCursor>` |

## Errors

All errors: `{ "success": false, "error": "…" }`

| Status | Meaning |
|---|---|
| 400 | Invalid filter / parameter (message explains which) |
| 401 | Missing or invalid API key |
| 404 | Message not found |
| 409 | Large delete needs confirmCount |
| 429 | Rate limit: 120 requests/minute per account — see X-RateLimit-* headers |
| 500 | Server error |
