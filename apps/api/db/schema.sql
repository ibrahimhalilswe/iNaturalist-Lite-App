-- iNaturalist Lite — PostgreSQL Schema
-- Run this once on your Supabase/Postgres database.
-- PostGIS extension is required for location support.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  badge         TEXT NOT NULL DEFAULT '🌱',
  avatar_url    TEXT,
  otp_code      TEXT,
  otp_expiry    TIMESTAMPTZ,
  otp_attempts  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plants
CREATE TABLE IF NOT EXISTS plants (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  photourl    TEXT,
  username    TEXT NOT NULL DEFAULT 'Misafir',
  userbadge   TEXT NOT NULL DEFAULT '🌱',
  location    GEOGRAPHY(POINT, 4326),
  createdat   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plants_username ON plants (username);
CREATE INDEX IF NOT EXISTS idx_plants_createdat ON plants (createdat DESC);

-- Likes
CREATE TABLE IF NOT EXISTS plant_likes (
  id       SERIAL PRIMARY KEY,
  plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  UNIQUE (plant_id, username)
);

-- Comments
CREATE TABLE IF NOT EXISTS plant_comments (
  id         SERIAL PRIMARY KEY,
  plant_id   INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  username   TEXT NOT NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_plant_id ON plant_comments (plant_id);
CREATE INDEX IF NOT EXISTS idx_likes_username ON plant_likes (username);
CREATE INDEX IF NOT EXISTS idx_comments_username ON plant_comments (username);

-- Migration: run once on existing databases
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;
