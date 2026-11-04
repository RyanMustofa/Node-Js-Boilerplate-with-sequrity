# Secure Express Clean Architecture Boilerplate

Boilerplate API pembayaran berbasis Node.js, Express, dan EJS. Project ini memiliki API payout, worker Redis/BullMQ, serta backoffice demo dengan halaman dashboard, transactions, dan payouts.

> **Catatan demo:** Backoffice saat ini memakai data dummy dan tidak membaca atau menulis ke database. Login demo dan session in-memory hanya untuk pengembangan, bukan autentikasi production.

## Fitur

- Express API dengan middleware Helmet, CORS, batas body JSON 2 MB, sanitasi input, rate limit, dan whitelist IP untuk `/api`.
- Autentikasi payout menggunakan API key dan HMAC-SHA256.
- Penyimpanan payout MySQL melalui Knex dan migration.
- Pemrosesan antrean payout menggunakan BullMQ dan Redis.
- Backoffice EJS berbasis Bootstrap, dengan login demo dan tampilan responsif.
- Utilitas HMAC, perbandingan nilai yang timing-safe, serta enkripsi AES-256-GCM.

## Teknologi

- Node.js 20 atau lebih baru
- Express 5 dan EJS
- MySQL dengan Knex dan `mysql2`
- Redis dengan BullMQ dan `ioredis`
- Bootstrap 5 dan Bootstrap Icons

## Menjalankan secara lokal

1. Pasang dependency:

   ```bash
   npm install
   ```

