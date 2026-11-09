# =====================================================================
# Script: start-all.ps1
# Muc dich: Tu dong khoi dong toan bo cac Microservices theo dung thu tu
# =====================================================================

$Host.UI.RawUI.WindowTitle = "Khoi dong Microservices E-Commerce"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   KHOI DONG HE THONG E-COMMERCE MICROSERVICES TU DONG    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 0. Kiem tra MySQL & Redis
Write-Host "`n[0/4] Kiem tra Ha tang (MySQL :3306 & Redis :6379)..." -ForegroundColor Yellow
$mysqlUp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
if (-not $mysqlUp.TcpTestSucceeded) {
    Write-Host " -> MySQL :3306 chua san sang! Dang khoi dong qua Docker..." -ForegroundColor Yellow
    docker compose up -d mysql redis
    Start-Sleep -Seconds 4
} else {
    Write-Host " -> MySQL :3306 va Redis :6379 da san sang!" -ForegroundColor Green
}

# Ham mo 1 cua so PowerShell de chay service
function Start-ServiceWindow {
    param(
        [string]$ServiceName,
        [int]$Port,
        [string]$Path
    )
    Write-Host " -> Dang mo tien trinh $ServiceName (Port $Port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = '$ServiceName ($Port)'; cd '$Path'; Write-Host '=========================================' -ForegroundColor Green; Write-Host '  DANG CHAY $ServiceName TRAPORT $Port  ' -ForegroundColor Green; Write-Host '=========================================' -ForegroundColor Green; mvn spring-boot:run"
}

# Ham kiem tra port den khi san sang
function Wait-For-Port {
    param(
        [int]$Port,
        [string]$ServiceName,
        [int]$TimeoutSeconds = 45
    )
    Write-Host " -> Cho $ServiceName khoi dong tai port $Port..." -NoNewline -ForegroundColor Yellow
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $check = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue
        if ($check.TcpTestSucceeded) {
            Write-Host " [SAN SANG!]" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
    Write-Host " [Qua thoi gian cho, tiep tuc]" -ForegroundColor Magenta
    return $false
}

# 1. Giai doan 1: config-server
Write-Host "`n[1/4] Giai doan 1: Centralized Config (config-server :8888)..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Config-Server" -Port 8888 -Path "$root\config-server"
Wait-For-Port -Port 8888 -ServiceName "config-server" -TimeoutSeconds 35

# 2. Giai doan 2: eureka-server
Write-Host "`n[2/4] Giai doan 2: Service Registry (eureka-server :8761)..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Eureka-Server" -Port 8761 -Path "$root\eureka-server"
Wait-For-Port -Port 8761 -ServiceName "eureka-server" -TimeoutSeconds 35

# 3. Giai doan 3: 4 Business Services (Khoi chay song song)
Write-Host "`n[3/4] Giai doan 3: Domain Services (Auth, Product, Order, Promotion)..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Auth-Service" -Port 8081 -Path "$root\auth-service"
Start-ServiceWindow -ServiceName "Product-Service" -Port 8082 -Path "$root\product-service"
Start-ServiceWindow -ServiceName "Order-Service" -Port 8083 -Path "$root\order-service"
Start-ServiceWindow -ServiceName "Promotion-Service" -Port 8084 -Path "$root\promotion-service"

Wait-For-Port -Port 8081 -ServiceName "auth-service" -TimeoutSeconds 45
Wait-For-Port -Port 8082 -ServiceName "product-service" -TimeoutSeconds 45
Wait-For-Port -Port 8083 -ServiceName "order-service" -TimeoutSeconds 45
Wait-For-Port -Port 8084 -ServiceName "promotion-service" -TimeoutSeconds 45

Write-Host "Cho them 10 giay de tat ca services hoan tat dang ky Heartbeat vao Eureka..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 4. Giai doan 4: gateway-server
Write-Host "`n[4/4] Giai doan 4: Edge Routing (gateway-server :8080)..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Gateway-Server" -Port 8080 -Path "$root\gateway-server"
Wait-For-Port -Port 8080 -ServiceName "gateway-server" -TimeoutSeconds 35

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  TAT CA DICH VU MICROSERVICES DA DUOC KHOI DONG XONG!     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " - Eureka Dashboard : http://localhost:8761" -ForegroundColor White
Write-Host " - API Gateway      : http://localhost:8080" -ForegroundColor White
Write-Host " - Web Frontend     : http://localhost:3000 (Docker) hoac http://localhost:5173" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor Gray
Write-Host " Muon dung toan bo he thong, chay script: .\stop-all.ps1" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Gray
