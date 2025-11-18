# AlgoGainz - Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **Zerodha Kite Connect API credentials** - [Get API Key](https://developers.kite.trade/)

## Project Structure

```
algogainz/
├── frontend/          # React + TypeScript + Material-UI
├── backend/           # Node.js + Express + Prisma
├── docs/              # Documentation
├── AlgoGainz_PRD.md   # Product Requirements Document
└── CLAUDE.md          # Technical Implementation Guide
```

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd algogainz
```

## Step 2: Database Setup

### Option A: PostgreSQL (Recommended for Production)

1. Install PostgreSQL if not already installed

2. Create a new database:
```bash
createdb algogainz_db
```

Or using psql:
```sql
CREATE DATABASE algogainz_db;
```

3. Update the `DATABASE_URL` in `backend/.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/algogainz_db?schema=public"
```

### Option B: SQLite (Quick Development Setup)

For quick local development, you can use SQLite:

1. Update `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

2. Update `DATABASE_URL` in `backend/.env`:
```
DATABASE_URL="file:./dev.db"
```

## Step 3: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `backend/.env` with your credentials:
```env
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_api_secret
DATABASE_URL=postgresql://user:password@localhost:5432/algogainz_db
JWT_SECRET=your_secure_jwt_secret
```

5. Generate Prisma Client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

7. Start the backend server:
```bash
npm run dev
```

Backend should now be running on `http://localhost:3000`

## Step 4: Frontend Setup

1. Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `frontend/.env`:
```env
VITE_KITE_API_KEY=your_kite_api_key
VITE_API_BASE_URL=http://localhost:3000/api
```

5. Start the frontend development server:
```bash
npm run dev
```

Frontend should now be running on `http://localhost:5173`

## Step 5: Zerodha Kite Connect Setup

1. **Get API Credentials**:
   - Visit [Kite Connect](https://developers.kite.trade/)
   - Create a new app
   - Note down your `API Key` and `API Secret`
   - Set redirect URL to: `http://localhost:3000/api/auth/callback`

2. **Update Environment Variables**:
   - Add your API Key and Secret to both `backend/.env` and `frontend/.env`

## Step 6: Verify Installation

1. Open browser to `http://localhost:5173`
2. You should see the AlgoGainz login page
3. Backend health check: `http://localhost:3000/health`

## Common Issues & Solutions

### Issue: Prisma migrations failing

**Solution**: Make sure PostgreSQL is running and credentials are correct in `.env`

```bash
# Check PostgreSQL status
pg_ctl status

# Restart PostgreSQL
pg_ctl restart
```

### Issue: Port already in use

**Solution**: Change ports in configuration files

- Backend: Edit `PORT` in `backend/.env`
- Frontend: Edit `server.port` in `frontend/vite.config.ts`

### Issue: CORS errors

**Solution**: Verify `CORS_ORIGIN` in `backend/.env` matches your frontend URL

```env
CORS_ORIGIN=http://localhost:5173
```

### Issue: Kite API authentication fails

**Solution**:
- Verify API credentials are correct
- Check redirect URL matches exactly with Kite Connect app settings
- Ensure API key is active and not expired

## Development Workflow

1. **Start Backend**:
```bash
cd backend
npm run dev
```

2. **Start Frontend** (in a new terminal):
```bash
cd frontend
npm run dev
```

3. **Database Management**:
```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `KITE_API_KEY` | Zerodha Kite API key | `your_api_key` |
| `KITE_API_SECRET` | Zerodha Kite API secret | `your_api_secret` |
| `JWT_SECRET` | Secret for JWT token signing | `random_secure_string` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |
| `VITE_KITE_API_KEY` | Zerodha Kite API key | `your_api_key` |
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:3001` |

## Next Steps

After successful setup:

1. Read the [Product Requirements Document](../AlgoGainz_PRD.md)
2. Review the [Technical Implementation Guide](../CLAUDE.md)
3. Check [API Documentation](./API.md) for backend endpoints
4. See [Deployment Guide](./DEPLOYMENT.md) for production setup

## Getting Help

- Check the [FAQ](./FAQ.md)
- Review error logs in terminal
- Verify all environment variables are set correctly
- Ensure all dependencies are installed

---

**Ready to trade smart with AlgoGainz!** 🚀
