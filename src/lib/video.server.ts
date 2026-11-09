// Edição de vídeo no PC via bridge: baixa o anexo (ou usa caminho local),
// roda ffmpeg e envia o resultado para /api/upload (que guarda no videoStore).

export type VideoEditResult =
  | { ok: true; url: string; pcPath?: string }
  | { ok: false; error: string };

export function publicOrigin(): string {
  const v =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "jarvis-azul.vercel.app";
  return `https://${v.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`;
}

export async function editarVideoNoPc(input: { video: string; comando: string }): Promise<VideoEditResult> {
  const clean = (s: string) => (s || "").trim().replace(/[`"'<>|]/g, "");
  const video = clean(input.video);
  const comando = clean(input.comando);
  if (!video) return { ok: false, error: "Informe o video (URL do anexo ou caminho no PC)." };
  if (!comando) return { ok: false, error: "Informe as opcoes ffmpeg depois de -i (ex: -ss 00:00:05 -t 10 -c copy)." };

  const bridgeUrl = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
  const bridgeToken = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN || "";
  if (!bridgeUrl || !bridgeToken) return { ok: false, error: "Bridge nao configurada no servidor (BRIDGE_URL/BRIDGE_TOKEN)." };

  const isPath = /^[A-Za-z]:[\\/]/.test(video) || video.startsWith("~") || video.startsWith("%");
  const isUrl = /^https?:\/\//i.test(video);
  let videoPublica = video;
  if (!isPath && !isUrl) {
    if (!video.startsWith("/api/video/")) return { ok: false, error: `Formato de video invalido: ${video}` };
    videoPublica = `${publicOrigin()}${video}`;
  }

  const id = Math.random().toString(36).slice(2, 10);
  const origin = publicOrigin();
  // Se um corte com -c copy cair num trecho sem keyframe (arquivo sem
  // streams), o script refaz com re-encodificação nos mesmos tempos.
  const altReencode = comando.replace(/-c\s+copy/i, "-c:v libx264 -preset veryfast -crf 26 -c:a aac");


  const ps = [
    "$ErrorActionPreference='Stop'",
    '$dir="$env:TEMP\\jarvis_video"; New-Item -ItemType Directory -Force -Path $dir | Out-Null',
    isPath ? `$in="${video}"` : `$in=Join-Path $dir "in_${id}.mp4"`,
    isPath ? "" : `Invoke-WebRequest -UseBasicParsing -Uri "${videoPublica}" -OutFile $in`,
    `$out=Join-Path $dir "out_${id}.mp4"`,
    "$ErrorActionPreference='Continue'",
    `$ff = & ffmpeg -y -i $in ${comando} $out 2>&1 | Out-String`,
    "$ErrorActionPreference='Stop'",
    'if ($LASTEXITCODE -ne 0) { $tail = $ff; if ($tail.Length -gt 400) { $tail = $tail.Substring($tail.Length - 400) }; Write-Output ("FFERROR=" + $tail.Replace("`n", " ")); exit 1 }',
    'if (-not ($pp -like "*video*")) { $args2 = ("' + altReencode + '" -split "\\s+"); $ff2 = (& ffmpeg -y -i $in $args2 $out 2>&1 | Out-String); if ($LASTEXITCODE -ne 0) { $t=$ff2; if ($t.Length -gt 400) { $t = $t.Substring($t.Length - 400) }; Write-Output ("FFERROR=" + $t.Replace("`n", " ")); exit 1 } }',
    `Invoke-RestMethod -Uri "${origin}/api/upload" -Method Post -InFile $out -ContentType "video/mp4" | ForEach-Object { "URL=" + $_.url }`,
    `$pc=Join-Path $env:USERPROFILE ("Downloads\\jarvis_editado_${id}.mp4"); Copy-Item $out $pc; "PC=" + $pc`,
  ]
    .filter(Boolean)
    .join("\n");

  const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    const res = await fetch(`${bridgeUrl}/shell`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bridgeToken}` },
      body: JSON.stringify({ cmd: ps, timeout: 290 }),
      signal: AbortSignal.timeout(295_000),
    });
    if (!res.ok) return { ok: false, error: `Bridge HTTP ${res.status}.` };
    const j = (await res.json()) as { exit?: number; stdout?: string; stderr?: string; error?: string };
    if (j.error) return { ok: false, error: j.error };
    const out = j.stdout || "";
    const url = out.match(/URL=(\S+)/)?.[1];
    const pcPath = out.match(/PC=([^\r\n]+)/)?.[1]?.trim();
    if (url) return { ok: true, url, pcPath };
    const ffErr = out.match(/FFERROR=([\s\S]*)/)?.[1]?.trim();
    const falha = ffErr || (j.stderr || "").slice(-300) || "ffmpeg falhou sem mensagem.";
    return { ok: false, error: falha };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 300) : "Falha na bridge." };
  } finally {
    if (prevTls === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
  }
}
