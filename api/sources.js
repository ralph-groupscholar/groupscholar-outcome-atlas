const { randomUUID } = require("crypto");
const { tableRef, sourcesRef, getPool, ensureSchema } = require("./lib/db");

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function missingEnv() {
  const required = [
    "OUTCOME_ATLAS_DB_HOST",
    "OUTCOME_ATLAS_DB_PORT",
    "OUTCOME_ATLAS_DB_USER",
    "OUTCOME_ATLAS_DB_PASSWORD",
    "OUTCOME_ATLAS_DB_NAME",
  ];

  return required.filter((key) => !process.env[key]);
}

module.exports = async (req, res) => {
  const missing = missingEnv();
  if (missing.length) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Database not configured", missing }));
    return;
  }

  try {
    await ensureSchema();
    const pool = getPool();

    if (req.method === "GET") {
      const { rows } = await pool.query(
        `
        SELECT
          s.id,
          s.outcome_id,
          s.source_name,
          s.source_type,
          s.last_verified,
          s.cadence_days,
          s.owner,
          s.notes,
          s.created_at,
          o.title AS outcome_title,
          o.owner AS outcome_owner
        FROM ${sourcesRef} s
        LEFT JOIN ${tableRef} o ON o.id = s.outcome_id
        ORDER BY s.last_verified DESC NULLS LAST, s.created_at DESC
        LIMIT 200;
        `
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ sources: rows }));
      return;
    }

    if (req.method === "POST") {
      const raw = await readBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const outcomeId = payload.outcome_id;
      if (!outcomeId) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Outcome id is required" }));
        return;
      }

      const outcomeResult = await pool.query(
        `SELECT id, title, owner FROM ${tableRef} WHERE id = $1 LIMIT 1;`,
        [outcomeId]
      );
      if (!outcomeResult.rows.length) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Outcome not found" }));
        return;
      }

      const id = payload.id || randomUUID();
      const values = [
        id,
        outcomeId,
        payload.source_name || "Evidence source",
        payload.source_type || "Dashboard",
        payload.last_verified || null,
        Number(payload.cadence_days || 30),
        payload.owner || null,
        payload.notes || null,
      ];

      const { rows } = await pool.query(
        `
        INSERT INTO ${sourcesRef}
          (id, outcome_id, source_name, source_type, last_verified, cadence_days, owner, notes)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          outcome_id = EXCLUDED.outcome_id,
          source_name = EXCLUDED.source_name,
          source_type = EXCLUDED.source_type,
          last_verified = EXCLUDED.last_verified,
          cadence_days = EXCLUDED.cadence_days,
          owner = EXCLUDED.owner,
          notes = EXCLUDED.notes
        RETURNING
          id,
          outcome_id,
          source_name,
          source_type,
          last_verified,
          cadence_days,
          owner,
          notes,
          created_at;
        `,
        values
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          source: {
            ...rows[0],
            outcome_title: outcomeResult.rows[0].title,
            outcome_owner: outcomeResult.rows[0].owner,
          },
        })
      );
      return;
    }

    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Server error", detail: error.message }));
  }
};