2. Salin `.env.example` jika tersedia, atau buat file `.env` di root project dengan konfigurasi sesuai bagian [Environment variables](#environment-variables).

3. Jalankan MySQL dan Redis apabila akan menggunakan migration atau API payout.

4. Jalankan server:

   ```bash
   npm run dev
   ```

   Aplikasi berjalan di `http://localhost:3000` secara default.

## Backoffice demo

Buka `http://localhost:3000/bo/login` dan gunakan:

| Field | Nilai |
|---|---|
| Email | `admin@demo.local` |
| Password | `Demo123!` |

Halaman yang tersedia:

- `/bo/dashboard` — ringkasan operasional dan aktivitas terbaru.
- `/bo/transactions` — daftar transaksi dummy.
- `/bo/payouts` — daftar payout dummy.

Semua halaman backoffice memerlukan login. Tidak ada halaman registrasi. Session disimpan di memory, sehingga akan terhapus saat server dimulai ulang. Fitur pencarian, filter, export, dan pembuatan payout pada tampilan backoffice saat ini hanya elemen UI.

## API

Semua endpoint di bawah `/api` memerlukan alamat IP klien terdaftar pada tabel `ip_whitelist`, selain autentikasi endpoint. API yang tersedia:

| Method | Path | Keterangan |
|---|---|---|
| `POST` | `/api/payouts` | Membuat payout dan mengirim job ke antrean Redis |
| `GET` | `/api/payouts/:id` | Mengambil payout berdasarkan ID |

Kedua endpoint menggunakan header:

```text
X-API-Key: <PAYOUT_API_KEY>
X-Signature: <HMAC-SHA256>
Content-Type: application/json
```

Signature dihitung dari JSON body yang sudah diparse, diserialisasi kembali dengan `JSON.stringify`, lalu ditandatangani menggunakan `PAYOUT_SIGNATURE_SECRET`. Contoh body:

```json
{
  "userId": "USR-1001",
  "amount": 125000,
  "currency": "IDR",
  "referenceId": "PO-EXAMPLE-001",
  "metadata": {
    "source": "backoffice"
  }
}
```

Contoh menghitung signature untuk body yang sama:

```bash
node -e "const crypto=require('crypto'); const body={userId:'USR-1001',amount:125000,currency:'IDR',referenceId:'PO-EXAMPLE-001',metadata:{source:'backoffice'}}; console.log(crypto.createHmac('sha256',process.env.PAYOUT_SIGNATURE_SECRET).update(JSON.stringify(body)).digest('hex'))"
```

Pastikan nilai `X-Signature` dibuat dari payload yang sama persis.

`GET /health` menyediakan pemeriksaan dasar status HTTP. Endpoint ini tidak memeriksa konektivitas MySQL atau Redis.

## Database dan migration

Migration saat ini membuat:

- `ip_whitelist` — daftar IP yang diizinkan mengakses API.
- `payouts` — data payout yang dibuat melalui API.

Atur koneksi MySQL di `.env`, lalu jalankan:

```bash
npm run db:migrate
```

Migration hanya membuat tabel dan belum menambahkan IP whitelist. Tambahkan IP klien yang memang dipercaya secara manual sebelum memanggil `/api`:

```sql
INSERT INTO ip_whitelist (ip_address, is_active)
VALUES ('127.0.0.1', TRUE);
```

Sesuaikan IP tersebut dengan alamat yang benar-benar dilihat aplikasi, termasuk kemungkinan format IPv6 atau alamat dari proxy. Jangan membuka whitelist ke seluruh alamat untuk mempermudah pengujian.

## Redis dan payout worker

Payout yang dibuat API dimasukkan ke antrean `payout-queue`. Worker berjalan di proses server yang sama. Pastikan Redis tersedia dan `REDIS_URL` menunjuk ke instance yang benar sebelum mencoba membuat payout. Job akan dicoba ulang hingga lima kali dengan jeda exponential backoff.

## Environment variables

Contoh konfigurasi lokal:

```dotenv
NODE_ENV=development
PORT=3000
TRUST_PROXY=1

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1h

API_MASTER_KEY=replace-with-a-random-api-key
API_SIGNATURE_SECRET=replace-with-a-long-random-secret
PAYOUT_API_KEY=replace-with-a-random-payout-api-key
PAYOUT_SIGNATURE_SECRET=replace-with-a-long-random-secret
BO_SESSION_SECRET=replace-with-a-long-random-secret

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=app_db
DB_USER=app_user
DB_PASSWORD=replace-with-a-database-password
DB_SSL=false

REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=base64:replace-with-a-32-byte-base64-key

# Opsional: pisahkan beberapa origin dengan koma.
CORS_ORIGIN=http://localhost:3000
```

Variabel yang dibaca aplikasi:

| Variabel | Kegunaan |
|---|---|
| `NODE_ENV` | Mode aplikasi; nilai `production` mewajibkan `BO_SESSION_SECRET` |
| `PORT` | Port HTTP; default `3000` |
| `TRUST_PROXY` | Pengaturan Express `trust proxy`; sesuaikan dengan topologi proxy |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Secret dan masa berlaku JWT |
| `API_MASTER_KEY`, `API_SIGNATURE_SECRET` | Kredensial middleware API standar |
| `PAYOUT_API_KEY`, `PAYOUT_SIGNATURE_SECRET` | Kredensial endpoint payout |
| `BO_SESSION_SECRET` | Secret cookie session backoffice; wajib di production |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Koneksi MySQL |
| `DB_SSL` | Aktifkan SSL MySQL jika nilainya `true` |
| `REDIS_URL` | URL koneksi Redis |
| `ENCRYPTION_KEY` | Key AES-256-GCM; gunakan key acak 32-byte, sebaiknya dalam format `base64:` |
| `CORS_ORIGIN` | Opsional, daftar origin CORS dipisahkan koma |

Buat nilai random untuk key 32-byte dengan:

```bash
node -e "console.log('base64:'+require('crypto').randomBytes(32).toString('base64'))"
```

Jangan gunakan secret default development di production. Simpan `.env` dan seluruh secret di luar version control dan gunakan secret manager untuk deployment.

## Struktur direktori

```text
resource/
  public/
    css/                 # CSS backoffice
    js/                  # JavaScript interaksi backoffice
  views/
    bo/                  # Halaman dan partial EJS backoffice
src/
  config/                # Konfigurasi environment
  data/                  # Data dummy backoffice
  db/
    migrations/          # Migration Knex
    repositories/        # Akses data
  mappers/               # Transformasi response
  middleware/            # Auth, keamanan, whitelist IP
  routes/                # Route API dan backoffice
  services/              # Business logic dan antrean
  utils/                 # Crypto dan logger
```

Bootstrap dan Bootstrap Icons dilayani secara lokal dari `node_modules`, sedangkan aset backoffice tersedia di `/assets`.

## Perintah npm

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Menjalankan server dengan Nodemon |
| `npm start` | Menjalankan server |
| `npm run db:migrate` | Menjalankan migration yang belum diterapkan |
| `npm run lint` | Pemeriksaan sintaks JavaScript pada file yang ditentukan di script |
| `npm test` | Belum ada suite test yang dikonfigurasi |

## Catatan operasional dan keamanan

- Batasi `trust proxy` ke proxy tepercaya. Jangan mempercayai `X-Forwarded-For` dari koneksi publik secara langsung.
- Middleware whitelist memakai alamat IP klien untuk membandingkan dengan `ip_whitelist`; database yang tidak tersedia menyebabkan request API gagal.
- Rate limit umum saat ini berbasis proses dan konfigurasi default project. Untuk deployment multi-instance, pertimbangkan store terdistribusi.
- Session backoffice menggunakan MemoryStore bawaan Express, tidak cocok untuk production atau multi-instance.
- Worker payout yang tersedia masih contoh dan belum mengirim dana melalui payment provider.
- `transactions` pada backoffice adalah data dummy; migration belum membuat tabel transaksi.
- Sebelum production, lengkapi validasi input, pengelolaan session terdistribusi, monitoring queue, pengujian otomatis, dan peninjauan konfigurasi keamanan.
