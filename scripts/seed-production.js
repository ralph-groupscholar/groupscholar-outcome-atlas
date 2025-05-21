const {
  tableRef,
  checkinsRef,
  storybeatsRef,
  getPool,
  ensureSchema,
} = require("../api/lib/db");

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
    tags: ["retention", "advisor outreach", "first-gen"],
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
    tags: ["career", "employer pipeline", "STEM"],
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
    tags: ["wellbeing", "financial coaching", "emergency grants"],
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
    tags: ["community", "belonging", "peer pods"],
  },
];

const checkins = [
  {
    id: "2fd519ae-0f2a-4ac6-9d0a-b8b0cb5dbd12",
    outcome_id: "3f1e7f2c-7fd2-4d98-9fa8-0d0b42751b1a",
    update_date: "2026-02-05",
    confidence_delta: 4,
    momentum: "Up",
    note: "Retention nudges for first-gen scholars continued to reduce stop-out risk.",
    next_step: "Share weekly playbook with regional advisors.",
  },
  {
    id: "b67dbe98-1b1b-45d8-8d61-8b1d600cd3be",
    outcome_id: "f6f0f9d9-3f0c-4a1d-99dd-1c8b5c6c1a4a",
    update_date: "2026-02-01",
    confidence_delta: -3,
    momentum: "Down",
    note: "STEM placement pipeline slowed as spring internships confirmed later than expected.",
    next_step: "Accelerate employer outreach for April cohorts.",
  },
  {
    id: "bb6b1a9e-3b9b-4b33-9722-5d7efb859e77",
    outcome_id: "e58a7bcb-120d-4c2b-8ec4-b9c86c8c6a86",
    update_date: "2026-02-03",
    confidence_delta: 2,
    momentum: "Up",
    note: "New peer pod pilots improved belonging scores in early feedback.",
    next_step: "Roll pods to remaining campuses by March.",
  },
];

const storybeats = [
  {
    id: "9a78dd5d-0e40-4f1a-a3a5-58d5f2a2d3a1",
    outcome_id: "3f1e7f2c-7fd2-4d98-9fa8-0d0b42751b1a",
    audience: "Leadership",
    headline: "Retention playbook proving out",
    proof_point: "Stop-out risk down in regions piloting advisor nudges.",
    next_move: "Draft slide for the February exec review.",
    scheduled_date: "2026-02-12",
    owner: "Program Ops",
  },
  {
    id: "b28d0d3d-69b0-4f9b-9d7b-8b3d9f2b0a2a",
    outcome_id: "e58a7bcb-120d-4c2b-8ec4-b9c86c8c6a86",
    audience: "Partners",
    headline: "Peer pod pilots lifting belonging",
    proof_point: "Pilot campuses reported a 0.4 bump in belonging scores.",
    next_move: "Confirm partner talking points and scholar quotes.",
    scheduled_date: "2026-02-10",
    owner: "Community Team",
  },
  {
    id: "6d9b3a1b-9b2d-4f0a-9b1d-1b4c2f4c8b9a",
    outcome_id: "f6f0f9d9-3f0c-4a1d-99dd-1c8b5c6c1a4a",
    audience: "Leadership",
    headline: "Placement pipeline needs April lift",
    proof_point: "STEM internships confirming later, but employer interest remains strong.",
    next_move: "Align employer outreach sprint with March deadlines.",
    scheduled_date: "2026-02-17",
    owner: "Career Success",
  },
];

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

async function run() {
  const missing = missingEnv();
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const pool = getPool();
  try {
    await ensureSchema();

    for (const outcome of outcomes) {
      await pool.query(
        `INSERT INTO ${tableRef}
          (id, title, category, status, metric, owner, confidence, last_updated, evidence, story, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id)
         DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           status = EXCLUDED.status,
           metric = EXCLUDED.metric,
           owner = EXCLUDED.owner,
           confidence = EXCLUDED.confidence,
           last_updated = EXCLUDED.last_updated,
           evidence = EXCLUDED.evidence,
           story = EXCLUDED.story,
           tags = EXCLUDED.tags;`,
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
          outcome.tags || null,
        ]
      );
    }

    for (const checkin of checkins) {
      await pool.query(
        `INSERT INTO ${checkinsRef}
          (id, outcome_id, update_date, confidence_delta, momentum, note, next_step)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id)
         DO UPDATE SET
           outcome_id = EXCLUDED.outcome_id,
           update_date = EXCLUDED.update_date,
           confidence_delta = EXCLUDED.confidence_delta,
           momentum = EXCLUDED.momentum,
           note = EXCLUDED.note,
           next_step = EXCLUDED.next_step;`,
        [
          checkin.id,
          checkin.outcome_id,
          checkin.update_date,
          checkin.confidence_delta,
          checkin.momentum,
          checkin.note,
          checkin.next_step,
        ]
      );
    }

    for (const storybeat of storybeats) {
      await pool.query(
        `INSERT INTO ${storybeatsRef}
          (id, outcome_id, audience, headline, proof_point, next_move, scheduled_date, owner)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id)
         DO UPDATE SET
           outcome_id = EXCLUDED.outcome_id,
           audience = EXCLUDED.audience,
           headline = EXCLUDED.headline,
           proof_point = EXCLUDED.proof_point,
           next_move = EXCLUDED.next_move,
           scheduled_date = EXCLUDED.scheduled_date,
           owner = EXCLUDED.owner;`,
        [
          storybeat.id,
          storybeat.outcome_id,
          storybeat.audience,
          storybeat.headline,
          storybeat.proof_point,
          storybeat.next_move,
          storybeat.scheduled_date,
          storybeat.owner,
        ]
      );
    }

    console.log(
      `Seeded ${outcomes.length} outcomes, ${checkins.length} check-ins, and ${storybeats.length} story beats into ${tableRef}.`
    );
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
