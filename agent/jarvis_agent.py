#!/usr/bin/env python3
"""
J.A.R.V.I.S. local bridge agent.

Runs a small HTTP server on your machine that the Jarvis web app talks to
so it can execute real shell commands and read/write files as YOU.

Security model:
  - Binds to 127.0.0.1 only (never exposed to the network).
  - Every request must send `Authorization: Bearer <TOKEN>`.
  - Token is auto-generated on first run and printed to your terminal.
  - CORS + Private-Network-Access headers allow the Jarvis web UI (any
    https origin) to call in from your browser.

Usage:
    python3 jarvis_agent.py              # default port 7843
  JARVIS_PORT=9000 python3 jarvis_agent.py
  JARVIS_TOKEN=meutoken python3 jarvis_agent.py

Endpoints:
  GET  /health                         -> {"ok": true, "cwd": "..."}
  POST /shell    {"cmd": "...", "cwd": "?", "timeout": 30}
  POST /python3  {"code": "...", "cwd": "?", "args": [], "timeout": 30}
  POST /read     {"path": "..."}
  POST /write    {"path": "...", "content": "...", "append": false}
  POST /list     {"path": "."}
  POST /mouse    {"action": "move|click|scroll|drag", ...}
"""
from __future__ import annotations

import json
import os
import secrets
import shutil
import socket
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = os.environ.get("JARVIS_HOST", "127.0.0.1")
PORT = int(os.environ.get("JARVIS_PORT", "7843"))
TOKEN = os.environ.get("JARVIS_TOKEN") or secrets.token_urlsafe(24)
BASE_CWD = Path(os.environ.get("JARVIS_CWD", os.getcwd())).expanduser().resolve()
TUNNEL = os.environ.get("JARVIS_TUNNEL", "").lower() in ("1", "true", "yes") or "--tunnel" in sys.argv
MAX_READ = 512 * 1024  # 512 KB
MAX_IMAGE = 8 * 1024 * 1024


def _local_ips() -> list[str]:
    """Best-effort list of non-loopback IPv4 addresses for mobile bridge access."""
    ips: list[str] = []
    try:
        out = subprocess.check_output(["hostname", "-I"], text=True, stderr=subprocess.DEVNULL)
        ips = [ip for ip in out.split() if ip and not ip.startswith("127.")]
    except Exception:
        ips = []
    if not ips:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            if ip and not ip.startswith("127."):
                ips = [ip]
        except Exception:
            pass
    return ips


