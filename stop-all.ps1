# =====================================================================
# Script: stop-all.ps1
# Muc dich: Dung tat ca cac service Spring Boot dang chay tren he thong
# =====================================================================

$Host.UI.RawUI.WindowTitle = "Dung toan bo Microservices"

Write-Host "==========================================================" -ForegroundColor Red
Write-Host "   DANG DUNG TOAN BO CAC TIEN TRINH MICROSERVICES         " -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor Red

$ports = @(8888, 8761, 8081, 8082, 8083, 8084, 8080)
$stoppedAny = $false

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pidToKill in $pids) {
            try {
                $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host " -> Dang dung service tren Port $port (Process: $($proc.ProcessName), PID: $pidToKill)..." -ForegroundColor Yellow
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    $stoppedAny = $true
                }
            } catch {}
        }
    }
}

if ($stoppedAny) {
    Write-Host "`nDa dung thanh cong tat ca cac microservices!" -ForegroundColor Green
} else {
    Write-Host "`nKhong co microservice nao dang chiem cac port 8888, 8761, 8081-8084, 8080." -ForegroundColor Cyan
}
Write-Host "==========================================================" -ForegroundColor Gray
