<#
.SYNOPSIS
  Verifies the redirect machine on a deployed origin (Cloudflare *.pages.dev now,
  or https://praveergupta.in after DNS cutover).

.EXAMPLE
  pwsh scripts/test-redirects.ps1 -BaseUrl https://praveer-musings.pages.dev

.NOTES
  Expects 301s with a correct Location for old Medium/github.io paths and /feed,
  and 200s for the live pages. github.io-dated paths also 301 here because they
  are in _redirects; their static stub fallback only matters on GitHub Pages.
#>
param(
	[Parameter(Mandatory = $true)]
	[string]$BaseUrl
)

$BaseUrl = $BaseUrl.TrimEnd('/')

# path, expectedStatus, expectedLocationSuffix ('' = don't check Location)
$cases = @(
	@('/',                                                                         200, ''),
	@('/blog/practical-guide-to-java-stream-api/',                                 200, ''),
	@('/rss.xml',                                                                  200, ''),
	@('/tags/',                                                                    200, ''),
	@('/about/',                                                                   200, ''),
	# Medium-style flat paths -> 301 to /blog/<slug>/
	@('/practical-guide-to-java-stream-api-7aadc02908f7',                          301, '/blog/practical-guide-to-java-stream-api/'),
	@('/book-review-soft-skills-the-software-developers-life-manual-b44b2cecf1c4', 301, '/blog/book-review-soft-skills/'),
	# github.io-dated path -> 301 (in _redirects)
	@('/technology/2016/02/13/rxjava-part-1-a-quick-introduction/',                301, '/blog/rxjava-part-1-a-quick-introduction/'),
	# feed + sitemap + about + tag wildcard
	@('/feed',                                                                     301, '/rss.xml'),
	@('/feed.xml',                                                                 301, '/rss.xml'),
	@('/sitemap.xml',                                                              301, '/sitemap-index.xml'),
	@('/about-me/',                                                                301, '/about/'),
	@('/tagged/java',                                                              301, '/tags/'),
	@('/archive/2016',                                                             301, '/')
)

$pass = 0
$fail = 0
foreach ($c in $cases) {
	$path = $c[0]; $wantStatus = $c[1]; $wantLoc = $c[2]
	$url = "$BaseUrl$path"
	# -s silent, -S show errors, -D - dump headers, -o NUL discard body, no -L (don't follow)
	$headers = & curl.exe -sS -D - -o $null $url 2>$null
	$statusLine = ($headers | Select-String -Pattern '^HTTP/' | Select-Object -Last 1).ToString()
	$status = if ($statusLine -match 'HTTP/\S+\s+(\d+)') { [int]$Matches[1] } else { 0 }
	$location = ($headers | Select-String -Pattern '^[Ll]ocation:\s*(.+?)\s*$' | Select-Object -Last 1)
	$locValue = if ($location) { $location.Matches[0].Groups[1].Value } else { '' }

	$ok = $status -eq $wantStatus
	if ($ok -and $wantLoc -ne '') { $ok = $locValue.TrimEnd('/') -like "*$($wantLoc.TrimEnd('/'))" }

	if ($ok) {
		$pass++
		Write-Host ("PASS  {0,3}  {1}" -f $status, $path) -ForegroundColor Green
	}
	else {
		$fail++
		$detail = "want $wantStatus"
		if ($wantLoc -ne '') { $detail += " -> $wantLoc" }
		$detail += "; got $status"
		if ($locValue) { $detail += " -> $locValue" }
		Write-Host ("FAIL  {0,3}  {1}  ({2})" -f $status, $path, $detail) -ForegroundColor Red
	}
}

Write-Host ""
Write-Host ("{0} passed, {1} failed" -f $pass, $fail)
if ($fail -gt 0) { exit 1 }
