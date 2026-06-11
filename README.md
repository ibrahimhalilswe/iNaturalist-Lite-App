# iNaturalist Lite — Monorepo

Tam JavaScript monorepo. C# kodu kalmadı.

```
inaturalist-lite-monorepo/
├── apps/
│   ├── api/          — Vercel Serverless Functions (Node.js)
│   │   ├── api/      — Endpoint dosyaları
│   │   │   ├── _lib/ — Ortak yardımcılar (db, auth, email, cloudinary…)
│   │   │   ├── auth/ — register, login, forgot-password, reset, change, refresh
│   │   │   ├── plants/ — CRUD + upload + identify + like + comment
│   │   │   ├── user/   — profile, my-plants, liked-plants
│   │   │   └── users/  — public profile & plants
│   │   ├── db/       — schema.sql (Supabase'e bir kere çalıştır)
│   │   └── vercel.json
│   ├── web/          — Vite vanilla JS SPA
│   └── mobile/       — Expo React Native
└── packages/
    └── shared/       — Ortak sabitler, validator'lar, e-posta şablonları
```

## Kurulum

```bash
# Yarn workspaces
yarn install
```

## Geliştirme

```bash
# API (Vercel Dev — port 3000)
yarn dev:api

# Web (Vite — port 5173, API'ye proxy)
yarn dev:web

# Mobile
yarn dev:mobile
```

## Deploy

### API → Vercel
```bash
cd apps/api
vercel deploy
```
Vercel dashboard'dan env var'ları ekle (`.env.example` dosyasına bak).

### Web → Vercel
```bash
cd apps/web
vercel deploy
```
`VITE_API_URL` env var'ını deployed API URL'ine set et.

### Mobile → EAS Build
```bash
cd apps/mobile
eas build --platform android
```
`EXPO_PUBLIC_API_BASE_URL` env var'ını set et.

## Veritabanı

Supabase üzerinde bir kez çalıştır:
```bash
psql $DATABASE_URL -f apps/api/db/schema.sql
```

## Env Variables

Her app'in kendi `.env.example` dosyası var. Kopyalayıp `.env` olarak düzenle.
