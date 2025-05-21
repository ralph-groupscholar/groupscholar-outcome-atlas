const { Client } = require("pg");
const { randomUUID } = require("crypto");

const required = [
  "OUTCOME_ATLAS_DB_HOST",
  "OUTCOME_ATLAS_DB_PORT",
  "OUTCOME_ATLAS_DB_USER",
  "OUTCOME_ATLAS_DB_PASSWORD",
  "OUTCOME_ATLAS_DB_NAME",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const sslEnabled = process.env.OUTCOME_ATLAS_DB_SSL === "true";

const client = new Client({
  host: process.env.OUTCOME_ATLAS_DB_HOST,
  port: Number(process.env.OUTCOME_ATLAS_DB_PORT || 5432),
  user: process.env.OUTCOME_ATLAS_DB_USER,
  password: process.env.OUTCOME_ATLAS_DB_PASSWORD,
  database: process.env.OUTCOME_ATLAS_DB_NAME,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});

const SCHEMA = "groupscholar_outcome_atlas";
const TABLE = "outcomes";
const CHECKINS_TABLE = "outcome_checkins";
const STORYBEATS_TABLE = "outcome_storybeats";
const tableRef = `"${SCHEMA}"."${TABLE}"`;
const checkinsRef = `"${SCHEMA}"."${CHECKINS_TABLE}"`;
const storybeatsRef = `"${SCHEMA}"."${STORYBEATS_TABLE}"`;

const sampleOutcomes = [
  {
    id: randomUUID(),
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
    id: randomUUID(),
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
    id: randomUUID(),
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
    id: randomUUID(),
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
  {
    id: randomUUID(),
    title: "First-year persistence hit 91%",
    category: "Retention",
    status: "On Track",
    metric: "Persistence rate",
    owner: "Student Success",
    confidence: 90,
    date: "2026-02-05",
    evidence: "https://example.com/persistence-memo",
    story: "New onboarding checklist improved early-term connections.",
    tags: ["retention", "onboarding", "first-year"],
  },
  {
    id: randomUUID(),
    title: "Graduate school applications up 24%",
    category: "Career",
    status: "Watching",
    metric: "Applications submitted",
    owner: "Alumni Affairs",
    confidence: 69,
    date: "2026-01-18",
    evidence: "https://example.com/grad-school-log",
    story: "Workshops boosted interest, but completion rates need follow-up.",
    tags: ["career", "graduate school", "workshops"],
  },
];

const sampleCheckins = [
  {
    id: randomUUID(),
    outcome_id: sampleOutcomes[0].id,
    update_date: "2026-02-05",
    confidence_delta: 4,
    momentum: "Up",
    note: "Retention nudges for first-gen scholars continued to reduce stop-out risk.",
    next_step: "Share weekly playbook with regional advisors.",
  },
  {
    id: randomUUID(),
    outcome_id: sampleOutcomes[1].id,
    update_date: "2026-02-01",
    confidence_delta: -3,
    momentum: "Down",
    note: "STEM placement pipeline slowed as spring internships confirmed later than expected.",
    next_step: "Accelerate employer outreach for April cohorts.",
  },
  {
    id: randomUUID(),
    outcome_id: sampleOutcomes[3].id,
    update_date: "2026-02-03",
    confidence_delta: 2,
    momentum: "Up",
    note: "New peer pod pilots improved belonging scores in early feedback.",
    next_step: "Roll pods to remaining campuses by March.",
  },
];

const sampleStorybeats = [
  {
    id: randomUUID(),
    outcome_id: sampleOutcomes[0].id,
    audience: "Leadership",
    headline: "Retention playbook proving out",
    proof_point: "Stop-out risk down in regions piloting advisor nudges.",
    next_move: "Draft slide for the February exec review.",
    scheduled_date: "2026-02-12",
    owner: "Program Ops",
  },
  {
    id: randomUUID(),
    outcome_id: sampleOutcomes[3].id,
    audience: "Partners",
    headline: "Peer pod pilots lifting belonging",
    proof_point: "Pilot campuses reported a 0.4 bump in belonging scores.",
    next_move: "Confirm partner talking points and scholar quotes.",
    scheduled_date: "2026-02-10",
    owner: "Community Team",
  },
  {
    id: randomUUID(),
    outcome_id: sampleOutcomes[1].id,
    audience: "Leadership",
    headline: "Placement pipeline needs April lift",
    proof_point: "STEM internships confirming later, but employer interest remains strong.",
    next_move: "Align employer outreach sprint with March deadlines.",
    scheduled_date: "2026-02-17",
    owner: "Career Success",
  },
];

async function run() {
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}";`);
  await client.query(`
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
  await client.query(
    `ALTER TABLE ${tableRef} ADD COLUMN IF NOT EXISTS tags text[];`
  );
  await client.query(
    `CREATE INDEX IF NOT EXISTS ${TABLE}_last_updated_idx ON ${tableRef} (last_updated DESC);`
  );
  await client.query(`
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
  await client.query(
    `CREATE INDEX IF NOT EXISTS ${CHECKINS_TABLE}_update_date_idx ON ${checkinsRef} (update_date DESC);`
  );
  await client.query(
    `CREATE INDEX IF NOT EXISTS ${CHECKINS_TABLE}_outcome_id_idx ON ${checkinsRef} (outcome_id);`
  );
  await client.query(`
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
  await client.query(
    `CREATE INDEX IF NOT EXISTS ${STORYBEATS_TABLE}_scheduled_date_idx ON ${storybeatsRef} (scheduled_date ASC);`
  );
  await client.query(
    `CREATE INDEX IF NOT EXISTS ${STORYBEATS_TABLE}_outcome_id_idx ON ${storybeatsRef} (outcome_id);`
  );

  for (const outcome of sampleOutcomes) {
    await client.query(
      `
      INSERT INTO ${tableRef}
        (id, title, category, status, metric, owner, confidence, last_updated, evidence, story, tags)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        metric = EXCLUDED.metric,
        owner = EXCLUDED.owner,
        confidence = EXCLUDED.confidence,
        last_updated = EXCLUDED.last_updated,
        evidence = EXCLUDED.evidence,
        story = EXCLUDED.story,
        tags = EXCLUDED.tags;
      `,
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

  for (const checkin of sampleCheckins) {
    await client.query(
      `
      INSERT INTO ${checkinsRef}
        (id, outcome_id, update_date, confidence_delta, momentum, note, next_step)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        outcome_id = EXCLUDED.outcome_id,
        update_date = EXCLUDED.update_date,
        confidence_delta = EXCLUDED.confidence_delta,
        momentum = EXCLUDED.momentum,
        note = EXCLUDED.note,
        next_step = EXCLUDED.next_step;
      `,
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

  for (const storybeat of sampleStorybeats) {
    await client.query(
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
        owner = EXCLUDED.owner;
      `,
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
    `Seeded ${sampleOutcomes.length} outcomes, ${sampleCheckins.length} check-ins, and ${sampleStorybeats.length} story beats.`
  );
  await client.end();
}

run().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
