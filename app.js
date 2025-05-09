const STORAGE_KEY = "gs_outcome_atlas_v1";
const API_ENDPOINT = "/api/outcomes";
const CHECKINS_KEY = "gs_outcome_atlas_checkins_v1";
const CHECKINS_ENDPOINT = "/api/checkins";
const STORYBEATS_KEY = "gs_outcome_atlas_storybeats_v1";
const STORYBEATS_ENDPOINT = "/api/storybeats";

const demoOutcomes = [
  {
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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

const selectors = {
  list: document.querySelector("#outcome-list"),
  timeline: document.querySelector("#timeline"),
  form: document.querySelector("#outcome-form"),
  search: document.querySelector("#search"),
  filterCategory: document.querySelector("#filter-category"),
  filterStatus: document.querySelector("#filter-status"),
  filterTag: document.querySelector("#filter-tag"),
  sortBy: document.querySelector("#sort-by"),
  statTotal: document.querySelector("#stat-total"),
  statOnTrack: document.querySelector("#stat-on-track"),
  statAttention: document.querySelector("#stat-attention"),
  pulse: document.querySelector("#pulse-meter"),
  statEvidenceLinked: document.querySelector("#stat-evidence-linked"),
  statEvidenceRate: document.querySelector("#stat-evidence-rate"),
  statStale: document.querySelector("#stat-stale"),
  statLowConfidence: document.querySelector("#stat-low-confidence"),
  actionList: document.querySelector("#action-list"),
  cadenceOverdue: document.querySelector("#cadence-overdue"),
  cadenceWeek: document.querySelector("#cadence-week"),
  cadenceMonth: document.querySelector("#cadence-month"),
  cadenceList: document.querySelector("#cadence-list"),
  ownerSummary: document.querySelector("#owner-summary"),
  ownerList: document.querySelector("#owner-list"),
  ownerRhythmSummary: document.querySelector("#owner-rhythm-summary"),
  ownerRhythmList: document.querySelector("#owner-rhythm-list"),
  categorySummary: document.querySelector("#category-summary"),
  categoryList: document.querySelector("#category-list"),
  riskSummary: document.querySelector("#risk-summary"),
  riskList: document.querySelector("#risk-list"),
  exportButton: document.querySelector("#export-json"),
  seedButton: document.querySelector("#seed-demo"),
  briefOutput: document.querySelector("#brief-output"),
  briefMeta: document.querySelector("#brief-meta"),
  briefGenerate: document.querySelector("#generate-brief"),
  briefCopy: document.querySelector("#copy-brief"),
  syncStatus: document.querySelector("#sync-status"),
  checkinList: document.querySelector("#checkin-list"),
  checkinForm: document.querySelector("#checkin-form"),
  checkinOutcome: document.querySelector("#checkin-outcome"),
  checkinDate: document.querySelector("#checkin-date"),
  checkinMomentum: document.querySelector("#checkin-momentum"),
  checkinDelta: document.querySelector("#checkin-delta"),
  checkinNote: document.querySelector("#checkin-note"),
  checkinNextStep: document.querySelector("#checkin-next-step"),
  checkinsWeek: document.querySelector("#checkins-week"),
  checkinsUp: document.querySelector("#checkins-up"),
  momentumList: document.querySelector("#momentum-list"),
  momentumSummary: document.querySelector("#momentum-summary"),
  storyList: document.querySelector("#story-list"),
  storyForm: document.querySelector("#story-form"),
  storyOutcome: document.querySelector("#story-outcome"),
  storyAudience: document.querySelector("#story-audience"),
  storyHeadline: document.querySelector("#story-headline"),
  storyProof: document.querySelector("#story-proof"),
  storyNext: document.querySelector("#story-next"),
  storyDate: document.querySelector("#story-date"),
  storyOverdue: document.querySelector("#story-overdue"),
  storyWeek: document.querySelector("#story-week"),
  storyPartner: document.querySelector("#story-partner"),
  tagsInput: document.querySelector("#tags"),
};

let outcomes = [];
let remoteAvailable = false;
let checkins = [];
let checkinsRemoteAvailable = false;
let storybeats = [];
let storybeatsRemoteAvailable = false;

function setDefaultDate() {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.querySelector("#date");
  if (dateInput) {
    dateInput.value = today;
  }
  if (selectors.checkinDate) {
    selectors.checkinDate.value = today;
  }
  if (selectors.storyDate) {
    selectors.storyDate.value = today;
  }
}

function loadLocalOutcomes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Unable to parse saved outcomes", error);
    }
  }
  return demoOutcomes;
}

function loadLocalCheckins() {
  const raw = localStorage.getItem(CHECKINS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Unable to parse saved check-ins", error);
    }
  }
  return [];
}

function loadLocalStorybeats() {
  const raw = localStorage.getItem(STORYBEATS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Unable to parse saved storybeats", error);
    }
  }
  return [];
}

function saveOutcomes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(outcomes));
}

function saveCheckins() {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkins));
}

function saveStorybeats() {
  localStorage.setItem(STORYBEATS_KEY, JSON.stringify(storybeats));
}

function updateSyncStatus(state, detail) {
  if (!selectors.syncStatus) return;
  let label = "Local only";
  if (state === "local") label = "Local only";
  if (state === "syncing") label = "Syncing";
  if (state === "live") label = "Cloud sync active";
  if (state === "error") label = "Sync unavailable";
  selectors.syncStatus.innerHTML = `Sync: <strong>${label}</strong>${detail ? ` · ${detail}` : ""}`;
}

async function fetchRemoteOutcomes() {
  try {
    updateSyncStatus("syncing");
    const response = await fetch(API_ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Remote fetch failed (${response.status})`);
    }
    const payload = await response.json();
    const items = Array.isArray(payload.outcomes) ? payload.outcomes : [];
    remoteAvailable = true;
    updateSyncStatus("live", `${items.length} in cloud`);
    return items;
  } catch (error) {
    remoteAvailable = false;
    updateSyncStatus("error", "using local cache");
    return null;
  }
}

async function fetchRemoteCheckins() {
  try {
    const response = await fetch(CHECKINS_ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Remote fetch failed (${response.status})`);
    }
    const payload = await response.json();
    const items = Array.isArray(payload.checkins) ? payload.checkins : [];
    checkinsRemoteAvailable = true;
    return items;
  } catch (error) {
    checkinsRemoteAvailable = false;
    return null;
  }
}

