# Build itch.io demo for Second Chance at a Billion
# Run from project root: powershell -ExecutionPolicy Bypass -File scripts\build_itchio.ps1

$ErrorActionPreference = 'Stop'
$root    = 'C:\Users\Dominic\Documents\Code\past_trading'
$outDir  = "$root\itchio_build\SecondChanceAtABillion_Demo"
$zipPath = "$root\itchio_build\SecondChanceAtABillion_Demo.zip"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host "=== Building itch.io demo ===" -ForegroundColor Cyan

# 1. Clean and create output directory
if (Test-Path "$root\itchio_build") { Remove-Item "$root\itchio_build" -Recurse -Force }
$null = New-Item -ItemType Directory -Path "$outDir\js"
$null = New-Item -ItemType Directory -Path "$outDir\css"
$null = New-Item -ItemType Directory -Path "$outDir\assets\market_data"
Write-Host "Created output directories."

# 2. Copy game files
Copy-Item "$root\index.html"    "$outDir\index.html"
Copy-Item "$root\css\style.css" "$outDir\css\style.css"
Copy-Item "$root\js\*.js"       "$outDir\js\"
Write-Host "Copied index.html, CSS, JS."

# 3. Copy only news events (stock data and music are inlined below)
Copy-Item "$root\assets\market_data\news_events.json" "$outDir\assets\market_data\news_events.json"
Write-Host "Copied news events."

# 4. Set DEMO_MODE = true (write without BOM)
$configPath = "$outDir\js\config.js"
$configContent = [System.IO.File]::ReadAllText($configPath, $utf8NoBom)
$configContent = $configContent.Replace('const DEMO_MODE = false;', 'const DEMO_MODE = true;')
[System.IO.File]::WriteAllText($configPath, $configContent, $utf8NoBom)
Write-Host "DEMO_MODE activated."

# 5. Remove CSP meta tag (conflicts with itch.io's iframe CSP), write without BOM
$htmlPath = "$outDir\index.html"
$htmlContent = [System.IO.File]::ReadAllText($htmlPath, $utf8NoBom)
$htmlContent = [regex]::Replace($htmlContent, '(?m)\s*<meta http-equiv="Content-Security-Policy"[^>]*>', '')
[System.IO.File]::WriteAllText($htmlPath, $htmlContent, $utf8NoBom)
Write-Host "CSP meta tag removed."

# 6. Embed background.mp3 as base64 data URL in audio_engine.js output
#    This eliminates any file-loading dependency for music on itch.io
Write-Host "Embedding music as base64 data URL..."
$mp3Bytes  = [System.IO.File]::ReadAllBytes("$root\assets\music\background.mp3")
$mp3Base64 = [System.Convert]::ToBase64String($mp3Bytes)
$mp3DataUrl = "data:audio/mpeg;base64,$mp3Base64"

$audioEnginePath = "$outDir\js\audio_engine.js"
$audioContent = [System.IO.File]::ReadAllText($audioEnginePath, $utf8NoBom)
$audioContent = $audioContent.Replace("'assets/music/background.mp3'", "'$mp3DataUrl'")
[System.IO.File]::WriteAllText($audioEnginePath, $audioContent, $utf8NoBom)
Write-Host "Music embedded ($(([math]::Round($mp3Bytes.Length / 1048576, 1))) MB MP3 -> $([math]::Round($mp3Base64.Length / 1048576, 1)) MB base64)."

