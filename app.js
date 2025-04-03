const STORAGE_KEY = "gs_outcome_atlas_v1";
const API_ENDPOINT = "/api/outcomes";

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
  },
];

const selectors = {
  list: document.querySelector("#outcome-list"),
  timeline: document.querySelector("#timeline"),
  form: document.querySelector("#outcome-form"),
  search: document.querySelector("#search"),
  filterCategory: document.querySelector("#filter-category"),
  filterStatus: document.querySelector("#filter-status"),
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
  exportButton: document.querySelector("#export-json"),
  seedButton: document.querySelector("#seed-demo"),
  briefOutput: document.querySelector("#brief-output"),
  briefMeta: document.querySelector("#brief-meta"),
  briefGenerate: document.querySelector("#generate-brief"),
  briefCopy: document.querySelector("#copy-brief"),
  syncStatus: document.querySelector("#sync-status"),
};

let outcomes = [];
let remoteAvailable = false;

function setDefaultDate() {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.querySelector("#date");
  if (dateInput) {
    dateInput.value = today;
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

function saveOutcomes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(outcomes));
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
  renderBrief(filtered);

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

setDefaultDate();
initializeOutcomes();