async function fetchRemoteStorybeats() {
  try {
    const response = await fetch(STORYBEATS_ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Remote fetch failed (${response.status})`);
    }
    const payload = await response.json();
    const items = Array.isArray(payload.storybeats) ? payload.storybeats : [];
    storybeatsRemoteAvailable = true;
    return items;
  } catch (error) {
    storybeatsRemoteAvailable = false;
    return null;
  }
}

async function persistOutcome(outcome) {
  outcomes = [outcome, ...outcomes];
  saveOutcomes();
  renderOutcomes();

  if (!remoteAvailable) return;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outcome),
    });
    if (!response.ok) {
      throw new Error(`Remote save failed (${response.status})`);
    }
    const payload = await response.json();
    if (payload.outcome) {
      outcomes = outcomes.map((item) =>
        item.id === payload.outcome.id ? payload.outcome : item
      );
      saveOutcomes();
      renderOutcomes();
    }
  } catch (error) {
    remoteAvailable = false;
    updateSyncStatus("error", "saved locally");
  }
}

function clampConfidence(value) {
  return Math.min(Math.max(Number(value) || 0, 0), 100);
}

async function syncOutcomeUpdate(updatedOutcome) {
  if (!remoteAvailable) return;
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedOutcome),
    });
    if (!response.ok) {
      throw new Error(`Remote save failed (${response.status})`);
    }
  } catch (error) {
    remoteAvailable = false;
    updateSyncStatus("error", "saved locally");
  }
}

function updateOutcomeFields(outcomeId, updates) {
  let updatedOutcome = null;
  outcomes = outcomes.map((item) => {
    if (item.id !== outcomeId) return item;
    updatedOutcome = { ...item, ...updates };
    return updatedOutcome;
  });
  if (updatedOutcome) {
    saveOutcomes();
    renderOutcomes();
    syncOutcomeUpdate(updatedOutcome);
  }
}

async function seedDemoOutcomes() {
  const seeded = demoOutcomes.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
  }));

  if (!remoteAvailable) {
    outcomes = seeded;
    saveOutcomes();
    renderOutcomes();
    updateSyncStatus("local", "demo loaded");
    return;
  }

  for (const outcome of seeded) {
    await persistOutcome(outcome);
  }
  updateSyncStatus("live", "demo synced");
}

async function initializeOutcomes() {
  outcomes = loadLocalOutcomes();
  updateSyncStatus("local", "cached");
  renderOutcomes();
  const remoteOutcomes = await fetchRemoteOutcomes();
  if (remoteOutcomes) {
    outcomes = remoteOutcomes;
    saveOutcomes();
    renderOutcomes();
  }
}

async function persistCheckin(checkin) {
  checkins = [checkin, ...checkins];
  saveCheckins();
  renderCheckins();

  if (!checkinsRemoteAvailable) return;

  try {
    const response = await fetch(CHECKINS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkin),
    });
    if (!response.ok) {
      throw new Error(`Remote save failed (${response.status})`);
    }
    const payload = await response.json();
    if (payload.checkin) {
      checkins = checkins.map((item) =>
        item.id === payload.checkin.id ? payload.checkin : item
      );
      saveCheckins();
      renderCheckins();
    }
  } catch (error) {
    checkinsRemoteAvailable = false;
  }
}

async function initializeCheckins() {
  checkins = loadLocalCheckins();
  renderCheckins();
  const remoteCheckins = await fetchRemoteCheckins();
  if (remoteCheckins) {
    checkins = remoteCheckins;
    saveCheckins();
    renderCheckins();
  }
}

async function persistStorybeat(storybeat) {
  storybeats = [storybeat, ...storybeats];
  saveStorybeats();
  renderStorybeats();

  if (!storybeatsRemoteAvailable) return;

  try {
    const response = await fetch(STORYBEATS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storybeat),
    });
    if (!response.ok) {
      throw new Error(`Remote save failed (${response.status})`);
    }
    const payload = await response.json();
    if (payload.storybeat) {
      storybeats = storybeats.map((item) =>
        item.id === payload.storybeat.id ? payload.storybeat : item
      );
      saveStorybeats();
      renderStorybeats();
    }
  } catch (error) {
    storybeatsRemoteAvailable = false;
  }
}

async function initializeStorybeats() {
  storybeats = loadLocalStorybeats();
  renderStorybeats();
  const remoteStorybeats = await fetchRemoteStorybeats();
  if (remoteStorybeats) {
    storybeats = remoteStorybeats;
    saveStorybeats();
    renderStorybeats();
  }
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderStats(filtered) {
  selectors.statTotal.textContent = filtered.length;
  selectors.statOnTrack.textContent = filtered.filter(
    (item) => item.status === "On Track"
  ).length;
  selectors.statAttention.textContent = filtered.filter(
    (item) => item.status === "Needs Lift"
  ).length;

  const avgConfidence =
    filtered.reduce((total, item) => total + Number(item.confidence || 0), 0) /
      Math.max(filtered.length, 1) ||
    0;
  const markerPosition = Math.min(Math.max(avgConfidence, 0), 100);
  selectors.pulse.innerHTML = `<span class="pulse-marker" style="left:${markerPosition}%;"></span>`;
}

function daysBetween(dateValue) {
  if (!dateValue) return null;
  const current = new Date();
  const target = new Date(`${dateValue}T00:00:00`);
  const diffMs = current - target;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function buildActionQueue(filtered) {
  const actions = [];
  filtered.forEach((item) => {
    if (!item.evidence || !item.evidence.trim()) {
      actions.push({
        title: `Add evidence link for "${item.title}"`,
        owner: item.owner,
        tag: "Evidence",
        priority: 3,
      });
    }

    const daysOld = daysBetween(item.date);
    if (daysOld !== null && daysOld > 30) {
      actions.push({
        title: `Refresh update for "${item.title}"`,
        owner: item.owner,
        tag: "Recency",
        priority: 2,
      });
    }

    if (Number(item.confidence) < 70) {
      actions.push({
        title: `Strengthen proof for "${item.title}"`,
        owner: item.owner,
        tag: "Confidence",
        priority: 1,
      });
    }
  });

  return actions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);
}

function renderHealth(filtered) {
  const total = filtered.length || 1;
  const linkedEvidence = filtered.filter(
    (item) => item.evidence && item.evidence.trim()
  ).length;
  const staleCount = filtered.filter((item) => {
    const daysOld = daysBetween(item.date);
    return daysOld !== null && daysOld > 30;
  }).length;
  const lowConfidence = filtered.filter(
    (item) => Number(item.confidence) < 70
  ).length;

  selectors.statEvidenceLinked.textContent = linkedEvidence;
  selectors.statEvidenceRate.textContent = `${Math.round(
    (linkedEvidence / total) * 100
  )}% coverage`;
  selectors.statStale.textContent = staleCount;
  selectors.statLowConfidence.textContent = lowConfidence;

  const queue = buildActionQueue(filtered);
  selectors.actionList.innerHTML = "";

  if (!queue.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "action-item";
    emptyItem.innerHTML = `<strong>No gaps detected.</strong><div class="action-meta">Keep evidence refreshed to maintain confidence.</div>`;
    selectors.actionList.appendChild(emptyItem);
    return;
  }

  queue.forEach((action) => {
    const item = document.createElement("li");
    item.className = "action-item";
    const tagClass = action.tag === "Evidence" ? "tag alert" : "tag";
    item.innerHTML = `
      <strong>${action.title}</strong>
      <div class="action-meta">
        <span>${action.owner}</span>
        <span class="${tagClass}">${action.tag}</span>
      </div>
    `;
    selectors.actionList.appendChild(item);
  });
}

function getCadenceDays(item) {
  let cadence = 30;
  if (item.status === "Watching") cadence = 21;
  if (item.status === "Needs Lift") cadence = 14;

  if (!item.evidence || !item.evidence.trim()) {
    cadence = Math.min(cadence, 7);
  }

  if (Number(item.confidence) < 70) {
    cadence = Math.min(cadence, 14);
  }

  return cadence;
}

function buildCadencePlan(filtered) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 1000 * 60 * 60 * 24;

  return filtered.map((item) => {
    const hasDate = Boolean(item.date);
    const cadenceDays = hasDate ? getCadenceDays(item) : 0;
    const baseDate = hasDate ? new Date(`${item.date}T00:00:00`) : new Date(today);
    const dueDate = new Date(baseDate.getTime() + cadenceDays * dayMs);
    const diffDays = Math.ceil((dueDate - today) / dayMs);
    const overdue = diffDays < 0 || !hasDate;

    let urgencyLabel = "Due soon";
    if (!hasDate) {
      urgencyLabel = "Missing last update";
    } else if (diffDays < 0) {
      urgencyLabel = `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      urgencyLabel = "Due today";
    } else {
      urgencyLabel = `Due in ${diffDays} days`;
    }

    const cadenceLabel = hasDate
      ? `Cadence every ${cadenceDays} days`
      : "No last update on file";

    return {
      title: item.title,
      owner: item.owner,
      status: item.status,
      dueDate,
      dueLabel: formatDate(dueDate.toISOString().split("T")[0]),
      urgencyLabel,
      cadenceLabel,
      overdue,
      diffDays,
    };
  });
}

