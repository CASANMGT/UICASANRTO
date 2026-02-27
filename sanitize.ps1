$files = @("js/modules/rto.js", "js/modules/ui.js", "js/modules/store.js", "js/app.js")
foreach ($f in $files) {
    if (Test-Path $f) {
        $c = Get-Content $f -Raw
        $c = [regex]::Replace($c, "[^\x00-\x7F]", "")
        Set-Content $f -Value $c -Encoding utf8
        Write-Host "Sanitized $f"
    }
}
