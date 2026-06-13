param([string]$OutDir)

$htmlPath = Join-Path $OutDir "index.html"
$html = Get-Content $htmlPath -Raw -Encoding UTF8

# Inline CSS — use .Replace() (literal, not regex) to avoid $ interpretation
$cssPath = Join-Path $OutDir "css\style.css"
$css = Get-Content $cssPath -Raw -Encoding UTF8
$styleTag = "<style>`r`n$css`r`n</style>"
$html = $html.Replace('<link rel="stylesheet" href="css/style.css">', $styleTag)
Write-Host "CSS inlined"

# Inline JS files in load order
$jsFiles = @(
  "js\sp500_tickers.js",
  "js\config.js",
  "js\save_manager.js",
  "js\data_loader.js",
  "js\market.js",
  "js\trading.js",
  "js\sec.js",
  "js\news.js",
  "js\quarterly.js",
  "js\progression.js",
  "js\achievements.js",
  "js\leaderboard.js",
  "js\chart_manager.js",
  "js\audio_engine.js",
  "js\ui.js",
  "js\main.js"
)

foreach ($jsFile in $jsFiles) {
  $jsPath = Join-Path $OutDir $jsFile
  $srcAttr = $jsFile.Replace('\', '/')
  $js = Get-Content $jsPath -Raw -Encoding UTF8
  $scriptTag = "<script>`r`n$js`r`n</script>"
  # Use .Replace() instead of -replace to treat JS content as a literal string,
  # not a regex replacement pattern (avoids $' $` $& interpretation corrupting HTML)
  $html = $html.Replace("<script src=""$srcAttr""></script>", $scriptTag)
  Write-Host "Inlined $jsFile"
}

# Write without BOM — itch.io's CDN may misread encoding if BOM is present
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($htmlPath, $html, $utf8NoBom)
Write-Host "Done - all assets inlined into index.html"
