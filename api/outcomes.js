const { randomUUID } = require("crypto");
const { tableRef, getPool, ensureSchema } = require("./lib/db");

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
          id,
          title,
          category,
          status,
          metric,
          owner,
          confidence,
          last_updated AS date,
          evidence,
          story
        FROM ${tableRef}
        ORDER BY last_updated DESC NULLS LAST, created_at DESC
        LIMIT 200;
        `
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ outcomes: rows }));
      return;
    }

    if (req.method === "POST") {
      const raw = await readBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const id = payload.id || randomUUID();

      const values = [
        id,
        payload.title || "Untitled outcome",
        payload.category || "Access",
        payload.status || "On Track",
        payload.metric || "",
        payload.owner || "",
        Number(payload.confidence || 0),
        payload.date || null,
        payload.evidence || null,
        payload.story || null,
      ];

      const { rows } = await pool.query(
        `
        INSERT INTO ${tableRef}
          (id, title, category, status, metric, owner, confidence, last_updated, evidence, story)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          metric = EXCLUDED.metric,
          owner = EXCLUDED.owner,
          confidence = EXCLUDED.confidence,
          last_updated = EXCLUDED.last_updated,
          evidence = EXCLUDED.evidence,
          story = EXCLUDED.story
        RETURNING
          id,
          title,
          category,
          status,
          metric,
          owner,
          confidence,
          last_updated AS date,
          evidence,
          story;
        `,
        values
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ outcome: rows[0] }));
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