# 7. Generate DEMO_STOCK_DATA inline JS from source stock JSON files
#    Strips unused 'day' and 'volume' fields; trims to 2020-2021 date range.
#    This eliminates all fetch() dependency for stock data on itch.io.
$demoTickers = @(
  # Consumer Staples + Consumer Discretionary (default unlocked)
  'WMT','PG','COST','KO','PEP','PM','MCD','NKE','MDLZ','CL','KMB','MO',
  'GIS','STZ','KHC','HSY','K','SJM','CLX','KDP','MNST','CHD','CAG','TSN',
  'HRL','CPB','TAP','BG','KVUE','EL','ADM','KR','SYY','DG','DLTR','TGT',
  'YUM','SBUX','DPZ','CMG','PCAR','GPC','AAP','AZO','ORLY','ROST','TJX',
  'ULTA','BBY','RL','UAA','VFC','PVH','TPR','WHR','NWL','HAS','MAT',
  'LVS','WYNN','MGM','MAR','HLT','RCL','CCL','NCLH','F','GM','BBWI',
  'DRI','QSR','WEN','TXRH','BJRI','BLMN','CBRL',
  # Utilities (default unlocked)
  'NEE','DUK','SO','D','AEP','EXC','SRE','XEL','WEC','ED','EIX','AWK',
  'DTE','PPL','ES','FE','AEE','CMS','PEG','ATO','CNP','NI','LNT','EVRG',
  'PNW','AES','VST','CEG','PCG','ETR',
  # Finance (unlockable in demo via financeStocks upgrade)
  'JPM','BAC','WFC','GS','MS','C','AXP','SCHW','USB','PNC','COF','BK',
  'STT','TFC','KEY','RF','HBAN','FITB','CFG','ZION','MTB','AIG','MET',
  'PRU','AFL','ALL','TRV','CB','MMC','PGR','STI','NCC','AMG','AIZ',
  # Healthcare (unlockable in demo via healthcareStocks upgrade)
  'JNJ','UNH','PFE','ABT','MRK','LLY','BMY','AMGN','GILD','TMO','MDT',
  'ABBV','SYK','BSX','DHR','CVS','CI','HUM','ELV','BIIB','REGN','VRTX',
  'BAX','MCK','CAH','COR','IQV','ZTS','HCA','IDXX','AET'
)

$startFilter = '2020-01-01'
$endFilter   = '2021-12-31'

Write-Host "Generating inline stock data for $($demoTickers.Count) tickers ($startFilter to $endFilter)..."
$sb = [System.Text.StringBuilder]::new()
[void]$sb.Append('const DEMO_STOCK_DATA={')
$firstTicker = $true
$inlinedCount = 0

foreach ($ticker in $demoTickers) {
  $src = "$root\assets\market_data\stocks\$ticker.json"
  if (-not (Test-Path $src)) { continue }

  $data    = Get-Content $src -Raw | ConvertFrom-Json
  $filtered = @($data.ohlc | Where-Object { $_.date -ge $startFilter -and $_.date -le $endFilter })
  if ($filtered.Count -eq 0) { continue }

  # Build compact OHLC array without 'day' or 'volume' fields
  $ohlcParts = foreach ($e in $filtered) {
    '{"date":"' + $e.date + '","open":' + $e.open + ',"high":' + $e.high + ',"low":' + $e.low + ',"close":' + $e.close + '}'
  }
  $ohlcJson = '[' + ($ohlcParts -join ',') + ']'

  if (-not $firstTicker) { [void]$sb.Append(',') }
  [void]$sb.Append('"').Append($ticker).Append('":{"ohlc":').Append($ohlcJson).Append('}')
  $firstTicker = $false
  $inlinedCount++
}

[void]$sb.Append('};')
$demoDataPath = "$outDir\js\demo_data.js"
[System.IO.File]::WriteAllText($demoDataPath, $sb.ToString(), $utf8NoBom)
$demoDataMb = [math]::Round((Get-Item $demoDataPath).Length / 1048576, 1)
Write-Host "Inline stock data generated: $inlinedCount tickers, $demoDataMb MB."

# 8. Inline CSS and JS into index.html
& "$root\scripts\inline_css.ps1" -OutDir $outDir

# 9. Inject DEMO_STOCK_DATA into the HTML (after all other scripts, before </body>)
#    Inserted last so it doesn't bloat the initial parse — data is only used on game start.
$htmlContent = [System.IO.File]::ReadAllText($htmlPath, $utf8NoBom)
$demoDataContent = [System.IO.File]::ReadAllText($demoDataPath, $utf8NoBom)
$demoScript = "<script>`r`n$demoDataContent`r`n</script>"
$htmlContent = $htmlContent.Replace('</body>', "$demoScript`r`n</body>")
[System.IO.File]::WriteAllText($htmlPath, $htmlContent, $utf8NoBom)
Write-Host "DEMO_STOCK_DATA injected into HTML."

# 10. Create zip
Compress-Archive -Path "$outDir\*" -DestinationPath $zipPath -Force
$bytes = (Get-Item $zipPath).Length
$mb = [math]::Round($bytes / 1048576, 1)
Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Output: $zipPath"
Write-Host "Size: $mb MB"
Write-Host "Upload this zip to itch.io as an HTML game."