def _start_tunnel(port: int) -> str | None:
    """Start a cloudflared quick tunnel so phones on HTTPS pages can reach us.

    Returns the public https URL, or None if cloudflared isn't installed.
    """
    import re
    import threading

    exe = shutil.which("cloudflared")
    if not exe:
        print("  Tunnel    : cloudflared não encontrado.")
        print("              Instale: brew install cloudflared  |  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")
        return None

    proc = subprocess.Popen(
        [exe, "tunnel", "--url", f"http://127.0.0.1:{port}", "--no-autoupdate"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    url_holder: list[str] = []
    pattern = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")

    def pump() -> None:
        assert proc.stdout is not None
        for line in proc.stdout:
            m = pattern.search(line)
            if m and not url_holder:
                url_holder.append(m.group(0))

    threading.Thread(target=pump, daemon=True).start()
    for _ in range(300):  # up to ~30s
        if url_holder:
            return url_holder[0]
        if proc.poll() is not None:
            break
        time.sleep(0.1)
    print("  Tunnel    : falhou ao obter URL do cloudflared.")
    return None




def _cors(handler: BaseHTTPRequestHandler) -> None:
    origin = handler.headers.get("Origin", "*")
    handler.send_header("Access-Control-Allow-Origin", origin)
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header(
        "Access-Control-Allow-Headers", "Content-Type, Authorization"
    )
    handler.send_header("Access-Control-Allow-Private-Network", "true")
    handler.send_header("Access-Control-Max-Age", "86400")
    handler.send_header("Vary", "Origin")


def _json(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    _cors(handler)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _resolve(path_str: str) -> Path:
    p = Path(path_str).expanduser()
    if not p.is_absolute():
        p = BASE_CWD / p
    return p.resolve()


def _resolve_read_only(path_str: str) -> Path:
    return _resolve(path_str)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        sys.stderr.write("[jarvis-agent] " + (fmt % args) + "\n")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        _cors(self)
        self.end_headers()

    def _auth_ok(self) -> bool:
        header = self.headers.get("Authorization", "")
        return header == f"Bearer {TOKEN}"

    def _read_body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            if not self._auth_ok():
                return _json(self, 401, {"error": "unauthorized"})
            return _json(
                self,
                200,
                {"ok": True, "cwd": str(BASE_CWD), "platform": sys.platform},
            )
        if self.path.startswith("/shot/"):
            return self._shot()
        _json(self, 404, {"error": "not found"})

    def _shot(self) -> None:
        # Serve público (sem token) estilo Hermes: arquivo local com ID
        # imprevisível, expira em 10 min. Para Telegram/web buscarem a imagem.
        import os
        import re
        import time

        m = re.match(r"^/shot/([A-Za-z0-9]{16})$", self.path)
        if not m:
            return _json(self, 404, {"error": "not found"})
        try:
            import tempfile

            fp = os.path.join(tempfile.gettempdir(), "jarvis_shots", m.group(1) + ".jpg")
            if not os.path.isfile(fp):
                return _json(self, 404, {"error": "not found"})
            if time.time() - os.path.getmtime(fp) > 600:
                try:
                    os.remove(fp)
                except Exception:
                    pass
                return _json(self, 404, {"error": "expired"})
            with open(fp, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "image/jpeg")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "public, max-age=300")
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:  # noqa: BLE001
            return _json(self, 500, {"error": str(exc)})

    def do_POST(self) -> None:  # noqa: N802
        if not self._auth_ok():
            return _json(self, 401, {"error": "unauthorized"})

        body = self._read_body()
        try:
            if self.path == "/shell":
                return self._shell(body)
            if self.path == "/python3":
                return self._python3(body)
            if self.path == "/read":
                return self._read(body)
            if self.path == "/image":
                return self._image(body)
            if self.path == "/write":
                return self._write(body)
            if self.path == "/list":
                return self._list(body)
            if self.path == "/open":
                return self._open(body)
            if self.path == "/speak":
                return self._speak(body)
            if self.path == "/type":
                return self._type(body)
            if self.path == "/mouse":
                return self._mouse(body)
            if self.path == "/screenshot":
                return self._screenshot(body)
            if self.path == "/proxy":
                return self._proxy(body)
        except Exception as exc:  # noqa: BLE001
            return _json(self, 500, {"error": str(exc)})
        _json(self, 404, {"error": "not found"})

    def _proxy(self, body: dict) -> None:
        """Proxy HTTP para serviços locais (n8n, MCP, etc).

        Só permite hosts locais/privados/TS.net (anti-SSRF).
        """
        from urllib.parse import urlparse
        import urllib.error
        import urllib.request

        url = body.get("url") or ""
        if not isinstance(url, str) or not url.startswith(("http://", "https://")):
            return _json(self, 400, {"error": "url required"})
        host = (urlparse(url).hostname or "").lower()

        def _private(h: str) -> bool:
            if h in ("127.0.0.1", "localhost", "::1", "0.0.0.0"):
                return True
            if h.endswith(".ts.net") or h.endswith(".local"):
                return True
            parts = h.split(".")
            if len(parts) == 4 and all(p.isdigit() for p in parts):
                a, b = int(parts[0]), int(parts[1])
                if a == 10 or a == 127 or (a == 192 and b == 168) or (a == 172 and 16 <= b <= 31) or (a == 100 and 64 <= b <= 127):
                    return True
            return False

        if not _private(host):
            return _json(self, 403, {"error": f"host não permitido: {host}"})

        method = str(body.get("method") or "POST").upper()
        headers = body.get("headers") or {}
        if not isinstance(headers, dict):
            headers = {}
        data = body.get("body")
        payload = None
        if isinstance(data, str) and data:
            payload = data.encode("utf-8")
        elif data is not None:
            payload = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={str(k): str(v) for k, v in headers.items()}, method=method)
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                raw = r.read(2_000_000)
                keep = ("content-type", "mcp-session-id", "location")
                hdrs = {k: v for k, v in r.headers.items() if k.lower() in keep}
                return _json(self, 200, {
                    "status": getattr(r, "status", 200),
                    "contentType": r.headers.get("Content-Type", "application/json"),
                    "headers": hdrs,
                    "body": raw.decode("utf-8", errors="replace"),
                })
        except urllib.error.HTTPError as e:
            raw = e.read()[:200_000] if hasattr(e, "read") else b""
            keep = ("content-type", "mcp-session-id", "location")
            hdrs = {k: v for k, v in (e.headers.items() if e.headers else []) if k.lower() in keep}
            return _json(self, 200, {
                "status": e.code,
                "contentType": e.headers.get("Content-Type", "text/plain") if e.headers else "text/plain",
                "headers": hdrs,
                "body": raw.decode("utf-8", errors="replace"),
            })
        except Exception as exc:  # noqa: BLE001
            return _json(self, 502, {"error": str(exc)})

    def _shell(self, body: dict) -> None:
        cmd = body.get("cmd")
        if not cmd or not isinstance(cmd, str):
            return _json(self, 400, {"error": "cmd required"})
        # Windows usa `python`/`pip` (nao `python3`/`pip3`). Normaliza para
        # o modelo poder escrever qualquer um dos dois.
        if os.name == "nt":
            import re
            cmd = re.sub(r"(?<![\w.])python3(?![\w.])", "python", cmd, flags=re.IGNORECASE)
            cmd = re.sub(r"(?<![\w.])pip3(?![\w.])", "pip", cmd, flags=re.IGNORECASE)
        try:
            cwd = str(_resolve(body.get("cwd") or "."))
        except ValueError as exc:
            return _json(self, 400, {"error": str(exc)})
        timeout = min(int(body.get("timeout") or 30), 300)
        try:
            if os.name == "nt":
                proc = subprocess.run(
                    ["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", cmd],
                    cwd=cwd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                )
            else:
                proc = subprocess.run(
                    cmd,
                    shell=True,
                    cwd=cwd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                )
            return _json(
                self,
                200,
                {
                    "exit": proc.returncode,
                    "stdout": proc.stdout[-64_000:],
                    "stderr": proc.stderr[-16_000:],
                    "cwd": cwd,
                },
            )
        except subprocess.TimeoutExpired as exc:
            return _json(
                self,
                200,
                {
                    "exit": -1,
                    "stdout": (exc.stdout or "")[-64_000:] if isinstance(exc.stdout, str) else "",
                    "stderr": f"timeout after {timeout}s",
                    "cwd": cwd,
                },
            )

    def _python3(self, body: dict) -> None:
        code = body.get("code")
        if not code or not isinstance(code, str):
            return _json(self, 400, {"error": "code required"})
        cwd = body.get("cwd") or str(BASE_CWD)
        timeout = min(int(body.get("timeout") or 30), 300)
        # Find python3 or python binary
        exe = shutil.which("python3") or shutil.which("python")
        if not exe:
            return _json(self, 500, {"error": "python3 not found on this machine"})
        args = body.get("args") or []
        if not isinstance(args, list) or not all(isinstance(a, str) for a in args):
            return _json(self, 400, {"error": "args must be a list of strings"})
        argv = ["-c", code] + args
        try:
            proc = subprocess.run(
                [exe, *argv],
                shell=False,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
            return _json(
                self,
                200,
                {
                    "exit": proc.returncode,
                    "stdout": proc.stdout[-64_000:],
                    "stderr": proc.stderr[-16_000:],
                    "cwd": cwd,
                    "executable": exe,
                },
            )
        except subprocess.TimeoutExpired as exc:
            return _json(
                self,
                200,
                {
                    "exit": -1,
                    "stdout": (exc.stdout or "")[-64_000:] if isinstance(exc.stdout, str) else "",
                    "stderr": f"timeout after {timeout}s",
                    "cwd": cwd,
                    "executable": exe,
                },
            )

    def _read(self, body: dict) -> None:
        path = body.get("path")
        if not path:
            return _json(self, 400, {"error": "path required"})
        p = _resolve(path)
        if not p.exists():
            return _json(self, 404, {"error": f"not found: {p}"})
        if p.is_dir():
            return _json(self, 400, {"error": "path is a directory; use /list"})
        try:
            data = p.read_bytes()
            truncated = len(data) > MAX_READ
            text = data[:MAX_READ].decode("utf-8", errors="replace")
            return _json(
                self,
                200,
                {"path": str(p), "content": text, "bytes": len(data), "truncated": truncated},
            )
        except Exception as exc:  # noqa: BLE001
            return _json(self, 500, {"error": str(exc)})

    def _image(self, body: dict) -> None:
        path = body.get("path")
        if not path:
            return _json(self, 400, {"error": "path required"})
        p = _resolve(path)
        if not p.exists() or not p.is_file():
            return _json(self, 404, {"error": f"image not found: {p}"})
        if p.stat().st_size > MAX_IMAGE:
            return _json(self, 413, {"error": "image exceeds 8 MB limit"})
        mime = {
            ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
            ".webp": "image/webp", ".gif": "image/gif", ".bmp": "image/bmp",
        }.get(p.suffix.lower())
        if not mime:
            return _json(self, 415, {"error": "unsupported image type"})
        import base64
        return _json(self, 200, {
            "path": str(p),
            "mediaType": mime,
            "data": base64.b64encode(p.read_bytes()).decode("ascii"),
        })

    def _write(self, body: dict) -> None:
        path = body.get("path")
        content = body.get("content", "")
        append = bool(body.get("append"))
        if not path:
            return _json(self, 400, {"error": "path required"})
        p = _resolve(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        mode = "a" if append else "w"
        with p.open(mode, encoding="utf-8") as fh:
            fh.write(content)
        return _json(self, 200, {"path": str(p), "bytes": len(content), "appended": append})

    def _list(self, body: dict) -> None:
        path = body.get("path") or "."
        p = _resolve(path)
        if not p.exists():
            return _json(self, 404, {"error": f"not found: {p}"})
        if not p.is_dir():
            return _json(self, 400, {"error": "path is not a directory"})
        entries = []
        for child in sorted(p.iterdir()):
            try:
                st = child.stat()
                entries.append(
                    {
                        "name": child.name,
                        "type": "dir" if child.is_dir() else "file",
                        "size": st.st_size,
                    }
                )
            except Exception:
                continue
        return _json(self, 200, {"path": str(p), "entries": entries})

    def _open(self, body: dict) -> None:
        target = body.get("target")
        args = body.get("args") or []
        if not target or not isinstance(target, str):
            return _json(self, 400, {"error": "target required"})
        if not isinstance(args, list):
            return _json(self, 400, {"error": "args must be a list"})
        target = target.strip()
        if not target:
            return _json(self, 400, {"error": "target required"})
        try:
            lowered = target.lower()
            if lowered.startswith(("http://", "https://")) or os.path.exists(target):
                if os.name == "nt":
                    os.startfile(target)  # noqa: S606
                else:
                    subprocess.Popen(["xdg-open", target])
                return _json(self, 200, {"ok": True, "method": "default", "target": target})
            if os.name == "nt":
                cmd = ["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
                       "-Command", "Start-Process", "-FilePath", target]
                if args:
                    cmd += ["-ArgumentList"] + [str(a) for a in args]
                subprocess.Popen(cmd)
                return _json(self, 200, {"ok": True, "method": "start-process", "target": target})
            subprocess.Popen([target] + [str(a) for a in args])
            return _json(self, 200, {"ok": True, "method": "exec", "target": target})
        except Exception as exc:  # noqa: BLE001
            return _json(self, 500, {"error": str(exc)})

    def _mouse(self, body: dict) -> None:
        """Perform a bounded mouse action using normalized 0..1000 coordinates."""
        if os.name != "nt":
            return _json(self, 501, {"error": "mouse control only supported on Windows"})

        import ctypes
        from ctypes import wintypes

        user32 = ctypes.windll.user32
        width, height = user32.GetSystemMetrics(0), user32.GetSystemMetrics(1)

        def point(x_value: object, y_value: object) -> tuple[int, int]:
            try:
                nx, ny = int(x_value), int(y_value)
            except (TypeError, ValueError):
                raise ValueError("x and y must be integer normalized coordinates")
            if not (0 <= nx <= 1000 and 0 <= ny <= 1000):
                raise ValueError("x and y must be between 0 and 1000")
            return round(nx * (width - 1) / 1000), round(ny * (height - 1) / 1000)

        def move_cursor(x: int, y: int) -> None:
            current = wintypes.POINT()
            if not user32.GetCursorPos(ctypes.byref(current)):
                raise ctypes.WinError()
            start_x, start_y = current.x, current.y
            distance = max(abs(x - start_x), abs(y - start_y))
            steps = max(8, min(30, distance // 20))
            for step in range(1, steps + 1):
                next_x = start_x + (x - start_x) * step // steps
                next_y = start_y + (y - start_y) * step // steps
                if not user32.SetCursorPos(next_x, next_y):
                    raise ctypes.WinError()
                time.sleep(0.015)

        action = str(body.get("action") or "").lower()
        try:
            if action == "move":
                x, y = point(body.get("x"), body.get("y"))
                move_cursor(x, y)
                return _json(self, 200, {"ok": True, "action": action, "x": x, "y": y})

            if action == "click":
                x, y = point(body.get("x"), body.get("y"))
                button = str(body.get("button") or "left").lower()
                flags = {"left": (0x0002, 0x0004), "right": (0x0008, 0x0010), "middle": (0x0020, 0x0040)}
                if button not in flags:
                    return _json(self, 400, {"error": "button must be left, right, or middle"})
                clicks = int(body.get("clicks") or 1)
                if not 1 <= clicks <= 2:
                    return _json(self, 400, {"error": "clicks must be 1 or 2"})
                move_cursor(x, y)
                time.sleep(0.3)
                down, up = flags[button]
                for index in range(clicks):
                    user32.mouse_event(down, 0, 0, 0, 0)
                    user32.mouse_event(up, 0, 0, 0, 0)
                    if index + 1 < clicks:
                        time.sleep(0.08)
                return _json(self, 200, {"ok": True, "action": action, "button": button, "clicks": clicks, "x": x, "y": y})

            if action == "scroll":
                delta = int(body.get("delta") or 0)
                if not -1200 <= delta <= 1200 or delta == 0:
                    return _json(self, 400, {"error": "delta must be between -1200 and 1200 and non-zero"})
                if body.get("x") is not None or body.get("y") is not None:
                    x, y = point(body.get("x"), body.get("y"))
                    move_cursor(x, y)
                user32.mouse_event(0x0800, 0, 0, delta, 0)
                return _json(self, 200, {"ok": True, "action": action, "delta": delta})

            if action == "drag":
                x1, y1 = point(body.get("x"), body.get("y"))
                x2, y2 = point(body.get("toX"), body.get("toY"))
                move_cursor(x1, y1)
                time.sleep(0.3)
                user32.mouse_event(0x0002, 0, 0, 0, 0)
                try:
                    for step in range(1, 13):
                        x = x1 + (x2 - x1) * step // 12
                        y = y1 + (y2 - y1) * step // 12
                        user32.SetCursorPos(x, y)
                        time.sleep(0.01)
                finally:
                    user32.mouse_event(0x0004, 0, 0, 0, 0)
                return _json(self, 200, {"ok": True, "action": action, "from": [x1, y1], "to": [x2, y2]})

            return _json(self, 400, {"error": "action must be move, click, scroll, or drag"})
        except (ValueError, TypeError) as exc:
            return _json(self, 400, {"error": str(exc)})
        except Exception as exc:  # noqa: BLE001
            return _json(self, 500, {"error": str(exc)})

    def _speak(self, body: dict) -> None:
        text = (body.get("text") or "").strip()
        if not text:
            return _json(self, 400, {"error": "text required"})
        text = text[:800]
        try:
            import asyncio
            import edge_tts

            async def _gen() -> bytes:
                chunks: list[bytes] = []
                async for chunk in edge_tts.Communicate(text, voice="pt-BR-AntonioNeural").stream():
                    if chunk.get("type") == "audio":
                        data = chunk.get("data")
                        if isinstance(data, (bytes, bytearray)):
                            chunks.append(bytes(data))
                return b"".join(chunks)

            audio = asyncio.run(_gen())
            if not audio:
                return _json(self, 500, {"error": "empty audio"})
            self.send_response(200)
            _cors(self)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(audio)))
            self.end_headers()
            self.wfile.write(audio)
        except Exception as exc:  # noqa: BLE001
            return _json(self, 500, {"error": str(exc)})

    def _type(self, body: dict) -> None:
        text = body.get("text", "")
        window = (body.get("window") or "").strip()
        if not isinstance(text, str) or not text.strip():
            return _json(self, 400, {"error": "text required"})
        if os.name != "nt":
            return _json(self, 501, {"error": "typing only supported on Windows"})
        try:
            import subprocess as sp
            import tempfile

            esc = []
            for ch in text[:2000]:
                if ch in "+^%~(){}[]":
                    esc.append("{" + ch + "}")
                elif ch == "\n":
                    esc.append("{ENTER}")
                elif ch == "\t":
                    esc.append("{TAB}")
                else:
                    esc.append(ch)
            tmp = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8")
            try:
                tmp.write("".join(esc))
                tmp_path = tmp.name
            finally:
                tmp.close()
            ps = (
                "$ws = New-Object -ComObject WScript.Shell; "
                f"$t = Get-Content -Raw -LiteralPath '{tmp_path}'; "
            )
            if window:
                safe_w = window.replace("'", "''")
                # AppActivate casa apenas prefixo do título ("Bloco" não casa
                # "Sem título - Bloco de Notas") — por isso: prefixo → substring
                # no MainWindowTitle (via PID) → nome do processo.
                ps += (
                    f"$a = $ws.AppActivate('{safe_w}'); "
                    "if (-not $a) { $p = Get-Process | Where-Object { $_.MainWindowTitle -and ($_.MainWindowTitle -like '*"
                    + safe_w
                    + "*') } | Select-Object -First 1; if ($p) { $a = $ws.AppActivate($p.Id) } }; "
                    "if (-not $a) { try { $p2 = Get-Process -Name '"
                    + safe_w
                    + "' -ErrorAction Stop | Where-Object { $_.MainWindowTitle } | Select-Object -First 1; "
                    "if ($p2) { $a = $ws.AppActivate($p2.Id) } } catch {} }; "
                    "if (-not $a) { Write-Output 'NO_WINDOW'; exit 2 }; "
                    "Start-Sleep -Milliseconds 400; "
                )
            ps += "$ws.SendKeys($t); Write-Output 'OK'"
            proc = sp.run(
                ["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps],
                capture_output=True, text=True, timeout=30,
            )
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
            out = (proc.stdout or "").strip()
            if proc.returncode == 2 or out == "NO_WINDOW":
                return _json(self, 404, {"error": f"window not found: {window}"})
            if proc.returncode != 0:
                return _json(self, 500, {"error": (proc.stderr or "")[-500:] or f"exit {proc.returncode}"})
            return _json(self, 200, {"ok": True, "typed": len(text[:2000]), "window": window or "foreground"})
        except Exception as exc:  # noqa: BLE001
            return _json(self, 500, {"error": str(exc)})

    def _screenshot(self, body: dict) -> None:
        try:
            from PIL import ImageGrab
            import base64
            import io

            img = ImageGrab.grab()
            w, h = img.size
            max_w = 960
            if w > max_w:
                img = img.resize((max_w, int(h * max_w / w)))
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=70)
            raw = buf.getvalue()
            data = base64.b64encode(raw).decode("ascii")
            # Salva arquivo local estilo Hermes (Telegram/web buscam via /shot/).
            file_id = ""
            try:
                import os
                import secrets
                import tempfile
                import time

                shot_dir = os.path.join(tempfile.gettempdir(), "jarvis_shots")
                os.makedirs(shot_dir, exist_ok=True)
                now = time.time()
                for fn in os.listdir(shot_dir):
                    fp = os.path.join(shot_dir, fn)
                    try:
                        if now - os.path.getmtime(fp) > 600:
                            os.remove(fp)
                    except Exception:
                        pass
                file_id = secrets.token_hex(8)
                with open(os.path.join(shot_dir, file_id + ".jpg"), "wb") as f:
                    f.write(raw)
            except Exception:
                file_id = ""
            return _json(self, 200, {
                "ok": True, "mediaType": "image/jpeg", "data": data,
                "width": img.size[0], "height": img.size[1],
                "fileId": file_id,
            })
        except Exception as exc:  # noqa: BLE001
            return _json(self, 500, {"error": str(exc)})


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("=" * 60)
    print("  J.A.R.V.I.S. local bridge — online")
    print("=" * 60)
    print(f"  URL       : http://{HOST}:{PORT}")
    print(f"  Token     : {TOKEN}")
    print(f"  Base cwd  : {BASE_CWD}")
    print(f"  Bind host : {HOST}")
    if HOST in ("0.0.0.0", ""):
        ips = _local_ips()
        if ips:
            print("  Local IPs :", ", ".join(f"http://{ip}:{PORT}" for ip in ips))
        print("  WARNING   : exposed to your local network — keep token secret.")
    else:
        print("  Scope     : localhost only (use JARVIS_HOST=0.0.0.0 for mobile)")
    if TUNNEL:
        public = _start_tunnel(PORT)
        if public:
            print("-" * 60)
            print(f"  HTTPS URL : {public}")
            print("              ^ use esta URL no celular (funciona em páginas HTTPS)")
    print("=" * 60)
    print("  Paste the URL and token into the Jarvis web UI (Bridge panel).")
    print("  Ctrl+C to stop.")
    print()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[jarvis-agent] shutting down")
        server.shutdown()


if __name__ == "__main__":
    main()
