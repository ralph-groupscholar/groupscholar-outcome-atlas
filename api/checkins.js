const { randomUUID } = require("crypto");
const { tableRef, checkinsRef, getPool, ensureSchema } = require("./lib/db");

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
          c.id,
          c.outcome_id,
          c.update_date,
          c.confidence_delta,
          c.momentum,
          c.note,
          c.next_step,
          c.created_at,
          o.title AS outcome_title,
          o.owner AS outcome_owner
        FROM ${checkinsRef} c
        LEFT JOIN ${tableRef} o ON o.id = c.outcome_id
        ORDER BY c.update_date DESC, c.created_at DESC
        LIMIT 200;
        `
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ checkins: rows }));
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
        payload.update_date || new Date().toISOString().split("T")[0],
        Number(payload.confidence_delta || 0),
        payload.momentum || "Steady",
        payload.note || null,
        payload.next_step || null,
      ];

      const { rows } = await pool.query(
        `
        INSERT INTO ${checkinsRef}
          (id, outcome_id, update_date, confidence_delta, momentum, note, next_step)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          outcome_id,
          update_date,
          confidence_delta,
          momentum,
          note,
          next_step,
          created_at;
        `,
        values
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          checkin: {
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
