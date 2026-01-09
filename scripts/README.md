# Build Scripts

## update-version-date.js

Automatically updates the version date in `src/version.ts` to the current date in YYYYMMDD format.

This script runs automatically as a prebuild step for:
- `npm run build`
- `npm run build-lib`
- `npm run build-lib-dev`

The date can be overridden at runtime by setting `versionDate` in `config.json`.

Example config.json override:
```json
{
  "versionDate": "20260115"
}
```
