$ErrorActionPreference = "Stop"
$project = "C:\Users\Administrador\Projeto Lovable\remix-of-remix-of-your-personal-assistant-95"

# Load local model settings into the server process without exposing them in the UI.
$envFile = Join-Path $project ".env.local"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$') {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
  }
}

$env:JARVIS_HOST = "0.0.0.0"
$env:JARVIS_PORT = "7843"
$env:JARVIS_TOKEN = "jarvis-local-7843-2026"
$bridgeNote = Join-Path $project "jarvis-bridge.txt"

if (-not (Get-NetTCPConnection -LocalPort 7843 -State Listen -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath "C:\Python313\python.exe" `
    -ArgumentList "-u", "agent\jarvis_agent.py" `
    -WorkingDirectory $project -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $env:TEMP "jarvis_bridge.log") `
    -RedirectStandardError (Join-Path $env:TEMP "jarvis_bridge.err")
}

# Abre automaticamente os dados que devem ser copiados para a Bridge.
@"
J.A.R.V.I.S. - CONEXAO DA BRIDGE

No mesmo computador:
URL: http://127.0.0.1:7843
Token: $env:JARVIS_TOKEN

Na visualizacao HTTPS do Lovable ou no celular:
URL: execute o cloudflared e copie a URL https://...trycloudflare.com que aparecer
Token: $env:JARVIS_TOKEN

Comando do Cloudflare:
cloudflared tunnel --url http://127.0.0.1:7843

Mantenha o agente e o cloudflared abertos enquanto usar a Bridge.
"@ | Set-Content -Path $bridgeNote -Encoding UTF8
Start-Process -FilePath "notepad.exe" -ArgumentList $bridgeNote

$siteNoAr = $false
$viteRodando = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like "*vite.js*" }).Count
foreach ($port in @(8080, 8081, 8082, 5173)) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    $siteNoAr = $true
    break
  }
}
if ($viteRodando -gt 0) { $siteNoAr = $true }
if (-not $siteNoAr) {
  Start-Process -FilePath "node.exe" `
    -ArgumentList "node_modules\vite\bin\vite.js", "--host=0.0.0.0" `
    -WorkingDirectory $project -WindowStyle Hidden
}

$webUrl = $null
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  foreach ($port in @(8080, 8081, 8082, 5173)) {
    try {
      Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -UseBasicParsing -TimeoutSec 1 | Out-Null
      $webUrl = "http://localhost:$port/"
      break
    } catch { }
  }
  if ($webUrl) { break }
  Start-Sleep -Milliseconds 500
}
if ($webUrl) {
  Start-Process $webUrl
} else {
  Start-Process "http://localhost:8080/"
}