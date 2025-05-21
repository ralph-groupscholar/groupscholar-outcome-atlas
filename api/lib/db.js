const { Pool } = require("pg");

const SCHEMA = "groupscholar_outcome_atlas";
const TABLE = "outcomes";
const CHECKINS_TABLE = "outcome_checkins";
const STORYBEATS_TABLE = "outcome_storybeats";
const SOURCES_TABLE = "outcome_sources";
const tableRef = `"${SCHEMA}"."${TABLE}"`;
const checkinsRef = `"${SCHEMA}"."${CHECKINS_TABLE}"`;
const storybeatsRef = `"${SCHEMA}"."${STORYBEATS_TABLE}"`;
const sourcesRef = `"${SCHEMA}"."${SOURCES_TABLE}"`;

let pool;
let initialized = false;

function getConfig() {
  const sslEnabled = process.env.OUTCOME_ATLAS_DB_SSL === "true";
  const config = {
    host: process.env.OUTCOME_ATLAS_DB_HOST,
    port: Number(process.env.OUTCOME_ATLAS_DB_PORT || 5432),
    user: process.env.OUTCOME_ATLAS_DB_USER,
    password: process.env.OUTCOME_ATLAS_DB_PASSWORD,
    database: process.env.OUTCOME_ATLAS_DB_NAME,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  };

  return config;
}

function getPool() {
  if (!pool) {
    pool = new Pool(getConfig());
  }
  return pool;
}

async function ensureSchema() {
  if (initialized) return;
  const poolInstance = getPool();
  await poolInstance.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}";`);
  await poolInstance.query(`
    CREATE TABLE IF NOT EXISTS ${tableRef} (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      category text NOT NULL,
      status text NOT NULL,
      metric text NOT NULL,
      owner text NOT NULL,
      confidence integer NOT NULL,
      last_updated date,
      evidence text,
      story text,
      tags text[],
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await poolInstance.query(
    `ALTER TABLE ${tableRef} ADD COLUMN IF NOT EXISTS tags text[];`
  );
  await poolInstance.query(
    `CREATE INDEX IF NOT EXISTS ${TABLE}_last_updated_idx ON ${tableRef} (last_updated DESC);`
  );
  await poolInstance.query(`
    CREATE TABLE IF NOT EXISTS ${checkinsRef} (
      id uuid PRIMARY KEY,
      outcome_id uuid NOT NULL REFERENCES ${tableRef} (id) ON DELETE CASCADE,
      update_date date NOT NULL,
      confidence_delta integer NOT NULL DEFAULT 0,
      momentum text NOT NULL DEFAULT 'Steady',
      note text,
      next_step text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await poolInstance.query(
    `CREATE INDEX IF NOT EXISTS ${CHECKINS_TABLE}_update_date_idx ON ${checkinsRef} (update_date DESC);`
  );
  await poolInstance.query(
    `CREATE INDEX IF NOT EXISTS ${CHECKINS_TABLE}_outcome_id_idx ON ${checkinsRef} (outcome_id);`
  );
  await poolInstance.query(`
    CREATE TABLE IF NOT EXISTS ${storybeatsRef} (
      id uuid PRIMARY KEY,
      outcome_id uuid NOT NULL REFERENCES ${tableRef} (id) ON DELETE CASCADE,
      audience text NOT NULL,
      headline text NOT NULL,
      proof_point text,
      next_move text,
      scheduled_date date NOT NULL,
      owner text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await poolInstance.query(
    `CREATE INDEX IF NOT EXISTS ${STORYBEATS_TABLE}_scheduled_date_idx ON ${storybeatsRef} (scheduled_date ASC);`
  );
  await poolInstance.query(
    `CREATE INDEX IF NOT EXISTS ${STORYBEATS_TABLE}_outcome_id_idx ON ${storybeatsRef} (outcome_id);`
  );
  await poolInstance.query(`
    CREATE TABLE IF NOT EXISTS ${sourcesRef} (
      id uuid PRIMARY KEY,
      outcome_id uuid NOT NULL REFERENCES ${tableRef} (id) ON DELETE CASCADE,
      source_name text NOT NULL,
      source_type text NOT NULL,
      last_verified date,
      cadence_days integer NOT NULL DEFAULT 30,
      owner text,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await poolInstance.query(
    `CREATE INDEX IF NOT EXISTS ${SOURCES_TABLE}_last_verified_idx ON ${sourcesRef} (last_verified DESC);`
  );
  await poolInstance.query(
    `CREATE INDEX IF NOT EXISTS ${SOURCES_TABLE}_outcome_id_idx ON ${sourcesRef} (outcome_id);`
  );
  initialized = true;
}

module.exports = {
  SCHEMA,
  TABLE,
  CHECKINS_TABLE,
  STORYBEATS_TABLE,
  SOURCES_TABLE,
  tableRef,
  checkinsRef,
  storybeatsRef,
  sourcesRef,
  getPool,
  ensureSchema,
};
