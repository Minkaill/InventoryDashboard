# Cold Brew — Подвал

Inventory dashboard for cold brew basement storage. Dark ops-style UI, mobile-first, Russian language.

---

## Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

Or from the root:

```bash
npm run install:all
```

---

## Start the backend

```bash
cd backend && npm run dev
```

Server starts on `http://0.0.0.0:3000`

---

## Start the frontend

```bash
cd frontend && npm run dev
```

Frontend starts on `http://localhost:5173` (proxies `/api` to the backend)

---

## Access from your phone

1. Find your local IP address:
   - macOS/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`

2. On your phone, open: `http://192.168.x.x:5173`

Both devices must be on the same Wi-Fi network.

---

## Database

SQLite file is stored at:

```
backend/data/coldbrew.db
```

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blocks` | All blocks with current stock |
| GET | `/api/blocks/:id` | Single block |
| POST | `/api/blocks/:id/transaction` | Add incoming/outgoing |
| GET | `/api/blocks/:id/history` | Last 50 transactions |

### POST body example

```json
{
  "type": "outgoing",
  "quantity": 15,
  "note": "Рынок"
}
```
# InventoryDashboard