function renderCadence(filtered) {
  const plan = buildCadencePlan(filtered).sort((a, b) => a.diffDays - b.diffDays);
  const overdueCount = plan.filter((item) => item.overdue).length;
  const weekCount = plan.filter((item) => item.diffDays >= 0 && item.diffDays <= 7).length;
  const monthCount = plan.filter((item) => item.diffDays >= 0 && item.diffDays <= 30).length;

  selectors.cadenceOverdue.textContent = overdueCount;
  selectors.cadenceWeek.textContent = weekCount;
  selectors.cadenceMonth.textContent = monthCount;

  selectors.cadenceList.innerHTML = "";
  if (!plan.length) {
    const item = document.createElement("li");
    item.className = "cadence-item";
    item.innerHTML = `<strong>No outcomes in view.</strong><div class="cadence-meta muted">Add outcomes to generate a cadence plan.</div>`;
    selectors.cadenceList.appendChild(item);
    return;
  }

  plan.slice(0, 6).forEach((entry) => {
    const item = document.createElement("li");
    item.className = "cadence-item";
    const urgencyClass = entry.overdue ? "tag alert" : "tag";
    const statusClass = entry.status === "Needs Lift" ? "tag alert" : "tag";
    item.innerHTML = `
      <div>
        <strong>${entry.title}</strong>
        <div class="cadence-meta">
          <span>${entry.owner}</span>
          <span>${entry.dueLabel}</span>
        </div>
      </div>
      <div class="cadence-tags">
        <span class="${statusClass}">${entry.status}</span>
        <span class="${urgencyClass}">${entry.urgencyLabel}</span>
      </div>
      <div class="cadence-note muted">${entry.cadenceLabel}</div>
    `;
    selectors.cadenceList.appendChild(item);
  });
}

function formatDelta(value) {
  const numeric = Number(value) || 0;
  if (numeric > 0) return `+${numeric}`;
  return `${numeric}`;
}

