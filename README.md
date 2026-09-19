# TPL2026 – T10 Cricket League

A complete full-stack cricket tournament management platform with live auction, player registration, team management, real-time bidding, previous seasons, gallery, and venue/contact management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, TypeScript, SCSS |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO (WebSocket) |
| Data Storage | Excel (xlsx) – local or Google Drive |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Images | Local /uploads or Google Drive folder |

## Public Pages

| URL | Description |
|-----|-------------|
| `/` | Home – stats, announcements, hero |
| `/players` | Player directory (read-only) |
| `/players/:id` | Player profile |
| `/players/register` | Player registration form |
| `/teams` | Teams directory (read-only) |
| `/auction` | Live auction viewer |
| `/rules` | Auction & tournament rules |
| `/tournament` | Tournament information |
| `/sessions` | Session schedule |
| `/previous-seasons` | Season history & champions |
| `/gallery` | Photo gallery with lightbox |
| `/venue-contact` | Venue & contact information |
| `/login` | Admin / Team owner login |

## Admin Panel

| URL | Description |
|-----|-------------|
| `/admin/dashboard` | Overview stats |
| `/admin/players` | Player CRUD |
| `/admin/teams` | Team management |
| `/admin/auction` | Live auction control |
| `/admin/announcements` | Ticker announcements |
| `/admin/seasons` | Previous seasons management |
| `/admin/gallery` | Gallery image upload/manage |
| `/admin/sessions` | Session schedule management |
| `/admin/tournament-settings` | Venue & contact settings |
| `/admin/settings` | Auction & tournament config |
| `/admin/audit` | Audit log |
| `/admin/backup` | Download Excel + images backup |

## Setup & Run

### 1. Start the Backend

```bash
cd server
npm install
node index.js
# Server runs on https://tpl-2025.onrender.com
```

### 2. Start the Frontend

```bash
# In project root
npm install
ng serve
# App runs on http://localhost:4200
```

Or use the convenience script:
```
start.bat
```

## Admin Login

- URL: `http://localhost:4200/login`
- Username: `admin`
- Password: `tpl2026admin`

## Team Owner Login

- URL: `http://localhost:4200/login` → Team Owner tab
- Team ID: e.g. `TPL26-T01`
- Password: Owner's contact number (set when team is created)

## Google Drive Integration (Optional)

Copy `server/.env.example` to `server/.env` and fill in:

```env
DRIVE_FILE_ID=1Crgw70m9nfN_CaLy-24VUQjHs8cMbw9k
DRIVE_FOLDER_ID=1c124sGpFDaxVbEiKipJTQ1qePNKljW0y
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

When set:
- All Excel reads/writes go to the Google Drive file
- All image uploads go to the Google Drive folder
- On startup, the app syncs the latest Excel from Drive

When not set:
- Uses local `server/data/tpl2026.xlsx`
- Uses local `server/uploads/` folder

## Excel File Structure

Location: `server/data/tpl2026.xlsx`

| Sheet | Contents |
|-------|----------|
| Players | All player registrations |
| Teams | Registered teams with purse |
| Auction | Auction history |
| Bids | Individual bids |
| Announcements | Ticker messages |
| Settings | Auction & tournament config |
| AuditLog | Admin action history |
| PreviousSeasons | Season champions & history |
| Gallery | Gallery image metadata |
| TournamentSettings | Venue & contact info |

## Access Control

| Feature | Public | Team Owner | Admin |
|---------|--------|-----------|-------|
| View all public pages | ✅ | ✅ | ✅ |
| Register Player | ✅ | ✅ | ✅ |
| Edit/Delete Player | ❌ | ❌ | ✅ |
| Add/Edit Team | ❌ | ❌ | ✅ |
| View Auction | ✅ | ✅ | ✅ |
| Place Bid | ❌ | ✅ | ❌ |
| Auction Controls | ❌ | ❌ | ✅ |
| Manage Seasons/Gallery | ❌ | ❌ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ |
| Download Backup | ❌ | ❌ | ✅ |

## Production Deployment

1. Build Angular: `ng build --configuration production`
2. Serve `dist/cpl` via nginx or Express static
3. Set environment variables in `server/.env`
4. Use PM2: `pm2 start server/index.js`
5. For Netlify frontend: `_redirects` file is included automatically

## Netlify SPA Routing

The `src/_redirects` file is included in the build output:
```
/*    /index.html   200
```
This ensures direct URL access works on Netlify.
