$ErrorActionPreference = 'Stop'

$targets = @(
  @{ id='01_recruit_top'; category='recruit_top'; title='NTTDATA CCS recruit top'; url='https://www.nttdata-ccs.co.jp/recruit/index.html' },
  @{ id='02_recruit_interview'; category='interview'; title='NTTDATA CCS interview'; url='https://www.nttdata-ccs.co.jp/recruit/#interview' },
  @{ id='03_recruit_career_plan'; category='career_plan'; title='NTTDATA CCS career plan'; url='https://www.nttdata-ccs.co.jp/recruit/career_plan/' },
  @{ id='04_recruit_in_house_system'; category='in_house_system'; title='NTTDATA CCS in house system'; url='https://www.nttdata-ccs.co.jp/recruit/in-house_system/' },
  @{ id='05_recruit_corporate_culture'; category='corporate_culture'; title='NTTDATA CCS corporate culture'; url='https://www.nttdata-ccs.co.jp/recruit/corporate_culture/' },
  @{ id='06_recruit_news'; category='recruit_news'; title='NTTDATA CCS recruit news'; url='https://www.nttdata-ccs.co.jp/recruit/news/' },
  @{ id='07_mynavi_outline'; category='mynavi_outline'; title='Mynavi company outline'; url='https://job.mynavi.jp/27/pc/search/corp73343/outline.html' },
  @{ id='08_mynavi_employment'; category='mynavi_employment'; title='Mynavi employment'; url='https://job.mynavi.jp/27/pc/corpinfo/displayEmployment/index?corpId=73343&recruitingCourseId=27024568' }
)

$outDir = Join-Path (Resolve-Path '.').Path 'docs/rag/recruit_ccs'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

Add-Type -AssemblyName System.Web

function Normalize-Text([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return '' }
  $v = $text -replace "`r", ''
  $v = $v -replace "`t", ' '
  $v = [System.Net.WebUtility]::HtmlDecode($v)
  $v = $v -replace "\n{3,}", "`n`n"
  $v = $v -replace ' {2,}', ' '
  return $v.Trim()
}

function Detect-EncodingName([byte[]]$bytes) {
  $headLen = [Math]::Min(4096, $bytes.Length)
  $head = [System.Text.Encoding]::ASCII.GetString($bytes, 0, $headLen)

  $m1 = [regex]::Match($head, '(?i)charset\s*=\s*"?([a-zA-Z0-9_\-]+)')
  if ($m1.Success) { return $m1.Groups[1].Value.ToLowerInvariant() }

  $m2 = [regex]::Match($head, '(?i)encoding\s*=\s*"?([a-zA-Z0-9_\-]+)')
  if ($m2.Success) { return $m2.Groups[1].Value.ToLowerInvariant() }

  return 'utf-8'
}

function Decode-Html([byte[]]$bytes) {
  $name = Detect-EncodingName $bytes
  try {
    $enc = [System.Text.Encoding]::GetEncoding($name)
  } catch {
    if ($name -match 'shift[_-]?jis|sjis|x-sjis|cp932') {
      $enc = [System.Text.Encoding]::GetEncoding(932)
    } else {
      $enc = [System.Text.Encoding]::UTF8
    }
  }
  return $enc.GetString($bytes)
}

function Download-Html([string]$url) {
  $tmp = Join-Path $env:TEMP ([Guid]::NewGuid().ToString() + '.html')
  try {
    Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing -TimeoutSec 45 | Out-Null
    $bytes = [System.IO.File]::ReadAllBytes($tmp)
    return Decode-Html $bytes
  } finally {
    if (Test-Path $tmp) { Remove-Item $tmp -Force }
  }
}

function Html-ToText([string]$html) {
  $body = $html
  $body = [regex]::Replace($body, '(?is)<script.*?</script>', ' ')
  $body = [regex]::Replace($body, '(?is)<style.*?</style>', ' ')
  $body = [regex]::Replace($body, '(?is)<noscript.*?</noscript>', ' ')
  $body = [regex]::Replace($body, '(?is)<svg.*?</svg>', ' ')
  $body = [regex]::Replace($body, '(?i)</(p|div|li|h1|h2|h3|h4|h5|h6|tr|section|article|main|br)>', "`n")
  $body = [regex]::Replace($body, '(?is)<.*?>', ' ')
  return Normalize-Text $body
}

