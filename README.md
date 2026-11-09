# pxxl-xray-node

Personal low-traffic VLESS + WS + TLS node on the Pxxl free tier (pxxl.app, no card).
Deployment code written by Hana for Lynn — not copied from any third-party skill repo.

## How it works

- Pxxl edge terminates TLS on `*.pxxlspace.cv:443` and forwards plain WebSocket to the container's `$PORT`.
- `setup.js` (build step) downloads the official Xray release (`XTLS/Xray-core`, v26.11.9) and unpacks it as `web-worker`.
- `server.js` starts Xray with a VLESS inbound on `0.0.0.0:$PORT`, WS path from `WSPATH`, client id from `UUID`.

## Deploy (free tier)

1. Push this folder to a GitHub repo.
2. Log in to `app.pxxl.app` with GitHub, install the Pxxl GitHub App scoped to that repo.
3. Create a project from the repo. Language must be detected as **Node** (`package.json` present). Do **not** choose Docker on Free.
4. Set env vars (never commit real values):
   - `UUID` — fresh UUIDv4
   - `WSPATH` — e.g. `/2a6e4281f4a6340f` (must start with `/`)
5. Wait until status is **Deployed**. Note the host `<name>.pxxlspace.cv`.

## Client

```
vless://<UUID>@<HOST>:443?encryption=none&security=tls&type=ws&host=<HOST>&path=<urlencoded WSPATH>&sni=<HOST>#Pxxl
```

## Notes

- Free tier: 5 projects, 0.5 GB RAM, 50 GiB outbound/month. Idle apps sleep and wake on request — spare node, not a 24/7 main line.
- Exit is the platform's datacenter IP pool (EU observed), not residential. Only for Lynn's own use; do not publish as an open relay.
- Pxxl terms have no explicit proxy ban (unlike Railway), but also no explicit allowance — keep it personal and low-traffic.
