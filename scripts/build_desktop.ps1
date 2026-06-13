$ErrorActionPreference = 'Stop'
$root   = 'C:\Users\Dominic\Documents\Code\past_trading'
$outDir = 'C:\Users\Dominic\Desktop\SecondChanceAtABillion_Demo'
$zipPath = 'C:\Users\Dominic\Desktop\SecondChanceAtABillion_Demo.zip'

# Clean
if (Test-Path $outDir)  { Remove-Item $outDir  -Recurse -Force }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Dirs
New-Item -ItemType Directory -Path "$outDir\js"                         | Out-Null
New-Item -ItemType Directory -Path "$outDir\css"                        | Out-Null
New-Item -ItemType Directory -Path "$outDir\assets\market_data"         | Out-Null
New-Item -ItemType Directory -Path "$outDir\assets\music"               | Out-Null

# Copy
Copy-Item "$root\index.html"    "$outDir\index.html"
Copy-Item "$root\css\style.css" "$outDir\css\style.css"
Copy-Item "$root\js\*.js"       "$outDir\js\"
Copy-Item "$root\assets\market_data\compressed" "$outDir\assets\market_data\compressed" -Recurse
Copy-Item "$root\assets\market_data\news_events.json" "$outDir\assets\market_data\news_events.json"
Copy-Item "$root\assets\music\*" "$outDir\assets\music\" -Recurse
Copy-Item "$root\assets\logo.svg" "$outDir\assets\logo.svg"
Copy-Item "$root\assets\icon.png" "$outDir\assets\icon.png"
Write-Host "Files copied."

# DEMO_MODE
(Get-Content "$outDir\js\config.js" -Raw) -replace 'const DEMO_MODE = false;','const DEMO_MODE = true;' |
  Set-Content "$outDir\js\config.js" -Encoding UTF8
Write-Host "DEMO_MODE enabled."

# Read source
$html = Get-Content "$outDir\index.html" -Raw -Encoding UTF8
$css  = Get-Content "$outDir\css\style.css" -Raw -Encoding UTF8

# Remove CSP
$html = ($html -split "`n" | Where-Object { $_ -notmatch 'Content-Security-Policy' }) -join "`n"

# Inline CSS
$styleTag = "<style>`n$css`n</style>"
$html = $html.Replace('<link rel="stylesheet" href="css/style.css">', $styleTag)
Write-Host "CSS inlined."

# Inline JS
$jsFiles = @(
  'sp500_tickers.js','config.js','save_manager.js','data_loader.js',
  'market.js','trading.js','sec.js','news.js','quarterly.js',
  'progression.js','achievements.js','leaderboard.js','chart_manager.js',
  'audio_engine.js','ui.js','main.js'
)
foreach ($f in $jsFiles) {
  $js = Get-Content "$outDir\js\$f" -Raw -Encoding UTF8
  $html = $html.Replace("<script src=`"js/$f`"></script>", "<script>`n$js`n</script>")
  Write-Host "  Inlined $f"
}

Set-Content "$outDir\index.html" $html -Encoding UTF8

# Sanity check
$count = ([regex]::Matches($html, 'class GameUI')).Count
if ($count -ne 1) { Write-Error "DUPLICATION: $count copies of class GameUI!"; exit 1 }
$lines = $html.Split("`n").Count
Write-Host "Check passed: 1 copy, $lines lines."

# Zip
Compress-Archive -Path "$outDir\*" -DestinationPath $zipPath -Force
Write-Host ""
Write-Host "=== DONE ==="
Write-Host "ZIP is on your Desktop: SecondChanceAtABillion_Demo.zip"
