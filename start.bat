@echo off
echo Starting TPL2026 Backend Server...
cd /d %~dp0server
start "TPL2026 Backend" cmd /k "node index.js"
echo.
echo Starting TPL2026 Frontend...
cd /d %~dp0
start "TPL2026 Frontend" cmd /k "npx ng serve --open"
echo.
echo TPL2026 is starting up!
echo Backend:  https://tpl-2025.onrender.com
echo Frontend: http://localhost:4200
echo.
echo Admin Login: admin / tpl2026admin
echo.
echo Public Pages:
echo   Home:            http://localhost:4200/
echo   Players:         http://localhost:4200/players
echo   Teams:           http://localhost:4200/teams
echo   Auction:         http://localhost:4200/auction
echo   Rules:           http://localhost:4200/rules
echo   Tournament:      http://localhost:4200/tournament
echo   Sessions:        http://localhost:4200/sessions
echo   Previous Seasons:http://localhost:4200/previous-seasons
echo   Gallery:         http://localhost:4200/gallery
echo   Venue & Contact: http://localhost:4200/venue-contact
