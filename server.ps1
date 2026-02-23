$port = 5501
$path = "C:\Users\claux\.gemini\antigravity\scratch\casan_rto"

Write-Host "Starting simple HTTP server at http://localhost:$port"
Write-Host "Press Ctrl+C to stop"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $path + $request.Url.LocalPath
    
    # Simple routing to index.html for root
    if ($request.Url.LocalPath -eq "/") {
        $localPath = $path + "\index.html"
    }
    
    # Validate path prevents directory traversal
    if (-not $localPath.StartsWith($path)) {
        $response.StatusCode = 403
        $response.Close()
        continue
    }

    if (Test-Path $localPath -PathType Leaf) {
        try {
            # MIME Types
            $extension = [System.IO.Path]::GetExtension($localPath)
            switch ($extension) {
                ".html" { $contentType = "text/html" }
                ".css"  { $contentType = "text/css" }
                ".js"   { $contentType = "application/javascript" }
                ".png"  { $contentType = "image/png" }
                ".jpg"  { $contentType = "image/jpeg" }
                default { $contentType = "application/octet-stream" }
            }
            
            $content = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } catch {
            $response.StatusCode = 500
        }
    } else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}
