Stop-Process -Id 14384 -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500
cmd /c rmdir /s /q "C:\Users\Dominic\Documents\Code\past_trading\itchio_build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Deleted successfully."
} else {
    Write-Host "Still locked. Exit code: $LASTEXITCODE"
}
