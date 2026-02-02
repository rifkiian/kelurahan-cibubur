# 🏛️ Kelurahan Cibubur - Portal Layanan Digital

Portal resmi administrasi kependudukan Kelurahan Cibubur, Jakarta Timur. Sistem informasi terintegrasi untuk layanan masyarakat, pengaduan, berita, dan agenda kegiatan.

## 🌟 Fitur Utama

### 👤 User Interface
- **Landing Page** modern dengan informasi lengkap
- **Layanan Online** untuk berbagai keperluan administrasi
- **Sistem Pengaduan** real-time
- **Berita & Agenda** terkini
- **Kontak & Informasi** lengkap

### 👨‍💼 Admin Panel
- **Dashboard** analitik dan statistik
- **Manajemen Penduduk** database lengkap
- **Pengelolaan Layanan** digital
- **Sistem Berita** dan publikasi
- **Live Chat** dengan masyarakat
- **Notifikasi** real-time

## 🛠️ Teknologi

### Frontend
- **React 18** dengan TypeScript
- **Vite** untuk build tool
- **Tailwind CSS** untuk styling
- **shadcn/ui** component library
- **React Router** untuk navigasi
- **TanStack Query** untuk state management

### Backend
- **Node.js** dengan Express
- **TypeScript** untuk type safety
- **Prisma ORM** untuk database
- **PostgreSQL** sebagai database
- **JWT** untuk authentication
- **Multer** untuk file upload
- **bcryptjs** untuk password hashing

### Security
- File upload validation & security
- JWT authentication
- Input sanitization
- CORS protection
- Rate limiting

## 📋 Prerequisites

Sebelum memulai, pastikan software berikut sudah terinstall:

### Node.js
```bash
# Install Node.js 18.x atau 20.x
# Download dari: https://nodejs.org
node --version
npm --version
```

### PostgreSQL
```bash
# Install PostgreSQL 12.x ke atas
# Download dari: https://www.postgresql.org/download/windows/
# Default user: postgres, password: 123
```

## 🚀 Instalasi & Setup

### 1. Clone Repository
```bash
git clone https://github.com/rifkiian/kelurahan-cibubur.git
cd kelurahan-cibubur
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```powershell
# Set password environment variable
$env:PGPASSWORD='123'

# Buat database
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -c "CREATE DATABASE cibubur_connect_dev;"
```

### 4. Environment Configuration
Buat file `.env` di root project:
```env
# Database
DATABASE_URL="postgresql://postgres:123@localhost:5432/cibubur_connect_dev?schema=public"

# Server
PORT=3001
JWT_SECRET="change-me-in-production"

# Admin Seed
ADMIN_EMAIL="admin@cibubur.go.id"
ADMIN_PASSWORD="admin123"
ADMIN_NAME="Admin Kelurahan"

# Gemini API (Optional)
GOOGLE_GEMINI_API_KEY=""
GOOGLE_GEMINI_MODEL="gemini-1.5-flash"

# Supabase (Optional)
VITE_SUPABASE_URL=""
VITE_SUPABASE_ANON_KEY=""
```

### 5. Database Schema
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Seed admin user
npx prisma db seed
```

## 🏃‍♂️ Menjalankan Aplikasi

### Cara 1: Backend & Frontend Terpisah (Recommended)

#### Terminal 1 - Backend API
```bash
npm run dev:api
```
Output: `API listening on http://localhost:3001`

#### Terminal 2 - Frontend Vite
```bash
npm run dev
```
Output: `Local: http://localhost:8080/`

### Cara 2: Backend & Frontend Bersamaan
```bash
npm run dev:all
```

## 🌐 Akses Aplikasi

### Frontend (User)
- **URL:** http://localhost:8080
- **Fitur:** Halaman beranda, layanan, berita, agenda, kontak

### Admin Panel
- **URL:** http://localhost:8080/admin
- **Login:**
  - **Email:** `admin@cibubur.go.id`
  - **Password:** `admin123`

### Backend API
- **URL:** http://localhost:3001
- **Endpoints:** `/api/*`

## 📁 Struktur Project

```
kelurahan-cibubur/
├── src/                    # Frontend React
│   ├── components/         # UI Components
│   │   ├── admin/         # Admin components
│   │   ├── landing/       # Landing page components
│   │   └── ui/            # Base UI components
│   ├── pages/             # Halaman
│   ├── assets/            # Static assets
│   └── utils/             # Utility functions
├── server/                 # Backend Express
│   ├── routes/            # API Routes
│   ├── middleware/        # Express middleware
│   └── prisma.ts          # Database connection
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma      # Database model
│   ├── migrations/        # Migration files
│   └── seed.ts            # Admin seed script
├── docs/                   # Documentation
├── public/                 # Public files
├── uploads/                # File uploads
├── .env                    # Environment variables
├── package.json            # Dependencies & scripts
└── README.md               # This file
```

## 🔧 Troubleshooting

### ❌ Error: `EADDRINUSE :::3001`
```bash
# Cek PID yang pakai port
netstat -ano | findstr :3001

# Kill proses
taskkill /PID <PID> /F
```

### ❌ Error: `Server misconfigured` saat login
- Tambahkan `JWT_SECRET="change-me"` di `.env`
- Restart backend server

### ❌ Error: `column "email" does not exist`
```bash
npx prisma migrate deploy
npx prisma db seed
```

### ❌ Error: `ECONNREFUSED` di frontend
- Pastikan backend jalan di port 3001
- Cek koneksi database

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm run start:production
```

### Environment Variables Production
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="strong-secret-key"
```

## 📝 Scripts

```json
{
  "dev": "vite",
  "dev:api": "tsx watch server/index.ts",
  "dev:all": "concurrently \"npm run dev:api\" \"npm run dev\"",
  "build": "tsc && vite build",
  "start:production": "node dist/server/index.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate deploy",
  "prisma:seed": "prisma db seed"
}
```

## 🔐 Security Features

- **File Upload Security:** Validasi tipe file, ukuran, dan magic number
- **Authentication:** JWT token dengan expiration
- **Input Validation:** Sanitasi dan validasi semua input
- **CORS Protection:** Cross-origin resource sharing configuration
- **Rate Limiting:** Protection dari brute force attacks

## 📞 Kontak & Support

- **Email:** admin@cibubur.go.id
- **Alamat:** Jl. Raya Cibubur No. 123, Kelurahan Cibubur, Jakarta Timur 13720
- **Telepon:** (021) 8765-4321

## 🤝 Kontribusi

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

© 2026 Kelurahan Cibubur. Hak Cipta Dilindungi.

---

**🚀 Selamat mengembangkan portal Kelurahan Cibubur!**
