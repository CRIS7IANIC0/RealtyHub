# Ejecuta la prueba de carga de RealtyHub con JMeter (modo consola) y genera el informe HTML.
#   .\jmeter\run-jmeter.ps1 -Users 50 -Ramp 30 -Loops 10
# Requiere JMeter en el PATH (jmeter -v) o la variable JMETER_HOME apuntando a su carpeta.
param(
  [int]$Users = 20,            # usuarios virtuales por grupo de hilos
  [int]$Ramp = 30,             # segundos para llegar a todos los usuarios
  [int]$Loops = 5,             # repeticiones del escenario por usuario
  [string]$HostWeb = "localhost", [int]$PortWeb = 3002,   # frontend (Next.js)
  [string]$HostApi = "localhost", [int]$PortApi = 3000,   # api-gateway
  [string]$Protocol = "http",
  [switch]$Writes              # SOLO en entornos de prueba: crea leads y visitas (POST). Por defecto la carga es de solo lectura.
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$jmeter = if ($env:JMETER_HOME) { Join-Path $env:JMETER_HOME "bin\jmeter.bat" } else { "jmeter" }
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = Join-Path $here "results\$stamp"
New-Item -ItemType Directory -Force $out | Out-Null

$writesFlag = $Writes.IsPresent.ToString().ToLower()
$jmArgs = @(
  "-n", "-t", (Join-Path $here "realtyhub-load-test.jmx"),
  "-l", (Join-Path $out "resultados.jtl"), "-e", "-o", (Join-Path $out "informe"),
  "-Jusers=$Users", "-Jramp=$Ramp", "-Jloops=$Loops", "-Jwrites=$writesFlag",
  "-Jhost_web=$HostWeb", "-Jport_web=$PortWeb", "-Jhost_api=$HostApi", "-Jport_api=$PortApi", "-Jprotocol=$Protocol",
  "-Jjmeter.save.saveservice.output_format=csv"
)
& $jmeter @jmArgs

Write-Host "`nInforme: $out\informe\index.html"