function populateCheckinOutcomes() {
  if (!selectors.checkinOutcome) return;
  const current = selectors.checkinOutcome.value;
  selectors.checkinOutcome.innerHTML = "";

  outcomes.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.title} · ${item.owner}`;
    selectors.checkinOutcome.appendChild(option);
  });

  if (current) {
    selectors.checkinOutcome.value = current;
  }
  if (!selectors.checkinOutcome.value && outcomes.length) {
    selectors.checkinOutcome.value = outcomes[0].id;
  }
}

function populateStorybeatOutcomes() {
  if (!selectors.storyOutcome) return;
  const current = selectors.storyOutcome.value;
  selectors.storyOutcome.innerHTML = "";

  outcomes.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.title} · ${item.owner}`;
    selectors.storyOutcome.appendChild(option);
  });

  if (current) {
    selectors.storyOutcome.value = current;
  }
  if (!selectors.storyOutcome.value && outcomes.length) {
    selectors.storyOutcome.value = outcomes[0].id;
  }
}

function renderCheckins() {
  if (!selectors.checkinList) return;
  const sorted = [...checkins].sort(
    (a, b) =>
      new Date(b.update_date || b.created_at || 0) -
      new Date(a.update_date || a.created_at || 0)
  );

  const weekCount = checkins.filter((item) => {
    const daysOld = daysBetween(item.update_date || item.created_at?.split("T")[0]);
    return daysOld !== null && daysOld <= 7;
  }).length;

  const upCount = checkins.filter((item) => item.momentum === "Up").length;

  if (selectors.checkinsWeek) selectors.checkinsWeek.textContent = weekCount;
  if (selectors.checkinsUp) selectors.checkinsUp.textContent = upCount;

  selectors.checkinList.innerHTML = "";
  if (!sorted.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "checkin-item";
    emptyItem.innerHTML =
      "<strong>No check-ins yet.</strong><div class=\"checkin-meta muted\">Log an evidence touchpoint to keep momentum visible.</div>";
    selectors.checkinList.appendChild(emptyItem);
    renderMomentumSignals();
    renderOwnerRhythm(getFilteredOutcomes());
    return;
  }

  sorted.slice(0, 6).forEach((checkin) => {
    const linked = outcomes.find((item) => item.id === checkin.outcome_id);
    const title = checkin.outcome_title || linked?.title || "Outcome update";
    const owner = checkin.outcome_owner || linked?.owner || "Owner not set";
    const momentum = checkin.momentum || "Steady";
    const momentumClass =
      momentum === "Up" ? "tag up" : momentum === "Down" ? "tag down" : "tag";

    const item = document.createElement("li");
    item.className = "checkin-item";
    item.innerHTML = `
      <div class="checkin-top">
        <div>
          <strong>${title}</strong>
          <div class="checkin-meta">
            <span>${owner}</span>
            <span>${formatDate(checkin.update_date)}</span>
          </div>
        </div>
        <div class="checkin-tags">
          <span class="${momentumClass}">${momentum}</span>
          <span class="tag">Δ ${formatDelta(checkin.confidence_delta)}</span>
        </div>
      </div>
      <div class="checkin-note">${checkin.note || "No notes added yet."}</div>
      ${
        checkin.next_step
          ? `<div class="checkin-next muted">Next: ${checkin.next_step}</div>`
          : ""
      }
    `;
    selectors.checkinList.appendChild(item);
  });

  renderMomentumSignals();
  renderOwnerRhythm(getFilteredOutcomes());
}

function renderStorybeats() {
  if (!selectors.storyList) return;
  const sorted = [...storybeats].sort((a, b) => {
    const dateA = a.scheduled_date || a.created_at || 0;
    const dateB = b.scheduled_date || b.created_at || 0;
    return new Date(dateA) - new Date(dateB);
  });

  const overdueCount = storybeats.filter((item) => {
    const daysGap = daysBetween(item.scheduled_date);
    return daysGap !== null && daysGap > 0;
  }).length;

  const weekCount = storybeats.filter((item) => {
    const daysGap = daysBetween(item.scheduled_date);
    return daysGap !== null && daysGap <= 0 && daysGap >= -7;
  }).length;

  const partnerCount = storybeats.filter(
    (item) => item.audience === "Partners"
  ).length;

  if (selectors.storyOverdue) selectors.storyOverdue.textContent = overdueCount;
  if (selectors.storyWeek) selectors.storyWeek.textContent = weekCount;
  if (selectors.storyPartner) selectors.storyPartner.textContent = partnerCount;

  selectors.storyList.innerHTML = "";
  if (!sorted.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "story-item";
    emptyItem.innerHTML =
      "<strong>No story beats yet.</strong><div class=\"story-meta muted\">Queue upcoming partner and leadership updates here.</div>";
    selectors.storyList.appendChild(emptyItem);
    renderOwnerRhythm(getFilteredOutcomes());
    return;
  }

  sorted.slice(0, 6).forEach((storybeat) => {
    const linked = outcomes.find((item) => item.id === storybeat.outcome_id);
    const title = storybeat.outcome_title || linked?.title || "Outcome update";
    const owner = storybeat.owner || storybeat.outcome_owner || linked?.owner || "Owner not set";
    const daysGap = daysBetween(storybeat.scheduled_date);
    let statusLabel = "Upcoming";
    let statusClass = "tag";
    if (daysGap === 0) statusLabel = "Due today";
    if (daysGap !== null && daysGap > 0) {
      statusLabel = `Overdue by ${daysGap} days`;
      statusClass = "tag alert";
    }
    if (daysGap !== null && daysGap < 0) {
      statusLabel = `Due in ${Math.abs(daysGap)} days`;
    }

    const item = document.createElement("li");
    item.className = "story-item";
    item.innerHTML = `
      <div class="story-top">
        <div>
          <strong>${storybeat.headline || "Story beat"}</strong>
          <div class="story-meta">
            <span>${title}</span>
            <span>${owner}</span>
            <span>${formatDate(storybeat.scheduled_date)}</span>
          </div>
        </div>
        <div class="story-tags">
          <span class="tag">${storybeat.audience || "Audience"}</span>
          <span class="${statusClass}">${statusLabel}</span>
        </div>
      </div>
      <div class="story-proof">${storybeat.proof_point || "No proof point added yet."}</div>
      ${
        storybeat.next_move
          ? `<div class="story-next muted">Next: ${storybeat.next_move}</div>`
          : ""
      }
    `;
    selectors.storyList.appendChild(item);
  });

  renderOwnerRhythm(getFilteredOutcomes());
}

