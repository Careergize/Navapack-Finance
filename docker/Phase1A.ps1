[CmdletBinding()]
param(
 [Parameter(Mandatory)][ValidateSet('Preflight','Prepare','Lock','BuildBase','VerifyBase','Generate','BuildApp','Start','Initialize','Verify','Backup','Restore','VerifyRestore','Stop','Restart')][string]$Phase,
 [string]$FrappeDockerCommit,
 [string]$MariaDbTag,
 [string]$RedisTag,
 [string]$PythonImage,
 [switch]$CapacityReviewed
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Set-Location $PSScriptRoot
function Run([string]$Exe, [string[]]$Arguments) {
 & $Exe @Arguments
 if ($LASTEXITCODE -ne 0) { throw "$Exe failed (exit $LASTEXITCODE); phase stopped." }
}
function WriteUtf8([string]$Path, [string]$Value) {
 [IO.File]::WriteAllText($Path, $Value, [Text.UTF8Encoding]::new($false))
}
$envFile = Join-Path $PSScriptRoot '.env.local'
$lockFile = Join-Path $PSScriptRoot 'versions.local.json'
$baseImage = 'navapack-finance-base:16.53.0-frappe16.55.1'
$compose = @('compose','--project-directory',$PSScriptRoot,'--project-name','navapack-finance','--env-file',$envFile,'-f',"$PSScriptRoot/upstream/compose.yaml",'-f',"$PSScriptRoot/compose.finance.yaml")
function DC([string[]]$Arguments) { Run 'docker' ($compose + $Arguments) }
if ($Phase -eq 'Preflight') {
 Run docker @('version')
 Run docker @('info')
 Run docker @('compose','version')
 Run docker @('ps','-a')
 Run docker @('image','ls','--digests')
 Run docker @('volume','ls')
 Run docker @('network','ls')
 Run docker @('system','df')
 Run docker @('stats','--no-stream')
 Run wsl @('--status')
 Run wsl @('--list','--verbose')
 Get-PSDrive -PSProvider FileSystem | Select-Object Name,Used,Free
 $listener = Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object LocalPort -eq 8082
 if ($listener) { $listener | Format-Table; throw 'Port 8082 is occupied.' }
 $settings = Join-Path ([Environment]::GetFolderPath('ApplicationData')) 'Docker/settings-store.json'
 if (Test-Path $settings) {
  $s = Get-Content $settings -Raw | ConvertFrom-Json
  $s.PSObject.Properties | Where-Object Name -match 'disk|wsl|integration|memory|cpu' | Select-Object Name,Value
 }
 Write-Host 'Manually confirm physical disk image location and WSL integration in Docker Desktop Settings. Stop if capacity or location is unclear.'
 return
}
if ($Phase -eq 'Prepare') {
 if ($FrappeDockerCommit -notmatch '^[0-9a-f]{40}$') { throw 'Provide an exact reviewed official frappe_docker commit SHA.' }
 if (Test-Path upstream) { throw 'upstream already exists; preserve and inspect it instead of overwriting.' }
 Run git @('clone','--no-checkout','https://github.com/frappe/frappe_docker.git','upstream')
 Run git @('-C','upstream','checkout','--detach',$FrappeDockerCommit)
 if (!(Test-Path $envFile)) {
  $template = Get-Content .env.example -Raw
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  function Secret { $b = New-Object byte[] 32; $rng.GetBytes($b); return (($b | ForEach-Object { $_.ToString('x2') }) -join '') }
  $template = $template.Replace('REPLACE_WITH_RANDOM_HEX',(Secret)).Replace('REPLACE_WITH_DIFFERENT_RANDOM_HEX',(Secret))
  WriteUtf8 $envFile $template
  $rng.Dispose()
 }
 Write-Host 'Review the pinned upstream files and .env.local privately; do not print secrets or render Compose config to logs.'
 return
}
if (!(Test-Path $envFile) -or !(Test-Path upstream/compose.yaml)) { throw 'Complete Prepare first.' }
if ($Phase -eq 'Lock') {
 if (!$CapacityReviewed) { throw 'Inspect physical Docker storage and capacity first; pass -CapacityReviewed only after review.' }
 if (Test-Path $lockFile) { throw 'Version lock already exists; inspect it. No implicit re-resolution.' }
 if ($MariaDbTag -notmatch '^mariadb:11\.8\.\d+$') { throw 'Supply a verified exact MariaDB 11.8 patch tag.' }
 if ($RedisTag -notmatch '^redis:\d+\.\d+\.\d+-alpine$') { throw 'Supply a verified exact Redis patch tag matching reviewed upstream requirements.' }
 if ($PythonImage -notmatch '^python:3\.14\.\d+-slim-trixie$') { throw 'Supply a verified Python 3.14 patch image tag.' }
 $resolved = @{}
 foreach ($item in @($MariaDbTag,$RedisTag,$PythonImage)) {
  Run docker @('pull','--platform','linux/amd64',$item)
  $digest = & docker image inspect --format '{{index .RepoDigests 0}}' $item
  if ($LASTEXITCODE -ne 0 -or $digest -notmatch '@sha256:[0-9a-f]{64}$') { throw 'Cannot resolve immutable image digest.' }
  $resolved[$item] = $digest.Trim()
 }
 $sha = (& git -C upstream rev-parse HEAD).Trim()
 if ($LASTEXITCODE -ne 0) { throw 'Cannot read upstream commit.' }
 $lock = @{frappe='v16.55.1';erpnext='v16.53.0';frappe_docker=$sha;images=$resolved;node='24.14.0';bench='5.31.1'}
 WriteUtf8 $lockFile ($lock | ConvertTo-Json -Depth 5)
 $local = Get-Content $envFile -Raw
 $local = $local -replace '(?m)^MARIADB_IMAGE=.*$', ('MARIADB_IMAGE='+$resolved[$MariaDbTag])
 $local = $local -replace '(?m)^REDIS_IMAGE=.*$', ('REDIS_IMAGE='+$resolved[$RedisTag])
 WriteUtf8 $envFile $local
 $source = Get-Content upstream/images/custom/Containerfile -Raw
 $from = 'FROM python:${PYTHON_VERSION}-slim-${DEBIAN_BASE} AS base'
 if (!$source.Contains($from) -or !$source.Contains('pip3 install frappe-bench')) { throw 'Upstream build recipe changed; review adaptation before building.' }
 $source = $source.Replace($from,('FROM '+$resolved[$PythonImage]+' AS base')).Replace('pip3 install frappe-bench','pip3 install frappe-bench==5.31.1')
 New-Item -ItemType Directory -Path build -Force | Out-Null
 WriteUtf8 "$PSScriptRoot/build/Containerfile.base" $source
 Write-Host 'Digests locked. Review versions.local.json and generated build recipe before BuildBase.'
 return
}
if (!(Test-Path $lockFile)) { throw 'Complete Lock first.' }
$lock = Get-Content $lockFile -Raw | ConvertFrom-Json
$actualSha = (& git -C upstream rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $actualSha -ne $lock.frappe_docker) { throw 'Upstream checkout differs from version lock.' }
function VerifyBaseImage {
 # tmpfs hides the image's sites/apps.txt; reconstruct app discovery only in
 # this disposable container before invoking Bench. No site or DB is created.
 Run docker @('run','--rm','--pull=never','--platform','linux/amd64','--tmpfs','/home/frappe/frappe-bench/sites:uid=1000,gid=0','--tmpfs','/home/frappe/frappe-bench/logs:uid=1000,gid=0','--entrypoint','bash',$baseImage,'-c','set -e; ls -1 apps > sites/apps.txt; bench version; python --version; node --version; bench --version')
}
switch ($Phase) {
 'BuildBase' {
  Run docker @('build','--platform','linux/amd64','--build-arg','FRAPPE_BRANCH=v16.55.1','--build-arg','NODE_VERSION=24.14.0','--secret',"id=apps_json,src=$PSScriptRoot/apps.json",'-t',$baseImage,'-f',"$PSScriptRoot/build/Containerfile.base", "$PSScriptRoot/upstream")
  VerifyBaseImage
 }
 'VerifyBase' { VerifyBaseImage }
 'Generate' {
  if (Test-Path ../backend/navapack_finance) { throw 'Custom app already exists; refusing overwrite.' }
  # Work in a Linux container; only generated app source is copied to the host.
  # Override image-declared anonymous sites/logs volumes with temporary tmpfs.
  Run docker @('run','--rm','-it','--entrypoint','bash','--tmpfs','/home/frappe/frappe-bench/sites:uid=1000,gid=0','--tmpfs','/home/frappe/frappe-bench/logs:uid=1000,gid=0','--mount',"type=bind,source=$((Resolve-Path ../backend).Path),target=/output",$baseImage,'-c','set -e; ls -1 apps > sites/apps.txt; bench new-app navapack_finance; cp -a apps/navapack_finance /output/')
 }
 'BuildApp' {
  if (!(Test-Path ../backend/navapack_finance/pyproject.toml)) { throw 'Generate app first.' }
  Run docker @('build','--platform','linux/amd64','-t','navapack-finance:16.53.0-frappe16.55.1-local','-f',"$PSScriptRoot/Containerfile.app",(Resolve-Path ..).Path)
 }
 'Start' { DC @('config','--quiet'); DC @('up','-d','db','redis-cache','redis-queue','configurator','backend','frontend','websocket','queue-short','queue-long','scheduler'); DC @('ps','-a') }
 'Initialize' { DC @('run','--rm','--no-deps','site-tool','-c','python /opt/finance/site.py init') }
 'Verify' {
  DC @('ps','-a')
  DC @('exec','-T','backend','bench','--site','finance.localhost','list-apps')
  # Copy bytes directly; avoid PowerShell pipeline encoding and native JSON quoting.
  DC @('cp',"$PSScriptRoot/scripts/verify.py",'backend:/tmp/finance_verify.py')
  DC @('exec','-T','backend','./env/bin/python','/tmp/finance_verify.py','finance.localhost')
  DC @('exec','-T','backend','bench','--site','finance.localhost','doctor')
  $reply = Invoke-RestMethod 'http://127.0.0.1:8082/api/method/ping' -Headers @{Host='finance.localhost'}
  if ($reply.message -ne 'pong') { throw 'HTTP ping failed.' }
  Write-Host 'HTTP ping passed. Check login in browser and worker/queue evidence separately.'
 }
 'Backup' {
  DC @('exec','-T','backend','bench','--site','finance.localhost','backup','--with-files','--compress')
  New-Item -ItemType Directory -Path backups -Force | Out-Null
  DC @('cp','backend:/home/frappe/frappe-bench/sites/finance.localhost/private/backups/.',"$PSScriptRoot/backups")
  Get-ChildItem backups -File | Get-FileHash -Algorithm SHA256
 }
 'Restore' { DC @('run','--rm','--no-deps','site-tool','-c','python /opt/finance/site.py restore') }
 'VerifyRestore' {
  DC @('cp',"$PSScriptRoot/scripts/verify.py",'backend:/tmp/finance_verify.py')
  DC @('exec','-T','backend','bench','--site','finance-restore.localhost','list-apps')
  DC @('exec','-T','backend','./env/bin/python','/tmp/finance_verify.py','finance-restore.localhost')
 }
 'Stop' { DC @('stop') }
 'Restart' { DC @('start'); DC @('ps','-a') }
}
