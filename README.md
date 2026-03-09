<div align="center">

# 🏠 PT. Putra Kawan Lama Property

### Platform Sewa & Jual Properti Premium

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Go](https://img.shields.io/badge/Go-1.22-00ADD8?logo=go&logoColor=white)](https://golang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Midtrans](https://img.shields.io/badge/Midtrans-Payment-00AA13)](https://midtrans.com/)

<br/>

**Aplikasi web full-stack untuk manajemen properti dengan fitur booking survei, pembayaran Cash & Cicilan via Midtrans, live chat real-time, dan dashboard multi-role.**

</div>

---

## 📸 Screenshots

<div align="center">

### 🌐 Homepage
| Hero Section | Featured Properties |
|:---:|:---:|
| Premium dark theme with golden accents | Property cards with live data |

### 📊 Dashboard
| Admin Dashboard | Customer Dashboard |
|:---:|:---:|
| Property management, bookings, live chat | Booking tracking, installment payments |

### 💰 Pembayaran Cicilan
| Pilih Tenor | Manajemen Cicilan |
|:---:|:---:|
| Cash vs Cicilan (3/6/12 bulan) | Progress bar, jadwal, bayar per bulan |

</div>

---

## ✨ Fitur Utama

### 🏡 Manajemen Properti
- CRUD properti (Rumah, Apartemen, Villa, Tanah, Komersial, Gudang)
- Upload gambar multiple
- Kategori dinamis dengan spesifikasi per tipe
- Google Maps integration
- Virtual tour & video URL
- Filter & pencarian properti

### 📋 Sistem Booking
- **Survey** — Jadwalkan kunjungan properti dengan manajemen tanggal (anti bentrok)
- **Pembelian** — Cash atau Cicilan dengan pilihan tenor
- **Sewa** — Harian, Bulanan, Tahunan
- Manajemen status: Pending → Confirmed → Completed

### 💳 Pembayaran (Midtrans Integration)
- **Cash** — Bayar lunas via Midtrans Snap
- **Cicilan** — DP 10% + cicilan bulanan (3/6/12 bulan)
- Auto-generate jadwal cicilan (DP + N cicilan)
- Menu **"💰 Pembayaran"** di dashboard untuk tracking
- Progress bar per booking
- Tabel jadwal: status, jatuh tempo, tombol bayar
- **Anti Double Payment** (5 layer keamanan):
  - Database: OrderID unique index
  - Backend: validasi status sebelum buat token
  - Reuse pending snap token
  - Sequential enforcement (cicilan berurutan)
  - Frontend: disable button saat proses

### 💬 Live Chat Real-time
- Chatbot otomatis untuk customer
- Handoff ke admin live chat
- Cross-tab communication
- Unread message badge
- Admin chat panel di dashboard

### 👥 Multi-Role Dashboard
| Role | Akses |
|:---:|:---|
| **Admin** | Semua properti, users, bookings, payments, live chat, inquiry |
| **Owner** | Properti sendiri, booking masuk, views & pendapatan |
| **Customer** | Booking saya, pembayaran cicilan, favorit |

---

## 🛠 Tech Stack

| Layer | Teknologi |
|:---|:---|
| **Frontend** | Next.js 15, React 19, TypeScript, CSS Modules |
| **Backend** | Go 1.22, Gin Framework, GORM |
| **Database** | PostgreSQL 16 (Alpine) |
| **Payment** | Midtrans Snap (Sandbox/Production) |
| **Deployment** | Docker Compose |
| **Auth** | JWT (JSON Web Tokens) |

---

## 🏗 Arsitektur

```
┌────────────────────────────────────────────────┐
│                    Client                       │
│              (Browser / Mobile)                 │
└────────────┬──────────────────┬────────────────┘
             │                  │
     ┌───────▼───────┐  ┌──────▼──────┐
     │   Frontend    │  │  Midtrans   │
     │  Next.js 15   │  │  Snap API   │
     │  Port: 3000   │  │             │
     └───────┬───────┘  └──────┬──────┘
             │                  │
     ┌───────▼──────────────────▼────────┐
     │           Backend (Go/Gin)        │
     │            Port: 8080             │
     │                                   │
     │  ┌──────────┐  ┌──────────────┐  │
     │  │  Auth    │  │  Booking     │  │
     │  │  Handler │  │  Handler     │  │
     │  └──────────┘  └──────────────┘  │
     │  ┌──────────┐  ┌──────────────┐  │
     │  │ Payment  │  │  Property    │  │
     │  │ Handler  │  │  Handler     │  │
     │  └──────────┘  └──────────────┘  │
     └───────────────┬───────────────────┘
                     │
          ┌──────────▼──────────┐
          │    PostgreSQL 16    │
          │     Port: 5432     │
          └────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- atau Node.js 18+ & Go 1.22+ (untuk development)

### 1. Clone Repository

```bash
git clone https://github.com/WagYu31/PT.Putra-Kawan-Lama-Property.git
cd PT.Putra-Kawan-Lama-Property
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 3. Jalankan dengan Docker Compose

```bash
docker compose up -d --build
```

Akses di browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8081
- **Database**: localhost:5433

### 4. Default Accounts

| Role | Email | Password |
|:---|:---|:---|
| **Admin** | admin@putrakawanlama.com | admin123 |
| **Owner** | owner@putrakawanlama.com | owner123 |
| **Customer** | customer@putrakawanlama.com | customer123 |

---

## 📁 Struktur Proyek

```
PT.Putra-Kawan-Lama-Property/
├── backend/
│   ├── cmd/server/main.go          # Entry point
│   ├── internal/
│   │   ├── config/config.go        # Environment config
│   │   ├── database/
│   │   │   ├── database.go         # DB connection & migration
│   │   │   └── seed.go             # Data seeder
│   │   ├── handlers/
│   │   │   ├── auth.go             # Login, register, profile
│   │   │   ├── booking.go          # Survey, purchase, rental
│   │   │   ├── payment.go          # Midtrans, installments
│   │   │   ├── property.go         # CRUD properti
│   │   │   ├── upload.go           # File upload
│   │   │   └── user.go             # User management
│   │   ├── middleware/auth.go      # JWT & role middleware
│   │   ├── models/                 # GORM models
│   │   └── routes/routes.go        # API routes
│   ├── Dockerfile
│   ├── go.mod & go.sum
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── about/              # Halaman tentang
│   │   │   ├── contact/            # Halaman kontak
│   │   │   ├── properties/         # List & detail properti
│   │   │   ├── auth/               # Login & register
│   │   │   └── dashboard/          # Multi-role dashboard
│   │   ├── components/
│   │   │   ├── home/               # Hero, Featured, Stats, CTA
│   │   │   ├── layout/             # Navbar, Footer, ChatBot
│   │   │   └── dashboard/          # AdminLiveChat
│   │   └── lib/
│   │       ├── api.ts              # API helper
│   │       ├── auth.tsx            # Auth context & hooks
│   │       └── livechat.tsx        # Live chat context
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| POST | `/api/auth/register` | Register user baru |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profil 🔒 |

### Properties
| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| GET | `/api/properties` | List semua properti |
| GET | `/api/properties/:id` | Detail properti |
| POST | `/api/properties` | Tambah properti 🔒 Admin |
| PUT | `/api/properties/:id` | Update properti 🔒 Admin |
| DELETE | `/api/properties/:id` | Hapus properti 🔒 Admin |

### Bookings
| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| POST | `/api/surveys` | Jadwalkan survey 🔒 Customer |
| POST | `/api/bookings/purchase` | Buat pembelian 🔒 Customer |
| POST | `/api/bookings/rental` | Buat sewa 🔒 Customer |
| GET | `/api/bookings` | List booking 🔒 |
| GET | `/api/bookings/:id` | Detail booking 🔒 |
| GET | `/api/bookings/:id/installments` | Jadwal cicilan 🔒 |
| PATCH | `/api/bookings/:id/status` | Update status 🔒 Admin |

### Payments
| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| POST | `/api/payments/snap` | Buat Snap token 🔒 Customer |
| POST | `/api/payments/installment/pay` | Bayar cicilan 🔒 Customer |
| GET | `/api/payments` | List pembayaran 🔒 |
| POST | `/api/payments/notification` | Midtrans webhook |

---

## ⚙️ Environment Variables

| Variable | Deskripsi | Default |
|:---|:---|:---|
| `DB_USER` | PostgreSQL username | `pkwl_user` |
| `DB_PASSWORD` | PostgreSQL password | `pkwl_secret_2024` |
| `DB_NAME` | Database name | `pkwl_property` |
| `JWT_SECRET` | JWT signing key | — |
| `MIDTRANS_SERVER_KEY` | Midtrans server key | Sandbox key |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key | Sandbox key |
| `MIDTRANS_IS_PRODUCTION` | Production mode | `false` |
| `GIN_MODE` | Gin framework mode | `debug` |

---

## 🧪 Development

### Frontend (tanpa Docker)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend (tanpa Docker)

```bash
cd backend
go mod download
go run cmd/server/main.go
# → http://localhost:8080
```

> **Note**: Pastikan PostgreSQL sudah running dan environment variables sudah di-set.

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan internal PT. Putra Kawan Lama.

---

<div align="center">
  <sub>Built with ❤️ using Next.js, Go, PostgreSQL & Docker</sub>
</div>