function buildMomentumSignals() {
  const cutoffDays = 30;
  const byOutcome = new Map();

  checkins.forEach((checkin) => {
    const dateValue =
      checkin.update_date || checkin.created_at?.split("T")[0];
    const daysOld = daysBetween(dateValue);
    if (daysOld === null || daysOld > cutoffDays) return;

    const outcomeId = checkin.outcome_id;
    if (!outcomeId) return;

    if (!byOutcome.has(outcomeId)) {
      byOutcome.set(outcomeId, {
        outcomeId,
        title: checkin.outcome_title || null,
        owner: checkin.outcome_owner || null,
        delta: 0,
        up: 0,
        down: 0,
        lastDate: null,
      });
    }

    const entry = byOutcome.get(outcomeId);
    entry.delta += Number(checkin.confidence_delta || 0);
    if (checkin.momentum === "Up") entry.up += 1;
    if (checkin.momentum === "Down") entry.down += 1;

    const parsed = dateValue ? new Date(`${dateValue}T00:00:00`) : null;
    if (parsed && (!entry.lastDate || parsed > entry.lastDate)) {
      entry.lastDate = parsed;
    }
  });

  return Array.from(byOutcome.values())
    .map((entry) => {
      const linked = outcomes.find((item) => item.id === entry.outcomeId);
      return {
        ...entry,
        title: entry.title || linked?.title || "Outcome update",
        owner: entry.owner || linked?.owner || "Owner not set",
        lastSeen: entry.lastDate
          ? formatDate(entry.lastDate.toISOString().split("T")[0])
          : "No recent date",
      };
    })
    .sort((a, b) => {
      const deltaGap = Math.abs(b.delta) - Math.abs(a.delta);
      if (deltaGap !== 0) return deltaGap;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 6);
}

function renderMomentumSignals() {
  if (!selectors.momentumList) return;
  const signals = buildMomentumSignals();
  selectors.momentumList.innerHTML = "";

  if (selectors.momentumSummary) {
    selectors.momentumSummary.textContent = `${signals.length} outcomes with check-ins in the last 30 days.`;
  }

  if (!signals.length) {
    const empty = document.createElement("li");
    empty.className = "momentum-item";
    empty.innerHTML =
      "<strong>No recent momentum yet.</strong><div class=\"momentum-meta muted\">Log check-ins to track confidence drift.</div>";
    selectors.momentumList.appendChild(empty);
    return;
  }

  signals.forEach((signal) => {
    const deltaLabel = formatDelta(signal.delta);
    const deltaClass =
      signal.delta > 0 ? "tag up" : signal.delta < 0 ? "tag down" : "tag";
    const item = document.createElement("li");
    item.className = "momentum-item";
    item.innerHTML = `
      <div>
        <strong>${signal.title}</strong>
        <div class="momentum-meta">
          <span>${signal.owner}</span>
          <span>Last check-in: ${signal.lastSeen}</span>
        </div>
      </div>
      <div class="checkin-tags">
        <span class="${deltaClass}">Δ ${deltaLabel}</span>
        <span class="tag">${signal.up} up · ${signal.down} down</span>
      </div>
    `;
    selectors.momentumList.appendChild(item);
  });
}

function isOutcomeAtRisk(item) {
  const stale = daysBetween(item.date);
  return (
    item.status === "Needs Lift" ||
    Number(item.confidence) < 70 ||
    !item.evidence ||
    !item.evidence.trim() ||
    (stale !== null && stale > 30)
  );
}

function buildOwnerLoad(filtered) {
  const owners = new Map();

  filtered.forEach((item) => {
    const owner = item.owner || "Unassigned";
    if (!owners.has(owner)) {
      owners.set(owner, {
        owner,
        total: 0,
        risk: 0,
        needsLift: 0,
        lastUpdate: null,
        confidenceSum: 0,
      });
    }

    const entry = owners.get(owner);
    entry.total += 1;
    entry.confidenceSum += Number(item.confidence || 0);
    if (item.status === "Needs Lift") entry.needsLift += 1;
    if (isOutcomeAtRisk(item)) entry.risk += 1;

    if (item.date) {
      const updated = new Date(`${item.date}T00:00:00`);
      if (!entry.lastUpdate || updated > entry.lastUpdate) {
        entry.lastUpdate = updated;
      }
    }
  });

  return Array.from(owners.values())
    .map((entry) => ({
      ...entry,
      avgConfidence: Math.round(entry.confidenceSum / Math.max(entry.total, 1)),
    }))
    .sort((a, b) => {
      if (b.risk !== a.risk) return b.risk - a.risk;
      if (b.total !== a.total) return b.total - a.total;
      return a.owner.localeCompare(b.owner);
    });
}

function renderOwnerLoad(filtered) {
  const load = buildOwnerLoad(filtered);
  selectors.ownerList.innerHTML = "";

  if (!load.length) {
    const item = document.createElement("li");
    item.className = "owner-item";
    item.innerHTML = `<strong>No owners in view.</strong><div class="owner-meta muted">Add outcomes to surface ownership load.</div>`;
    selectors.ownerList.appendChild(item);
    selectors.ownerSummary.textContent = "No outcomes in view.";
    return;
  }

  const riskOwners = load.filter((entry) => entry.risk > 0).length;
  selectors.ownerSummary.textContent = `${load.length} owners · ${riskOwners} with risk flags`;

  load.slice(0, 6).forEach((entry) => {
    const item = document.createElement("li");
    item.className = "owner-item";
    const lastUpdate = entry.lastUpdate
      ? formatDate(entry.lastUpdate.toISOString().split("T")[0])
      : "No update logged";
    item.innerHTML = `
      <div>
        <strong>${entry.owner}</strong>
        <div class="owner-meta">
          <span>${entry.total} outcomes</span>
          <span>${lastUpdate}</span>
        </div>
      </div>
      <div class="owner-tags">
        <span class="tag">${entry.avgConfidence}% confidence</span>
        <span class="tag ${entry.risk ? "alert" : ""}">${entry.risk} at risk</span>
      </div>
    `;
    selectors.ownerList.appendChild(item);
  });
}

function buildOwnerRhythm(filtered) {
  const byOwner = new Map();
  const outcomeMap = new Map();

  filtered.forEach((item) => {
    outcomeMap.set(item.id, item);
    const owner = item.owner || "Unassigned";
    if (!byOwner.has(owner)) {
      byOwner.set(owner, {
        owner,
        outcomes: 0,
        lastCheckinDate: null,
        overdueStorybeats: 0,
        upcomingStorybeats: 0,
        nextStoryDate: null,
      });
    }
    byOwner.get(owner).outcomes += 1;
  });

  checkins.forEach((checkin) => {
    if (!outcomeMap.has(checkin.outcome_id)) return;
    const linked = outcomeMap.get(checkin.outcome_id);
    const owner = checkin.outcome_owner || linked?.owner || "Unassigned";
    if (!byOwner.has(owner)) return;
    const dateValue = checkin.update_date || checkin.created_at?.split("T")[0];
    if (!dateValue) return;
    const parsed = new Date(`${dateValue}T00:00:00`);
    const entry = byOwner.get(owner);
    if (!entry.lastCheckinDate || parsed > entry.lastCheckinDate) {
      entry.lastCheckinDate = parsed;
    }
  });

  storybeats.forEach((storybeat) => {
    if (!outcomeMap.has(storybeat.outcome_id)) return;
    const linked = outcomeMap.get(storybeat.outcome_id);
    const owner = storybeat.owner || storybeat.outcome_owner || linked?.owner || "Unassigned";
    if (!byOwner.has(owner)) return;
    const dateValue = storybeat.scheduled_date || storybeat.created_at?.split("T")[0];
    if (!dateValue) return;
    const parsed = new Date(`${dateValue}T00:00:00`);
    const daysGap = daysBetween(dateValue);
    const entry = byOwner.get(owner);
    if (daysGap !== null && daysGap > 0) {
      entry.overdueStorybeats += 1;
    } else if (daysGap !== null && daysGap >= -14) {
      entry.upcomingStorybeats += 1;
    }
    if (!entry.nextStoryDate || parsed < entry.nextStoryDate) {
      entry.nextStoryDate = parsed;
    }
  });

  return Array.from(byOwner.values())
    .map((entry) => {
      const lastCheckinLabel = entry.lastCheckinDate
        ? formatDate(entry.lastCheckinDate.toISOString().split("T")[0])
        : "No check-ins yet";
      const daysSince = entry.lastCheckinDate
        ? daysBetween(entry.lastCheckinDate.toISOString().split("T")[0])
        : null;
      return {
        ...entry,
        lastCheckinLabel,
        daysSince,
        staleCheckins: daysSince === null || daysSince > 21,
        nextStoryLabel: entry.nextStoryDate
          ? formatDate(entry.nextStoryDate.toISOString().split("T")[0])
          : "No story beats yet",
      };
    })
    .sort((a, b) => {
      if (b.overdueStorybeats !== a.overdueStorybeats) {
        return b.overdueStorybeats - a.overdueStorybeats;
      }
      if (b.staleCheckins !== a.staleCheckins) {
        return Number(b.staleCheckins) - Number(a.staleCheckins);
      }
      return a.owner.localeCompare(b.owner);
    });
}

function renderOwnerRhythm(filtered) {
  if (!selectors.ownerRhythmList || !selectors.ownerRhythmSummary) return;
  const rhythm = buildOwnerRhythm(filtered);
  selectors.ownerRhythmList.innerHTML = "";

  if (!rhythm.length) {
    const item = document.createElement("li");
    item.className = "owner-rhythm-item";
    item.innerHTML =
      "<strong>No owners in view.</strong><div class=\"owner-rhythm-meta muted\">Add outcomes to track check-in rhythm.</div>";
    selectors.ownerRhythmList.appendChild(item);
    selectors.ownerRhythmSummary.textContent = "0 owners · 0 with stale check-ins";
    return;
  }

  const staleCount = rhythm.filter((entry) => entry.staleCheckins).length;
  const overdueCount = rhythm.reduce((sum, entry) => sum + entry.overdueStorybeats, 0);
  selectors.ownerRhythmSummary.textContent = `${rhythm.length} owners · ${staleCount} with stale check-ins · ${overdueCount} story beats overdue`;

  rhythm.slice(0, 6).forEach((entry) => {
    const staleClass = entry.staleCheckins ? "tag alert" : "tag";
    const storyClass = entry.overdueStorybeats ? "tag alert" : "tag";
    const storyLabel = entry.overdueStorybeats
      ? `${entry.overdueStorybeats} overdue`
      : entry.upcomingStorybeats
        ? `${entry.upcomingStorybeats} due soon`
        : "No upcoming beats";

    const item = document.createElement("li");
    item.className = "owner-rhythm-item";
    item.innerHTML = `
      <div>
        <strong>${entry.owner}</strong>
        <div class="owner-rhythm-meta">
          <span>${entry.outcomes} outcomes</span>
          <span>Last check-in: ${entry.lastCheckinLabel}</span>
          <span>Next story: ${entry.nextStoryLabel}</span>
        </div>
      </div>
      <div class="owner-rhythm-tags">
        <span class="${staleClass}">${entry.staleCheckins ? "Check-in stale" : "Check-in current"}</span>
        <span class="${storyClass}">${storyLabel}</span>
      </div>
    `;
    selectors.ownerRhythmList.appendChild(item);
  });
}

function getRiskFlags(item) {
  const flags = [];
  if (!item.evidence || !item.evidence.trim()) {
    flags.push("Missing evidence");
  }
  const daysOld = daysBetween(item.date);
  if (daysOld === null) {
    flags.push("No update date");
  } else if (daysOld > 30) {
    flags.push(`Stale (${daysOld}d)`);
  }
  if (Number(item.confidence) < 70) {
    flags.push(`Low confidence (${Math.round(item.confidence || 0)}%)`);
  }
  if (item.status === "Needs Lift") {
    flags.push("Needs lift");
  }
  return { flags, daysOld };
}

function buildRiskRadar(filtered) {
  const entries = filtered
    .map((item) => {
      const { flags, daysOld } = getRiskFlags(item);
      if (!flags.length) return null;
      const score = flags.length + (daysOld !== null && daysOld > 60 ? 1 : 0);
      return {
        item,
        flags,
        score,
        daysOld: daysOld ?? 0,
      };
    })
    .filter(Boolean);

  const totalFlags = entries.reduce((sum, entry) => sum + entry.flags.length, 0);

  const sorted = entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.daysOld !== a.daysOld) return b.daysOld - a.daysOld;
    return a.item.title.localeCompare(b.item.title);
  });

  return {
    totalAtRisk: entries.length,
    totalFlags,
    entries: sorted.slice(0, 6),
  };
}

