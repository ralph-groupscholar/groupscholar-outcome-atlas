# Group Scholar Outcome Atlas

Outcome Atlas is a lightweight evidence ledger for tracking scholarship program outcomes, confidence signals, and narrative context. It runs as a static web app with local storage plus cloud sync for shared reporting.

## Highlights
- Outcome portfolio with category, status, owner, and metric signals
- Evidence timeline and confidence pulse
- Momentum check-ins with confidence deltas and next steps
- Local storage persistence plus JSON export
- Cloud-synced outcomes and check-ins backed by PostgreSQL

## Cloud sync
The `/api/outcomes` and `/api/checkins` endpoints read and write data from a PostgreSQL database.

Required environment variables (set in Vercel):
- `OUTCOME_ATLAS_DB_HOST`
- `OUTCOME_ATLAS_DB_PORT`
- `OUTCOME_ATLAS_DB_USER`
- `OUTCOME_ATLAS_DB_PASSWORD`
- `OUTCOME_ATLAS_DB_NAME`
- `OUTCOME_ATLAS_DB_SSL` (optional, set to `true` if the database requires SSL)

Seed the database (run from this repo with env vars set):
```
npm install
npm run seed:outcome-atlas
```

## Run locally
Open `index.html` in a browser.
