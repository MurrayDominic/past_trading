@echo off
echo Starting Past Trading game server...
echo.
echo Server will run at http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
start http://127.0.0.1:8000
python -m http.server 8000 --bind 127.0.0.1