function renderRiskRadar(filtered) {
  if (!selectors.riskList) return;
  const radar = buildRiskRadar(filtered);
  selectors.riskList.innerHTML = "";

  if (selectors.riskSummary) {
    const summaryLabel = radar.totalAtRisk
      ? `${radar.totalAtRisk} outcomes flagged · ${radar.totalFlags} total signals`
      : "0 outcomes flagged";
    selectors.riskSummary.textContent = summaryLabel;
  }

  if (!radar.entries.length) {
    const item = document.createElement("li");
    item.className = "risk-item";
    item.innerHTML =
      "<strong>No risks detected.</strong><div class=\"risk-meta muted\">Evidence is fresh and confidence is stable in the current view.</div>";
    selectors.riskList.appendChild(item);
    return;
  }

  radar.entries.forEach((entry) => {
    const { item, flags } = entry;
    const card = document.createElement("li");
    card.className = "risk-item";
    const statusClass = item.status === "Needs Lift" ? "tag alert" : "tag";
    card.innerHTML = `
      <div class="risk-top">
        <div>
          <strong>${item.title}</strong>
          <div class="risk-meta">
            <span>${item.owner || "Unassigned"}</span>
            <span>${formatDate(item.date) || "No update date"}</span>
          </div>
        </div>
        <div class="risk-tags">
          <span class="${statusClass}">${item.status}</span>
          <span class="tag">${Math.round(item.confidence || 0)}% confidence</span>
        </div>
      </div>
      <div class="risk-tags">
        ${flags.map((flag) => `<span class="tag alert">${flag}</span>`).join("")}
      </div>
    `;
    selectors.riskList.appendChild(card);
  });
}

