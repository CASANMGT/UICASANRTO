$port = 5500
$path = "c:\Users\claux\.gemini\antigravity\scratch\casan_rto"

Write-Host "Starting CASAN RTO App Server at http://localhost:$port"
Write-Host "Press Ctrl+C to stop"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
} catch {
    Write-Host "Port $port already in use. Trying 5501..."
    $port = 5501
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

Write-Host "Listening on http://localhost:$port"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $path + $request.Url.LocalPath
    
    if ($request.Url.LocalPath -eq "/") {
        $localPath = $path + "\index.html"
    }
    
    if (Test-Path $localPath -PathType Leaf) {
        try {
            $extension = [System.IO.Path]::GetExtension($localPath)
            switch ($extension) {
                ".html" { $contentType = "text/html" }
                ".css"  { $contentType = "text/css" }
                ".js"   { $contentType = "application/javascript" }
                ".png"  { $contentType = "image/png" }
                default { $contentType = "application/octet-stream" }
            }
            
            $content = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.StatusCode = 200
        } catch {
            $response.StatusCode = 500
        }
    } else {
        $response.StatusCode = 404
        # Write-Host "404 Not Found: $localPath"
    }
    
    $response.Close()
}
