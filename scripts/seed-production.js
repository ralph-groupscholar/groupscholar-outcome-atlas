const { Pool } = require("pg");

const outcomes = [
  {
    id: "3f1e7f2c-7fd2-4d98-9fa8-0d0b42751b1a",
    title: "Scholar retention up 12% year-over-year",
    category: "Retention",
    status: "On Track",
    metric: "Retention rate",
    owner: "Program Ops",
    confidence: 88,
    date: "2026-02-02",
    evidence: "https://example.com/retention-report",
    story: "Advisor office hours tied to term readiness reduced midterm drop-offs.",
  },
  {
    id: "f6f0f9d9-3f0c-4a1d-99dd-1c8b5c6c1a4a",
    title: "Career placement within 6 months reached 64%",
    category: "Career",
    status: "Watching",
    metric: "Placement rate",
    owner: "Career Success",
    confidence: 72,
    date: "2026-01-26",
    evidence: "https://example.com/placement-dashboard",
    story: "Employer cohort matchups improving, but pipeline still uneven for STEM majors.",
  },
  {
    id: "9f5b5d5d-8a24-4d8b-a9de-6f02d05d2149",
    title: "Emergency grant requests down 18%",
    category: "Wellbeing",
    status: "On Track",
    metric: "Grant requests",
    owner: "Scholar Support",
    confidence: 83,
    date: "2026-01-20",
    evidence: "https://example.com/grant-log",
    story: "New financial coaching cadence reduced crisis escalations.",
  },
  {
    id: "e58a7bcb-120d-4c2b-8ec4-b9c86c8c6a86",
    title: "Community belonging score dipped to 3.8/5",
    category: "Community",
    status: "Needs Lift",
    metric: "Belonging survey",
    owner: "Community Team",
    confidence: 58,
    date: "2026-01-29",
    evidence: "https://example.com/survey-highlights",
    story: "Scholars want more peer pods across campuses; listening sessions scheduled.",
  },
];

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed production data.");
  }

  const useSsl = process.env.DATABASE_SSL === "true";
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.query("CREATE SCHEMA IF NOT EXISTS gs_outcome_atlas;");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gs_outcome_atlas.outcomes (
        id uuid PRIMARY KEY,
        title text NOT NULL,
        category text NOT NULL,
        status text NOT NULL,
        metric text NOT NULL,
        owner text NOT NULL,
        confidence integer NOT NULL,
        date date,
        evidence text,
        story text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    for (const outcome of outcomes) {
      await pool.query(
        `INSERT INTO gs_outcome_atlas.outcomes
          (id, title, category, status, metric, owner, confidence, date, evidence, story)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id)
         DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           status = EXCLUDED.status,
           metric = EXCLUDED.metric,
           owner = EXCLUDED.owner,
           confidence = EXCLUDED.confidence,
           date = EXCLUDED.date,
           evidence = EXCLUDED.evidence,
           story = EXCLUDED.story;`,
        [
          outcome.id,
          outcome.title,
          outcome.category,
          outcome.status,
          outcome.metric,
          outcome.owner,
          outcome.confidence,
          outcome.date,
          outcome.evidence,
          outcome.story,
        ]
      );
    }

    console.log(`Seeded ${outcomes.length} outcomes into gs_outcome_atlas.outcomes.`);
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