function buildBrief(filtered) {
  const total = filtered.length;
  const onTrack = filtered.filter((item) => item.status === "On Track").length;
  const watching = filtered.filter((item) => item.status === "Watching").length;
  const needsLift = filtered.filter((item) => item.status === "Needs Lift").length;
  const avgConfidence =
    filtered.reduce((totalValue, item) => totalValue + Number(item.confidence || 0), 0) /
      Math.max(total, 1) ||
    0;

  const mostRecent = filtered
    .map((item) => item.date)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];

  const topConfidence = [...filtered]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  const attentionItems = filtered
    .filter((item) => item.status === "Needs Lift")
    .slice(0, 3);

  const today = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const highlightLines = topConfidence.length
    ? topConfidence.map(
        (item) =>
          `- ${item.title} (${item.owner} · ${item.metric} · ${item.confidence}% confidence)`
      )
    : ["- No outcomes match the current filters yet."];

  const attentionLines = attentionItems.length
    ? attentionItems.map(
        (item) => `- ${item.title} (${item.owner} · ${item.metric})`
      )
    : ["- No items flagged as Needs Lift in the current view."];

  return [
    `Outcome Atlas Brief — ${today}`,
    `Scope: ${total} outcomes | On Track ${onTrack} | Watching ${watching} | Needs Lift ${needsLift}`,
    `Average evidence confidence: ${Math.round(avgConfidence)}%`,
    `Most recent evidence: ${mostRecent ? formatDate(mostRecent) : "No dates logged"}`,
    "",
    "Highlights",
    ...highlightLines,
    "",
    "Attention Needed",
    ...attentionLines,
  ].join("\n");
}

function renderBrief(filtered) {
  const brief = buildBrief(filtered);
  selectors.briefOutput.value = brief;
  selectors.briefMeta.textContent = `${filtered.length} outcomes in view · updated ${new Date().toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function getFilteredOutcomes() {
  const searchTerm = selectors.search.value.toLowerCase();
  const category = selectors.filterCategory.value;
  const status = selectors.filterStatus.value;
  const sortBy = selectors.sortBy.value;

  let filtered = outcomes.filter((item) => {
    const matchesSearch = [
      item.title,
      item.owner,
      item.metric,
      item.story,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm);

    const matchesCategory = category === "all" || item.category === category;
    const matchesStatus = status === "all" || item.status === status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (sortBy === "confidence") {
    filtered = filtered.sort((a, b) => b.confidence - a.confidence);
  } else {
    filtered = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return filtered;
}

function renderOutcomes() {
  const filtered = getFilteredOutcomes();
  renderStats(filtered);
  renderHealth(filtered);
  renderCadence(filtered);
  renderOwnerLoad(filtered);
  renderOwnerRhythm(filtered);
  renderRiskRadar(filtered);
  renderBrief(filtered);
  populateCheckinOutcomes();
  renderCheckins();
  toggleCheckinAvailability();
  populateStorybeatOutcomes();
  renderStorybeats();
  toggleStorybeatAvailability();

  selectors.list.innerHTML = "";
  selectors.timeline.innerHTML = "";

  filtered.forEach((item) => {
    const card = document.createElement("article");
    card.className = "outcome-card";
    card.innerHTML = `
      <div class="outcome-top">
        <div>
          <p class="outcome-title">${item.title}</p>
          <p class="muted">${item.story || "Add a narrative note for context."}</p>
        </div>
        <span class="badge ${item.status === "Needs Lift" ? "" : "teal"}">${item.status}</span>
      </div>
      <div class="card-meta">
        <span>Category: <strong>${item.category}</strong></span>
        <span>Metric: <strong>${item.metric}</strong></span>
        <span>Owner: <strong>${item.owner}</strong></span>
      </div>
      <div class="card-footer">
        <span>Evidence confidence: ${item.confidence}%</span>
        <span>Last update: ${formatDate(item.date)}</span>
        ${
          item.evidence
            ? `<a class="evidence-link" href="${item.evidence}" target="_blank" rel="noreferrer">Evidence link</a>`
            : ""
        }
      </div>
    `;
    selectors.list.appendChild(card);

    const timelineItem = document.createElement("div");
    timelineItem.className = "timeline-item";
    timelineItem.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <span> · ${item.owner}</span>
      </div>
      <span>${formatDate(item.date)}</span>
    `;
    selectors.timeline.appendChild(timelineItem);
  });
}

