const { Pool } = require("pg");

const SCHEMA = "groupscholar_outcome_atlas";
const TABLE = "outcomes";
const tableRef = `"${SCHEMA}"."${TABLE}"`;

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
  initialized = true;
}

module.exports = {
  SCHEMA,
  TABLE,
  tableRef,
  getPool,
  ensureSchema,
};
