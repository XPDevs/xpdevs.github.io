#!/usr/bin/env python3
"""KCNTV local server.

Serves the static site in this folder, provides a single-page-app fallback,
and proxies the live-stream edge servers through the same origin so the
player works without CORS or region restrictions.

Usage:
    python server.py [--port 8000]

Then open http://localhost:8000/
"""
import argparse
import http.server
import os
import socketserver
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
API_ORIGIN = "https://koryo.tv"

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE
try:
    _ctx.options |= getattr(ssl, "OP_LEGACY_SERVER_CONNECT", 0)
except Exception:
    pass


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    # ----- CORS ----------------------------------------------------------
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin",
                         self.headers.get("Origin", "*"))
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path.startswith("/proxy/"):
            self._proxy(self._edge_target(path))
        elif path.startswith("/api/"):
            self._proxy(API_ORIGIN + path)
        else:
            self._static(path)

    # ----- static files --------------------------------------------------
    def _static(self, path):
        rel = urllib.parse.unquote(path).lstrip("/") or "index.html"
        full = os.path.join(BASE_DIR, rel.replace("/", os.sep))
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        if not os.path.isfile(full):
            if os.path.splitext(rel)[1] == "":
                full = os.path.join(BASE_DIR, "index.html")
            else:
                self.send_error(404, "Not found")
                return
        with open(full, "rb") as fh:
            data = fh.read()
        ctype = self.guess_type(full)
        if ctype.startswith("text/") or ctype.endswith(("javascript", "json")):
            ctype += "; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)

    # ----- streaming proxy ----------------------------------------------
    @staticmethod
    def _edge_target(path):
        rest = path[len("/proxy/"):]
        host, _, tail = rest.partition("/")
        return "https://%s/%s" % (urllib.parse.unquote(host), tail)

    def _to_proxy(self, url):
        p = urllib.parse.urlparse(url)
        out = "http://localhost:%d/proxy/%s%s" % (
            self.server.server_address[1], p.netloc, p.path)
        if p.query:
            out += "?" + p.query
        return out

    def _rewrite_playlist(self, text, target):
        def to_proxy(uri):
            return self._to_proxy(urllib.parse.urljoin(target, uri))

        out = []
        for line in text.splitlines():
            s = line.strip()
            if not s:
                out.append(line)
            elif s.startswith("#"):
                out.append(_URI_RE.sub(lambda m: 'URI="%s"' % to_proxy(m.group(1)), line))
            else:
                out.append(to_proxy(s))
        return ("\n".join(out) + "\n").encode("utf-8")

    def _proxy(self, target):
        req = urllib.request.Request(target, method="GET")
        req.add_header("User-Agent", self.headers.get(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"))
        req.add_header("Accept", self.headers.get("Accept", "*/*"))
        req.add_header("Origin", API_ORIGIN)
        req.add_header("Referer", API_ORIGIN + "/")
        lang = self.headers.get("Accept-Language")
        if lang:
            req.add_header("Accept-Language", lang)
        if self.headers.get("Cookie"):
            req.add_header("Cookie", self.headers["Cookie"])
        if self.headers.get("Range"):
            req.add_header("Range", self.headers["Range"])
        try:
            with urllib.request.urlopen(req, context=_ctx, timeout=30) as resp:
                data = resp.read()
                ctype = resp.headers.get("Content-Type", "application/octet-stream")
                status = resp.status
                cookies = resp.headers.get_all("Set-Cookie") or []
        except urllib.error.HTTPError as e:
            self._send(e.code, e.headers.get("Content-Type", "text/plain"),
                       e.read(), e.headers.get_all("Set-Cookie") or [])
            return
        except Exception as e:  # noqa: BLE001
            self._send(502, "text/plain; charset=utf-8",
                       ("upstream error: %s" % e).encode())
            return

        if target.split("?", 1)[0].endswith(".m3u8") or "mpegurl" in ctype.lower():
            data = self._rewrite_playlist(data.decode("utf-8", "replace"), target)
            ctype = "application/vnd.apple.mpegurl"
        self._send(status, ctype, data, cookies)

    @staticmethod
    def _local_cookie(raw):
        parts = []
        for i, part in enumerate(raw.split(";")):
            p = part.strip()
            low = p.lower()
            if i > 0 and (low.startswith("domain=") or low == "secure"):
                continue
            parts.append(p)
        return "; ".join(parts)

    def _send(self, status, ctype, body, cookies=None):
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        for c in (cookies or []):
            self.send_header("Set-Cookie", self._local_cookie(c))
        self.end_headers()
        self.wfile.write(body)


_URI_RE = __import__("re").compile(r'URI="([^"]+)"')


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    ap = argparse.ArgumentParser(description="Serve KCNTV locally + stream proxy.")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--host", default="0.0.0.0")
    args = ap.parse_args()
    httpd = Server((args.host, args.port), Handler)
    print("KCNTV serving %s" % BASE_DIR)
    print("Open http://localhost:%d/" % args.port)
    print("Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
