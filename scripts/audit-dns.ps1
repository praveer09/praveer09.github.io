#!/usr/bin/env pwsh
# Phase 5.0 pre-flight: snapshot the CURRENT public DNS for a domain before moving
# nameservers to Cloudflare. Saves a human-readable backup and flags the email records
# (MX / SPF / DKIM / DMARC) that MUST be re-created in Cloudflare after the move, or mail
# will silently break.
#
# NOTE: Resolve-DnsName queries from this machine's public resolver, so it captures the
# zone as it is visible on the internet right now. It can NOT see registrar-side records
# that aren't currently published. Always cross-check against your registrar's zone editor.
#
#   pwsh scripts/audit-dns.ps1 -Domain praveergupta.in
#
[CmdletBinding()]
param(
	[string]$Domain = 'praveergupta.in',
	[string]$OutFile
)

if (-not $PSBoundParameters.ContainsKey('OutFile') -or [string]::IsNullOrWhiteSpace($OutFile)) {
	$OutFile = "migration/dns-backup-$($Domain -replace '\.', '-').txt"
}

$ErrorActionPreference = 'Stop'

# Common DKIM selectors to probe (best-effort; add yours if known).
$dkimSelectors = @('google', 'selector1', 'selector2', 'default', 'k1', 'mail', 's1', 's2')

$lines = [System.Collections.Generic.List[string]]::new()
function Add-Line([string]$s = '') { $lines.Add($s) }

function Resolve-Safe([string]$name, [string]$type) {
	try {
		return Resolve-DnsName -Name $name -Type $type -ErrorAction Stop |
			Where-Object { $_.Type -eq $type -or $_.QueryType -eq $type }
	} catch {
		return @()
	}
}

Add-Line "DNS backup for $Domain"
Add-Line "Captured: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz') (public resolver view)"
Add-Line "Tool: Resolve-DnsName on $env:COMPUTERNAME"
Add-Line ('=' * 72)

$emailFlags = [System.Collections.Generic.List[string]]::new()

foreach ($type in @('NS', 'A', 'AAAA', 'CNAME', 'MX', 'CAA')) {
	Add-Line ''
	Add-Line "### $type"
	$recs = Resolve-Safe $Domain $type
	if (-not $recs) { Add-Line '  (none)'; continue }
	foreach ($r in $recs) {
		switch ($type) {
			'A' { Add-Line "  $($r.IPAddress)" }
			'AAAA' { Add-Line "  $($r.IPAddress)" }
			'NS' { Add-Line "  $($r.NameHost)" }
			'CNAME' { Add-Line "  -> $($r.NameHost)" }
			'MX' {
				Add-Line "  $($r.Preference)`t$($r.NameExchange)"
				$emailFlags.Add("MX: pref $($r.Preference) -> $($r.NameExchange)")
			}
			'CAA' { Add-Line "  $($r.ToString())" }
		}
	}
}

# TXT at apex (SPF / DMARC live here or under _dmarc / DKIM under selector._domainkey).
Add-Line ''
Add-Line '### TXT (apex)'
$apexTxt = Resolve-Safe $Domain 'TXT'
if (-not $apexTxt) { Add-Line '  (none)' }
foreach ($r in $apexTxt) {
	$txt = ($r.Strings -join '')
	Add-Line "  $txt"
	if ($txt -match 'v=spf1') { $emailFlags.Add("SPF: $txt") }
}

Add-Line ''
Add-Line '### TXT (_dmarc)'
$dmarc = Resolve-Safe "_dmarc.$Domain" 'TXT'
if (-not $dmarc) { Add-Line '  (none)' }
foreach ($r in $dmarc) {
	$txt = ($r.Strings -join '')
	Add-Line "  $txt"
	if ($txt -match 'v=DMARC1') { $emailFlags.Add("DMARC: $txt") }
}

Add-Line ''
Add-Line '### TXT (DKIM selectors probed)'
$foundDkim = $false
foreach ($sel in $dkimSelectors) {
	$dk = Resolve-Safe "$sel._domainkey.$Domain" 'TXT'
	if (-not $dk) { $dk = Resolve-Safe "$sel._domainkey.$Domain" 'CNAME' }
	foreach ($r in $dk) {
		$foundDkim = $true
		$val = if ($r.Strings) { ($r.Strings -join '') } else { $r.NameHost }
		Add-Line "  $sel._domainkey -> $val"
		$emailFlags.Add("DKIM ($sel): present")
	}
}
if (-not $foundDkim) { Add-Line '  (no DKIM found for the probed selectors; check your mail provider for the real selector)' }

Add-Line ''
Add-Line ('=' * 72)
Add-Line '### ⚠️ EMAIL RECORDS TO RE-CREATE IN CLOUDFLARE BEFORE/DURING CUTOVER'
if ($emailFlags.Count -eq 0) {
	Add-Line '  None detected via public DNS. If this domain sends/receives mail, verify at your'
	Add-Line '  registrar — some providers hide records from public probes.'
} else {
	foreach ($f in $emailFlags) { Add-Line "  - $f" }
}
Add-Line ''
Add-Line 'Reminder: Resolve-DnsName only sees published records. Cross-check the full zone in'
Add-Line 'your registrar/Medium DNS editor and re-create EVERYTHING (especially MX/SPF/DKIM/'
Add-Line 'DMARC) in Cloudflare BEFORE switching nameservers.'

$dir = Split-Path -Parent $OutFile
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$lines -join "`n" | Set-Content -Path $OutFile -Encoding utf8

Write-Host ($lines -join "`n")
Write-Host ''
Write-Host "Saved -> $OutFile" -ForegroundColor Green
