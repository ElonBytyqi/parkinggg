# Parking Dashboard

Real-time parking availability management system with admin controls and public QR code access.

## Features

- **Visitor View**: See available parking spots in real-time
- **Admin View**: Toggle parking spot status (FREE/OCCUPIED)
- **QR Code**: Public QR code for easy mobile access
- **Real-time Updates**: Auto-refresh every second

## Quick Start (Local Development)

```bash
# Install dependencies
npm install
cd app/parking-web && npm install && cd ../..

# Start backend (Terminal 1)
npm start

# Start frontend (Terminal 2)
cd app/parking-web && npm run dev
```

## Deployment to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click "New" > "Web Service"
4. Connect your GitHub repo
5. Settings:
   - **Build Command**: `npm install && npm run build:frontend`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Click "Create Web Service"

Your app will be live at `https://your-app.onrender.com`

## Admin Login

- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Add `?admin` to URL or double-click the title

## Project Structure

| Folder | Purpose |
| ------ | ------- |
| `app/parking-web/` | React frontend (Vite + Tailwind) |
| `db/` | Database schema (CDS) |
| `srv/` | Backend service (CAP) |
| `server.js` | Custom server for static files |
