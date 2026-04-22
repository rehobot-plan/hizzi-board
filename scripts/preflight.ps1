# preflight.ps1 — UserPromptSubmit hook
# /start-session 명령은 예외 처리 (flag 없어도 통과)

# stdin에서 JSON 읽기 → prompt 필드 추출
try {
    $jsonInput = [System.IO.StreamReader]::new([System.Console]::OpenStandardInput()).ReadToEnd()
    $parsed = $jsonInput | ConvertFrom-Json
    $prompt = $parsed.prompt
} catch {
    $prompt = ""
}

# /start-session 예외: flag 없어도 통과
if ($prompt -match '/start-session') {
    exit 0
}

# flag 체크
$flag = ".harness/session-started.flag"
if (!(Test-Path $flag)) {
    Write-Host "PREFLIGHT FAIL: /start-session을 먼저 실행하세요."
    exit 2
}

Write-Host "PREFLIGHT PASS"
exit 0
