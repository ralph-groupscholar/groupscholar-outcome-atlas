const { Pool } = require("pg");

const SCHEMA = "groupscholar_outcome_atlas";
const TABLE = "outcomes";
const CHECKINS_TABLE = "outcome_checkins";
const tableRef = `"${SCHEMA}"."${TABLE}"`;
const checkinsRef = `"${SCHEMA}"."${CHECKINS_TABLE}"`;

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
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
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
  initialized = true;
}

module.exports = {
  SCHEMA,
  TABLE,
  CHECKINS_TABLE,
  tableRef,
  checkinsRef,
  getPool,
  ensureSchema,
};