function toggleCheckinAvailability() {
  if (!selectors.checkinForm) return;
  const hasOutcomes = outcomes.length > 0;
  const helper = document.querySelector("#checkin-empty");
  if (helper) {
    helper.textContent = hasOutcomes
      ? "Log evidence touchpoints to keep momentum visible."
      : "Add outcomes to enable check-ins.";
  }
  selectors.checkinForm
    .querySelectorAll("input, select, textarea, button")
    .forEach((input) => {
      input.disabled = !hasOutcomes;
    });
  selectors.checkinForm.classList.toggle("is-disabled", !hasOutcomes);
}

function toggleStorybeatAvailability() {
  if (!selectors.storyForm) return;
  const hasOutcomes = outcomes.length > 0;
  const helper = document.querySelector("#story-empty");
  if (helper) {
    helper.textContent = hasOutcomes
      ? "Queue narrative beats for partner and leadership updates."
      : "Add outcomes to enable story beats.";
  }
  selectors.storyForm
    .querySelectorAll("input, select, textarea, button")
    .forEach((input) => {
      input.disabled = !hasOutcomes;
    });
  selectors.storyForm.classList.toggle("is-disabled", !hasOutcomes);
}

selectors.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const newOutcome = {
    id: crypto.randomUUID(),
    title: document.querySelector("#title").value.trim(),
    category: document.querySelector("#category").value,
    status: document.querySelector("#status").value,
    metric: document.querySelector("#metric").value.trim(),
    owner: document.querySelector("#owner").value.trim(),
    confidence: Number(document.querySelector("#confidence").value),
    date: document.querySelector("#date").value,
    evidence: document.querySelector("#evidence").value.trim(),
    story: document.querySelector("#story").value.trim(),
  };

  persistOutcome(newOutcome);
  selectors.form.reset();
  document.querySelector("#confidence").value = 76;
  setDefaultDate();
});

[selectors.search, selectors.filterCategory, selectors.filterStatus, selectors.sortBy].forEach(
  (input) => input.addEventListener("input", renderOutcomes)
);

selectors.exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(outcomes, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "outcome-atlas-export.json";
  anchor.click();
  URL.revokeObjectURL(url);
});

selectors.seedButton.addEventListener("click", async () => {
  await seedDemoOutcomes();
});

selectors.briefGenerate.addEventListener("click", () => {
  renderBrief(getFilteredOutcomes());
});

selectors.briefCopy.addEventListener("click", async () => {
  const text = selectors.briefOutput.value.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    selectors.briefCopy.textContent = "Copied";
    setTimeout(() => {
      selectors.briefCopy.textContent = "Copy brief";
    }, 1600);
  } catch (error) {
    console.warn("Clipboard unavailable", error);
  }
});

if (selectors.checkinForm) {
  selectors.checkinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectors.checkinOutcome.value) return;
    const linked = outcomes.find(
      (item) => item.id === selectors.checkinOutcome.value
    );
    const delta = Number(selectors.checkinDelta.value || 0);
    const nextConfidence = linked
      ? clampConfidence(Number(linked.confidence || 0) + delta)
      : null;

    const newCheckin = {
      id: crypto.randomUUID(),
      outcome_id: selectors.checkinOutcome.value,
      update_date: selectors.checkinDate.value,
      momentum: selectors.checkinMomentum.value,
      confidence_delta: delta,
      note: selectors.checkinNote.value.trim(),
      next_step: selectors.checkinNextStep.value.trim(),
      outcome_title: linked?.title,
      outcome_owner: linked?.owner,
    };
    persistCheckin(newCheckin);
    if (linked) {
      updateOutcomeFields(linked.id, {
        date: newCheckin.update_date,
        confidence: nextConfidence,
      });
    }
    selectors.checkinForm.reset();
    selectors.checkinDelta.value = 0;
    selectors.checkinMomentum.value = "Steady";
    setDefaultDate();
  });
}

if (selectors.storyForm) {
  selectors.storyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectors.storyOutcome.value) return;
    const linked = outcomes.find(
      (item) => item.id === selectors.storyOutcome.value
    );

    const newStorybeat = {
      id: crypto.randomUUID(),
      outcome_id: selectors.storyOutcome.value,
      audience: selectors.storyAudience.value,
      headline: selectors.storyHeadline.value.trim(),
      proof_point: selectors.storyProof.value.trim(),
      next_move: selectors.storyNext.value.trim(),
      scheduled_date: selectors.storyDate.value,
      owner: linked?.owner || null,
      outcome_title: linked?.title,
      outcome_owner: linked?.owner,
    };
    persistStorybeat(newStorybeat);
    selectors.storyForm.reset();
    selectors.storyAudience.value = "Leadership";
    setDefaultDate();
  });
}

async function boot() {
  setDefaultDate();
  await initializeOutcomes();
  await initializeCheckins();
  await initializeStorybeats();
}

boot();
