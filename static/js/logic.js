/* ============================================================
   JOB HUNTER — vanilla JS
   ------------------------------------------------------------
   This file is UI + interaction only. Every place your backend
   should plug in is marked with "BACKEND:" — swap the mock
   functions for real fetch() calls to your API.

   Filtering/sorting happens entirely client-side over state.jobs.
   If you'd rather filter server-side, send match/missing/sort
   params to your API instead (see handleSearch below).
   ============================================================ */

// ---- Mock state (replace with data from your backend) --------
let state = {
  resume: {
    fileName: "resume_backend_2025.pdf",
    status: "active",        // 'active' | 'processing' | 'error'
    skillsCount: 18,
    updatedAt: "2 days ago",
  },
  jobs: [
    {
      id: "job-1",
      title: "Senior backend engineer",
      company: "Stripe",
      location: "remote",
      matchScore: 92,
      missingSkills: ["Kubernetes", "GraphQL"],
      saved: false,
    },
    {
      id: "job-2",
      title: "Backend developer",
      company: "Razorpay",
      location: "Pune",
      matchScore: 85,
      missingSkills: ["AWS"],
      saved: false,
    },
    {
      id: "job-3",
      title: "API engineer",
      company: "Zerodha",
      location: "remote",
      matchScore: 61,
      missingSkills: ["React", "TypeScript", "3+ yrs exp"],
      saved: false,
    },
    {
      id: "job-4",
      title: "Platform engineer",
      company: "Freshworks",
      location: "remote",
      matchScore: 78,
      missingSkills: ["Terraform"],
      saved: false,
    },
    {
      id: "job-5",
      title: "Backend engineer",
      company: "CRED",
      location: "Bengaluru",
      matchScore: 95,
      missingSkills: [],
      saved: false,
    },
  ],
  totalCount: 24,
  loading: false,
  searching: false,
  uploadingResume: false,
  filters: {
    match: "all",       // 'all' | 'strong' | 'partial' | 'weak'
    missing: "all",     // 'all' | 'none' | 'has'
    sort: "match-desc", // 'match-desc' | 'match-asc' | 'title-asc'
  },
};

