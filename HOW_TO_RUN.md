# How to Run Past Trading

## Quick Start

1. Double-click `start_game.bat`
2. Browser will automatically open to http://localhost:8000
3. Press Ctrl+C in the terminal to stop the server

## Alternative: Manual Start

```bash
cd C:\Users\Dominic\Documents\Code\past_trading
python -m http.server 8000
```

Then open your browser to http://localhost:8000

## Why Do I Need a Web Server?

The game loads JSON data files using JavaScript's `fetch()` API. For security reasons, modern browsers block these requests when opening HTML files directly (using the `file://` protocol). Running a local web server serves the files over HTTP, which allows the game to load all its data properly.

## Troubleshooting

### "python is not recognized"
- **Solution:** Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### Port Already in Use
- **Solution:** Change the port number in `start_game.bat` from `8000` to another number (e.g., `8080`, `3000`, `5000`)
- Update both lines: the URL and the server command

### Still Seeing CORS Errors
- **Check:** Make sure you're accessing via `http://localhost:8000`, not `file://`
- **Verify:** The browser address bar should show `http://` not `file://`

### Server Won't Start
- **Check:** Python is installed: Run `python --version` in a terminal
- **Check:** No other program is using port 8000
- **Try:** Use a different port number

## Alternative Methods

### Node.js http-server
If you have Node.js installed:
```bash
npm install -g http-server
cd C:\Users\Dominic\Documents\Code\past_trading
http-server -p 8000
```

### VS Code Live Server
If you use Visual Studio Code:
1. Install the "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

## Verification

Once the server is running, you should see:
- ✅ Browser opens to `http://localhost:8000`
- ✅ Game loads without errors
- ✅ Console shows "News events loaded successfully"
- ✅ Console shows "Loaded 106 stocks with real historical data"
- ✅ No CORS errors in the browser console (F12)

## About the Game

Past Trading is a browser-based roguelike trading game where you travel back in time with knowledge of future market events. The game runs entirely client-side with no backend required.

For more information, see the README.md file.
