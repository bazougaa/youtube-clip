$ErrorActionPreference = "Stop"

function Assert-CommandExists {
  param([Parameter(Mandatory = $true)][string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is not installed or not on PATH."
  }
}

Assert-CommandExists -Name "node"
Assert-CommandExists -Name "npm"

Write-Host "node: $(node -v)"
Write-Host "npm:  $(npm -v)"

if (Test-Path "package-lock.json") {
  npm ci
} else {
  npm install
}

npm run lint
npm test
npm run build

Write-Host "OK: lint + test + build passed"

