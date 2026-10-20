# Neon Cloud PostgreSQL Setup Guide

This guide walks you through setting up a free, managed PostgreSQL database on **Neon** as specified in `plan.md`.

---

## Step 1: Sign up / Log in to Neon

1. Open your browser and navigate to: **[https://neon.tech](https://neon.tech)**
2. Click **"Sign Up"** (or **"Log In"** if you already have an account).
3. You can authenticate easily using your GitHub, Google, or email account.

---

## Step 2: Create a New Project

1. After logging into the Neon console, click **"Create Project"** (or **"New Project"**).
2. Enter the project details:
   - **Project name:** `corrugated-box-mfg` (or any name you prefer)
   - **Postgres version:** `16` (recommended)
   - **Region:** Choose the region closest to you (e.g., `AWS - Asia Pacific (Singapore) ap-southeast-1` or `AWS - US East (N. Virginia)` / `AWS - Europe (Frankfurt)`)
3. Click **"Create Project"**.

---

## Step 3: Get Your Connection String

1. Once the project is created, Neon immediately displays your **Connection Details** on the project dashboard.
2. Under **"Connect to your database"**, make sure the drop-down has:
   - **Branch:** `main`
   - **Database:** `neondb`
   - **Role:** `neondb_owner` (or your default user)
3. Select **"Connection string"** (or URI format).
   It will look like:
   ```text
   postgresql://alex:AbC123xYz@ep-cool-fog-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Click the **Copy** button to copy the connection string.

---

## Step 4: Add the Connection String to `.env`

1. In the project root directory (`/Users/barani/Desktop/CLOUD_PROJECT/corrugated-box-mfg`), create or open the `.env` file.
2. Set the `DATABASE_URL` variable:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@<ep-hostname>.aws.neon.tech/neondb?sslmode=require"
   PORT=3000
   NODE_ENV=development
   ```
   *(Replace `<username>`, `<password>`, and `<ep-hostname>` with your actual Neon values).*

3. Save the `.env` file.

---

## Step 5: Test Connection with `psql` or `npm`

Once `psql` is available in your terminal, you can connect directly with:

```bash
psql "$DATABASE_URL"
```

Or run our built-in test & migration script:

```bash
npm run db:migrate
npm run db:seed
```

---

## Why Neon?
- **Serverless PostgreSQL:** Scales down to zero when idle, keeping costs at $0 on the free tier.
- **Persistent across deployments:** Unlike SQLite or local files, Render can restart anytime without losing orders, stock, or attendance data.
- **Native SSL:** Secured via TLS (`sslmode=require`) out of the box.
- **Production-ready:** Seamless connection with Node.js `pg` driver using standard `DATABASE_URL`.