function Extract-ImageHints([string]$html, [string]$baseUrl) {
  $results = New-Object 'System.Collections.Generic.List[string]'

  $figureMatches = [regex]::Matches($html, '(?is)<figure\b[^>]*>(.*?)</figure>')
  foreach ($m in $figureMatches) {
    $figure = $m.Groups[1].Value
    $imgMatch = [regex]::Match($figure, '(?is)<img\b[^>]*>')
    if (-not $imgMatch.Success) { continue }

    $imgTag = $imgMatch.Value
    $src = ([regex]::Match($imgTag, '(?i)\bsrc\s*=\s*["'']([^"''>]+)["'']')).Groups[1].Value
    $alt = Normalize-Text (([regex]::Match($imgTag, '(?i)\balt\s*=\s*["'']([^"''>]*)["'']')).Groups[1].Value)
    $title = Normalize-Text (([regex]::Match($imgTag, '(?i)\btitle\s*=\s*["'']([^"''>]*)["'']')).Groups[1].Value)
    $aria = Normalize-Text (([regex]::Match($imgTag, '(?i)\baria-label\s*=\s*["'']([^"''>]*)["'']')).Groups[1].Value)
    $cap = Normalize-Text (([regex]::Match($figure, '(?is)<figcaption\b[^>]*>(.*?)</figcaption>')).Groups[1].Value -replace '(?is)<.*?>', ' ')

    $fileName = ''
    if ($src) {
      try {
        $uri = [Uri]::new([Uri]$baseUrl, $src)
        $fileName = [System.IO.Path]::GetFileName($uri.AbsolutePath)
      } catch {
        $fileName = $src
      }
    }

    $hints = @($alt, $title, $aria, $cap) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    $hintText = if ($hints.Count -gt 0) { ($hints -join ' / ') } else { 'no_text_hint_ocr_not_run' }
    $results.Add("- src: $src`n  file: $fileName`n  hint: $hintText") | Out-Null
  }

  if ($results.Count -eq 0) {
    $imgMatches = [regex]::Matches($html, '(?is)<img\b[^>]*>')
    foreach ($m in $imgMatches) {
      $imgTag = $m.Value
      $src = ([regex]::Match($imgTag, '(?i)\bsrc\s*=\s*["'']([^"''>]+)["'']')).Groups[1].Value
      if ([string]::IsNullOrWhiteSpace($src)) { continue }
      $alt = Normalize-Text (([regex]::Match($imgTag, '(?i)\balt\s*=\s*["'']([^"''>]*)["'']')).Groups[1].Value)
      $title = Normalize-Text (([regex]::Match($imgTag, '(?i)\btitle\s*=\s*["'']([^"''>]*)["'']')).Groups[1].Value)
      $aria = Normalize-Text (([regex]::Match($imgTag, '(?i)\baria-label\s*=\s*["'']([^"''>]*)["'']')).Groups[1].Value)
      $fileName = ''
      try {
        $uri = [Uri]::new([Uri]$baseUrl, $src)
        $fileName = [System.IO.Path]::GetFileName($uri.AbsolutePath)
      } catch {
        $fileName = $src
      }
      $hints = @($alt, $title, $aria) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
      $hintText = if ($hints.Count -gt 0) { ($hints -join ' / ') } else { 'no_text_hint_ocr_not_run' }
      $results.Add("- src: $src`n  file: $fileName`n  hint: $hintText") | Out-Null
      if ($results.Count -ge 20) { break }
    }
  }

  if ($results.Count -eq 0) { return "(no_image_hints)" }
  return ($results -join "`n")
}

function Get-Keywords([string]$text) {
  $tokens = $text -split '[\s、。・,]+'
  $seen = New-Object 'System.Collections.Generic.HashSet[string]'
  $result = New-Object 'System.Collections.Generic.List[string]'
  foreach ($t in $tokens) {
    $w = $t.Trim()
    if ($w.Length -lt 2 -or $w.Length -gt 30) { continue }
    if ($seen.Add($w)) { [void]$result.Add($w) }
    if ($result.Count -ge 80) { break }
  }
  return ($result -join ', ')
}

$indexLines = New-Object 'System.Collections.Generic.List[string]'

foreach ($item in $targets) {
  try {
    $html = Download-Html $item.url
    $titleMatch = [regex]::Match($html, '(?is)<title>(.*?)</title>')
    $title = if ($titleMatch.Success) { Normalize-Text $titleMatch.Groups[1].Value } else { $item.title }
    $text = Html-ToText $html
    $imageHints = Extract-ImageHints $html $item.url

    if ([string]::IsNullOrWhiteSpace($text)) { throw 'text extraction failed' }

    $excerptLen = [Math]::Min(700, $text.Length)
    $excerpt = $text.Substring(0, $excerptLen)
    if ($text.Length -gt $excerptLen) { $excerpt += '...' }

    $md = @"
---
source_url: $($item.url)
category: $($item.category)
retrieved_at: $(Get-Date -Format o)
---

# $title

## Summary

$excerpt

## Questions

- Explain $($item.category)
- Summarize this page
- What are the key points on this page?

## Answer Policy

When asked about $($item.category), answer from the extracted text below. Prioritize named programs, requirements, and numeric conditions.

## Extracted Text

$text

## Diagram Hints

$imageHints

## Keywords

$(Get-Keywords $text)
"@

    $file = Join-Path $outDir ($item.id + '.md')
    Set-Content -Path $file -Value $md -Encoding UTF8
    $indexLines.Add("- [$($item.category)]($($item.id).md) - $($item.url)") | Out-Null
    Write-Host "OK: $($item.id).md"
  }
  catch {
    $msg = $_.Exception.Message
    $indexLines.Add("- [ERROR] $($item.category) - $($item.url) - $msg") | Out-Null
    Write-Host "NG: $($item.url) -> $msg"
  }
}

$readme = @"
# recruit_ccs RAG Markdown Index

Crawled pages and converted into category-based markdown for Dify RAG.

## Upload

- Upload 01_*.md to 08_*.md to Dify Knowledge.
- Upload this README too for better category routing.

## Files

$($indexLines -join "`n")
"@
Set-Content -Path (Join-Path $outDir 'README.md') -Value $readme -Encoding UTF8