// ---- Icons (inline SVG strings, Lucide-style) -----------------
const ICONS = {
  fileText: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`,
  refresh: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>`,
  externalLink: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>`,
  bookmark: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  x: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
};

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function matchTier(score) {
  if (score >= 80) return { cls: "badge-green", key: "strong" };
  if (score >= 60) return { cls: "badge-amber", key: "partial" };
  return { cls: "badge-red", key: "weak" };
}

// ---- Filtering + sorting (client-side) -----------------------
function getVisibleJobs() {
  const { match, missing, sort } = state.filters;

  let jobs = state.jobs.filter((job) => {
    if (match !== "all" && matchTier(job.matchScore).key !== match) return false;
    if (missing === "none" && job.missingSkills.length > 0) return false;
    if (missing === "has" && job.missingSkills.length === 0) return false;
    return true;
  });

  jobs = jobs.slice().sort((a, b) => {
    if (sort === "match-desc") return b.matchScore - a.matchScore;
    if (sort === "match-asc") return a.matchScore - b.matchScore;
    if (sort === "title-asc") return a.title.localeCompare(b.title);
    return 0;
  });

  return jobs;
}

function sortLabelText() {
  const map = {
    "match-desc": "Sorted by match score (high to low)",
    "match-asc": "Sorted by match score (low to high)",
    "title-asc": "Sorted by job title (A–Z)",
  };
  return map[state.filters.sort];
}

// ---- Render: resume card ---------------------------------------
function renderResume() {
  const el = document.getElementById("resume-card");
  const r = state.resume;

  if (!r) {
    el.innerHTML = `
      <div class="resume-card empty">
        <div class="resume-left">
          <div class="resume-icon">${ICONS.fileText}</div>
          <div>
            <p class="name">No resume on file</p>
            <p class="resume-meta">Upload a resume so we can match you to jobs</p>
          </div>
        </div>
        <button class="btn btn-primary" id="upload-resume-btn">
          ${ICONS.fileText} Upload resume
        </button>
      </div>`;
    document.getElementById("upload-resume-btn").addEventListener("click", () => {
      document.getElementById("resume-file-input").click();
    });
    return;
  }

  const statusMap = {
    active: { cls: "badge-green", label: "Active for match" },
    processing: { cls: "badge-amber", label: "Processing…" },
    error: { cls: "badge-red", label: "Couldn't parse" },
  };
  const s = statusMap[r.status] || statusMap.active;

  el.innerHTML = `
    <div class="resume-card">
      <div class="resume-left">
        <div class="resume-icon">${ICONS.fileText}</div>
        <div>
          <div class="resume-title-row">
            <p class="name">${escapeHtml(r.fileName)}</p>
            <span class="badge ${s.cls}">${s.label}</span>
          </div>
          <p class="resume-meta">Parsed ${r.skillsCount} core technical skills • Last updated ${r.updatedAt}</p>
        </div>
      </div>
      <button class="btn btn-outline" id="update-resume-btn" ${state.uploadingResume ? "disabled" : ""}>
        <span class="${state.uploadingResume ? "icon-spin" : ""}">${ICONS.refresh}</span>
        ${state.uploadingResume ? "Uploading…" : "Update resume"}
      </button>
    </div>`;
  document.getElementById("update-resume-btn").addEventListener("click", () => {
    document.getElementById("resume-file-input").click();
  });
}

// ---- Render: job list --------------------------------------------
function jobCardHtml(job) {
  const tier = matchTier(job.matchScore);
  const missingHtml = job.missingSkills.length
    ? `<div class="missing-skills">
        ${job.missingSkills.map(s => `<span class="missing-pill">${ICONS.x} Missing: ${escapeHtml(s)}</span>`).join("")}
       </div>`
    : "";

  return `
    <div class="job-card" data-job-id="${job.id}">
      <div class="job-card-top">
        <div>
          <h3>${escapeHtml(job.title)}</h3>
          <p class="job-sub">${escapeHtml(job.company)} — ${escapeHtml(job.location)}</p>
        </div>
        <span class="match-pill ${tier.cls}">${job.matchScore}% match</span>
      </div>
      ${missingHtml}
      <div class="job-actions">
        <button class="btn btn-primary apply-btn">Apply ${ICONS.externalLink}</button>
        <button class="btn btn-outline details-btn">View details</button>
        <button class="btn btn-outline ${job.saved ? "saved" : ""} save-btn">
          ${job.saved ? ICONS.check : ICONS.bookmark} ${job.saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>`;
}

function skeletonCardHtml() {
  return `
    <div class="skeleton-card">
      <div class="job-card-top">
        <div style="width:60%">
          <div class="sk-line" style="height:20px;width:50%;margin-bottom:8px;"></div>
          <div class="sk-line" style="height:14px;width:35%;"></div>
        </div>
        <div class="sk-line" style="height:28px;width:90px;border-radius:999px;"></div>
      </div>
      <div class="job-actions">
        <div class="sk-line" style="height:40px;width:90px;border-radius:8px;"></div>
        <div class="sk-line" style="height:40px;width:110px;border-radius:8px;"></div>
        <div class="sk-line" style="height:40px;width:90px;border-radius:8px;"></div>
      </div>
    </div>`;
}

function renderJobs() {
  const listEl = document.getElementById("job-list");
  const countEl = document.getElementById("results-count");
  const sortLabelEl = document.getElementById("sort-label");

  sortLabelEl.textContent = sortLabelText();

  if (state.loading) {
    countEl.textContent = "Searching…";
    listEl.innerHTML = skeletonCardHtml() + skeletonCardHtml() + skeletonCardHtml();
    return;
  }

  const visibleJobs = getVisibleJobs();
  const filtersActive =
    state.filters.match !== "all" || state.filters.missing !== "all";

  countEl.textContent = filtersActive
    ? `${visibleJobs.length} of ${state.totalCount} jobs shown`
    : `${state.totalCount} job${state.totalCount === 1 ? "" : "s"} found`;

  if (visibleJobs.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p class="title">No jobs match these filters</p>
        <p class="sub">Try widening your match range or clearing the missing-skills filter.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = visibleJobs.map(jobCardHtml).join("");

  // Wire up per-card buttons
  visibleJobs.forEach((job) => {
    const card = listEl.querySelector(`[data-job-id="${job.id}"]`);
    card.querySelector(".apply-btn").addEventListener("click", () => handleApply(job.id));
    card.querySelector(".details-btn").addEventListener("click", () => handleViewDetails(job.id));
    card.querySelector(".save-btn").addEventListener("click", () => handleToggleSave(job.id));
  });
}

function renderAll() {
  renderResume();
  renderJobs();

  const btn = document.getElementById("search-btn");
  const label = document.getElementById("search-btn-label");
  btn.disabled = state.searching;
  label.textContent = state.searching ? "Searching…" : "Search";
}

// ---- Event handlers (BACKEND integration points) ------------------

// BACKEND: replace with real search API call
async function handleSearch(role, location) {
  state.searching = true;
  state.loading = true;
  renderAll();

  // Example real call:
  // const res = await fetch(`/api/jobs?role=${encodeURIComponent(role)}&location=${encodeURIComponent(location)}`);
  // const data = await res.json();
  // state.jobs = data.jobs;
  // state.totalCount = data.totalCount;

  await mockDelay(700); // simulate network
  // mock: no-op, keep same jobs
  state.searching = false;
  state.loading = false;
  renderAll();
}

// BACKEND: replace with real resume upload
async function handleResumeUpload(file) {
  state.uploadingResume = true;
  renderAll();

  // Example real call:
  // const formData = new FormData();
  // formData.append("resume", file);
  // const res = await fetch("/api/resume", { method: "POST", body: formData });
  // state.resume = await res.json();

  await mockDelay(900);
  state.resume = {
    fileName: file.name,
    status: "active",
    skillsCount: state.resume?.skillsCount ?? 18,
    updatedAt: "just now",
  };
  state.uploadingResume = false;
  renderAll();
  // Optionally re-run search since matches may have changed:
  // handleSearch(document.getElementById("role-input").value, document.getElementById("location-input").value);
}

// BACKEND: replace with real apply tracking / redirect
function handleApply(jobId) {
  // Example:
  // fetch(`/api/jobs/${jobId}/apply`, { method: "POST" });
  // window.open(`/api/jobs/${jobId}/redirect`, "_blank");
  console.log("Apply clicked for", jobId);
}

// BACKEND: replace with real navigation / detail fetch
function handleViewDetails(jobId) {
  // Example: window.location.href = `/jobs/${jobId}`;
  console.log("View details clicked for", jobId);
}

// BACKEND: replace with real save/unsave call
function handleToggleSave(jobId) {
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return;
  job.saved = !job.saved;

  // Example:
  // fetch(`/api/jobs/${jobId}/save`, { method: job.saved ? "POST" : "DELETE" });

  renderJobs();
}

// ---- Filter/sort handlers (client-side; see file header for server-side option)
function handleFilterChange() {
  state.filters.match = document.getElementById("match-filter").value;
  state.filters.missing = document.getElementById("missing-filter").value;
  state.filters.sort = document.getElementById("sort-select").value;
  renderJobs();
}

function handleClearFilters() {
  state.filters = { match: "all", missing: "all", sort: "match-desc" };
  document.getElementById("match-filter").value = "all";
  document.getElementById("missing-filter").value = "all";
  document.getElementById("sort-select").value = "match-desc";
  renderJobs();
}

function mockDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Wire up static controls --------------------------------------
document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const role = document.getElementById("role-input").value;
  const location = document.getElementById("location-input").value;
  handleSearch(role, location);
});

document.getElementById("resume-file-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleResumeUpload(file);
  e.target.value = "";
});

document.getElementById("match-filter").addEventListener("change", handleFilterChange);
document.getElementById("missing-filter").addEventListener("change", handleFilterChange);
document.getElementById("sort-select").addEventListener("change", handleFilterChange);
document.getElementById("clear-filters-btn").addEventListener("click", handleClearFilters);

// ---- Initial render -------------------------------------------------
renderAll();