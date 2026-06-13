$path = 'C:\Users\Dominic\Documents\Code\past_trading\itchio_build'
Get-Process | Where-Object { $_.Name -match 'electron|node|explorer|code' } | Select-Object Id, Name | Format-Table -AutoSize
