# React Cutover Checklist

Use this checklist before removing legacy scripts from `index.html`.

## Preconditions

- [ ] All parity checks in `docs/migration-parity-checklist.md` pass
- [ ] React tabs are enabled in `web/src/config/featureFlags.js`
- [ ] No critical console errors after 15 minutes of active use

## Cutover Steps

- [ ] Point hosting root to `web/dist` (or deploy from `web/`)
- [ ] Keep legacy app reachable as fallback path for one release cycle
- [ ] Preserve localStorage compatibility keys:
  - `casan_rto_cfg`
  - `csn_wa_cfg`
  - `casan:rto:v2`

## Legacy Removal Steps

- [ ] Remove legacy script tags from `index.html` after successful release
- [ ] Remove dead `window.*` compatibility shims from React bridge
- [ ] Remove unused legacy CSS once React styles are fully verified
