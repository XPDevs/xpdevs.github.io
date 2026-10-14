# KCNTV

A self-contained, offline copy of the KCNTV web app (Korean Central Television +
North Korean state radio), rebuilt as a single-page site with English-only UI.

Everything needed to run it lives in this folder:

```
kcntv/
├─ index.html         the whole site shell (one HTML file)
├─ js/main.js         the whole app (all JS bundled into one file)
├─ css/main.css       the whole stylesheet (all CSS concatenated into one file)
├─ assets/*.png       channel logos used by the player/cards
├─ fonts/*.woff2      Korean display fonts (local, no CDN)
├─ favicon.png / apple-touch-icon.png / site.webmanifest
├─ player_cover.webp  player poster image
└─ server.py          local static server + streaming proxy
```

## Run it

```bash
python server.py            # serves on http://localhost:8000
# or
python server.py --port 8000
```

Then open <http://localhost:8000/>.

Use `server.py` (not `python -m http.server`): it also provides the SPA fallback
and the stream proxy described below.

## The streaming proxy

The live streams are served by three remote "edge" hosts:

| Edge | Host |
|------|------|
| Belarus (MSK) | `edge-msk.koryo.tv` |
| Kosovo (PRS)  | `edge-prs.koryo.tv` |
| Thailand (BKK)| `edge-bkk.koryo.tv` |

The player normally talks to them directly, which needs a matching origin and a
reachable region. To make playback work from a local machine, `server.py` exposes
a same-origin proxy and the app's edge base URLs have been pointed at it:

```
https://edge-msk.koryo.tv  ->  http://localhost:8000/proxy/edge-msk.koryo.tv
https://edge-prs.koryo.tv  ->  http://localhost:8000/proxy/edge-prs.koryo.tv
https://edge-bkk.koryo.tv  ->  http://localhost:8000/proxy/edge-bkk.koryo.tv
```

`server.py`:

- serves the static files in this folder, with `/anything` falling back to
  `index.html` so client-side routes (`/channels`, `/radio`, `/schedule`, …) work;
- proxies `/proxy/<host>/<path>` to `https://<host>/<path>` (permissive TLS for
  the DPRK certificates);
- rewrites `.m3u8` playlists so every segment / key URI also goes through the
  proxy (otherwise `hls.js` would hit the edge hosts directly and fail on CORS);
- proxies `/api/*` to `https://koryo.tv/api/*`;
- adds permissive CORS headers and answers `OPTIONS` preflight.

The player requests a session with `GET /session/anon?quality=…`, then a playlist
such as `/kctv/live/<uuid>.m3u8`, `/ryongnamsan/live/<uuid>.m3u8`, or
`/radio/vok/b/<uuid>.m3u8`; all of these flow through the same proxy.

## What was changed

- Single file shell: `index.html`; single JS file: `js/main.js`; single CSS file:
  `css/main.css`. All other script/style files were removed.
- English only: the language switcher was removed, `kcntv.lang` is forced to `en`,
  and the alternate-language pages were deleted.
- Rebranded from the old `koryo.tv`/`KORYO.TV` name to `KCNTV` throughout the UI,
  metadata and stored keys (the real stream hostnames are intentionally untouched).
- The "About", accounts, donate and store pages are gone; the footer copyright
  line was removed.
- The app no longer calls `GET /api/member/session`.
- Dark theme and component styling follow the XPDevs design system; the mobile
  layout (≤768px) was improved (top bar, cards, drawer, tap targets).

## Notes

- No build step is required to run the site; everything is prebuilt.
- The proxy only works while `server.py` is running and while the edge hosts are
  reachable from your machine/region.
