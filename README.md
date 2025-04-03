# Group Scholar Outcome Atlas

Outcome Atlas is a lightweight evidence ledger for tracking scholarship program outcomes, confidence signals, and narrative context. It runs as a static web app with local storage plus cloud sync for shared reporting.

## Highlights
- Outcome portfolio with category, status, owner, and metric signals
- Evidence timeline and confidence pulse
- Local storage persistence plus JSON export
- Cloud-synced outcomes backed by PostgreSQL

## Cloud sync
The `/api/outcomes` endpoint reads and writes outcomes from a PostgreSQL database.

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
