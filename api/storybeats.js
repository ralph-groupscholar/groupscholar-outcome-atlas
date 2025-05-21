const { randomUUID } = require("crypto");
const { tableRef, storybeatsRef, getPool, ensureSchema } = require("./lib/db");

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
          s.audience,
          s.headline,
          s.proof_point,
          s.next_move,
          s.scheduled_date,
          s.owner,
          s.created_at,
          o.title AS outcome_title,
          o.owner AS outcome_owner
        FROM ${storybeatsRef} s
        LEFT JOIN ${tableRef} o ON o.id = s.outcome_id
        ORDER BY s.scheduled_date ASC, s.created_at ASC
        LIMIT 200;
        `
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ storybeats: rows }));
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
        payload.audience || "Leadership",
        payload.headline || "Outcome story beat",
        payload.proof_point || null,
        payload.next_move || null,
        payload.scheduled_date || new Date().toISOString().split("T")[0],
        payload.owner || null,
      ];

      const { rows } = await pool.query(
        `
        INSERT INTO ${storybeatsRef}
          (id, outcome_id, audience, headline, proof_point, next_move, scheduled_date, owner)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          outcome_id = EXCLUDED.outcome_id,
          audience = EXCLUDED.audience,
          headline = EXCLUDED.headline,
          proof_point = EXCLUDED.proof_point,
          next_move = EXCLUDED.next_move,
          scheduled_date = EXCLUDED.scheduled_date,
          owner = EXCLUDED.owner
        RETURNING
          id,
          outcome_id,
          audience,
          headline,
          proof_point,
          next_move,
          scheduled_date,
          owner,
          created_at;
        `,
        values
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          storybeat: {
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
