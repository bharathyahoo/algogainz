# Database Schema Update Required

## Changes Made

Added `tokenExpiry` field to the User model in `prisma/schema.prisma` to support Kite API token expiry tracking (tokens expire after 24 hours).

## Setup Instructions

After pulling these changes, run the following commands in the `backend/` directory:

```bash
# Regenerate Prisma Client with new schema
npx prisma generate

# Apply database migration (if using PostgreSQL/MySQL)
npx prisma migrate deploy

# OR for development with SQLite
npx prisma migrate dev
```

## What Changed

**File**: `backend/prisma/schema.prisma`

Added to User model:
```prisma
tokenExpiry    DateTime? @map("token_expiry") // Kite tokens expire after 24 hours
```

**Migration**: `backend/prisma/migrations/20251120_add_token_expiry/migration.sql`

Adds the `token_expiry` column to the `users` table.

## Why This Change?

The Kite API access tokens expire after 24 hours. We now track the expiry time in the database so that:
1. The `ensureValidKiteToken` middleware can check if tokens are expired
2. Expired tokens are automatically cleared from the database
3. Users are prompted to re-authenticate when their session expires

This is part of the complete Kite API integration implementation.
