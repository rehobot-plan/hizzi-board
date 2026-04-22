$root = $PSScriptRoot
$presetsFile = Join-Path $root 'presets.json'
$staging = Join-Path $root '_staging'

if (-not (Test-Path $presetsFile)) {
    Write-Host '[ERROR] presets.json 없음: $presetsFile' -ForegroundColor Red
    exit 1
}

$presets = Get-Content $presetsFile -Raw -Encoding UTF8 | ConvertFrom-Json

if (-not $presets.current) {
    Write-Host '[ERROR] presets.json에 current 엔트리 없음' -ForegroundColor Red
    exit 1
}

$preset = $presets.current

if (Test-Path $staging) {
    Remove-Item "$staging\*" -Force -Recurse -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Path $staging | Out-Null
}

$missing = @()
$copied = 0
foreach ($file in $preset.files) {
    if (Test-Path $file) {
        Copy-Item $file -Destination $staging -Force
        $copied++
        Write-Host "  복사: $(Split-Path $file -Leaf)" -ForegroundColor Green
    } else {
        $missing += $file
        Write-Host "  누락: $file" -ForegroundColor Red
    }
}

Write-Host ''
Write-Host "완료: $($copied)개 복사됨" -ForegroundColor Cyan
Write-Host "설명: $($preset.description)" -ForegroundColor Gray
if ($missing.Count -gt 0) {
    Write-Host "경고: $($missing.Count)개 누락" -ForegroundColor Yellow
}

Start-Process explorer.exe $staging