(() => {
  "use strict";

  const el = (id) => document.getElementById(id);
  const apiUrl = (path) => new URL(`./api/${path.replace(/^\//, "")}`, window.location.href);
  let activeJob = null;
  let pollHandle = null;

  async function request(path, options = {}) {
    const response = await fetch(apiUrl(path), {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof body === "object" ? body.detail : body;
      throw new Error(message || `Request failed with HTTP ${response.status}`);
    }
    return body;
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
  }

  function setHealth(ok, detail) {
    el("health-dot").className = `dot ${ok ? "dot--ok" : "dot--error"}`;
    el("health-label").textContent = ok ? "Service ready" : "Service unavailable";
    el("health-detail").textContent = detail;
  }

  function renderJob(job) {
    activeJob = job;
    el("empty-state").hidden = true;
    el("job-card").hidden = false;
    el("job-status").textContent = job.status;
    el("job-status").dataset.status = job.status;
    el("job-id").textContent = job.id;
    el("job-created").textContent = formatDate(job.created_at_utc);
    el("job-year").textContent = job.options.year;
    el("job-max").textContent = Number(job.options.max_results).toLocaleString();
    el("job-completed").textContent = formatDate(job.completed_at_utc);
    el("job-error").hidden = !job.error;
    el("job-error").textContent = job.error || "";
    const artifactsReady = Boolean(job.artifacts && (job.artifacts.digest || job.artifacts.results));
    el("artifact-actions").hidden = !artifactsReady;
    el("view-digest").disabled = !(job.artifacts && job.artifacts.digest);
    el("view-results").disabled = !(job.artifacts && job.artifacts.results);
    const running = ["queued", "running"].includes(job.status);
    el("run-button").disabled = running;
    if (running && !pollHandle) pollHandle = window.setInterval(refreshLatest, 3000);
    if (!running && pollHandle) {
      window.clearInterval(pollHandle);
      pollHandle = null;
    }
  }

  async function refreshLatest() {
    try {
      const job = await request("jobs/latest");
      renderJob(job);
    } catch (error) {
      if (String(error.message).includes("No Pilot 3 jobs")) {
        el("empty-state").hidden = false;
        el("job-card").hidden = true;
        return;
      }
      el("form-message").textContent = error.message;
      el("form-message").className = "message message--error";
    }
  }

  async function startRun(event) {
    event.preventDefault();
    const button = el("run-button");
    button.disabled = true;
    el("form-message").textContent = "Submitting the run…";
    el("form-message").className = "message";
    const payload = {
      year: Number(el("year").value),
      max_results: Number(el("max-results").value),
      email_k: Number(el("email-k").value),
      recipient_name: el("recipient-name").value,
      subject: el("subject").value,
      summarize: el("summarize").checked,
      include_google_scholar: el("scholar").checked,
      include_map: el("map").checked,
      model: "openrouter/elephant-alpha",
      scholar_pages: 2,
      scholar_num: 10,
    };
    try {
      const job = await request("jobs", { method: "POST", body: JSON.stringify(payload) });
      renderJob(job);
      el("form-message").textContent = "Run accepted. Status will refresh automatically.";
    } catch (error) {
      button.disabled = false;
      el("form-message").textContent = error.message;
      el("form-message").className = "message message--error";
    }
  }

  function clearResults() {
    el("digest-output").textContent = "";
    el("paper-list").replaceChildren();
    el("results-summary").replaceChildren();
  }

  async function showDigest() {
    if (!activeJob) return;
    clearResults();
    try {
      const digest = await request(`jobs/${activeJob.id}/digest`, { headers: { Accept: "text/plain" } });
      el("results-title").textContent = "Latest digest";
      el("digest-output").hidden = false;
      el("digest-output").textContent = digest;
      el("results-panel").hidden = false;
      el("results-panel").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      el("form-message").textContent = error.message;
    }
  }

  function paperCard(paper) {
    const card = document.createElement("article");
    card.className = "paper-card";
    const title = document.createElement("h3");
    title.textContent = paper.title || "Untitled";
    const meta = document.createElement("p");
    meta.textContent = [paper.publication_date, paper.venue, paper.document_type].filter(Boolean).join(" · ");
    card.append(title, meta);
    const href = paper.url || paper.landing_url || paper.doi;
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open source";
      card.append(link);
    }
    return card;
  }

  async function showResults() {
    if (!activeJob) return;
    clearResults();
    try {
      const results = await request(`jobs/${activeJob.id}/results`);
      el("results-title").textContent = "Ranked research";
      el("digest-output").hidden = true;
      const papers = results.global_highlights || [];
      const summary = document.createElement("p");
      summary.textContent = `${papers.length} OpenAlex highlights · ${(results.google_scholar_top5 || []).length} Google Scholar highlights`;
      el("results-summary").append(summary);
      papers.forEach((paper) => el("paper-list").append(paperCard(paper)));
      el("results-panel").hidden = false;
      el("results-panel").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      el("form-message").textContent = error.message;
    }
  }

  async function initialize() {
    try {
      const [health, ready, config] = await Promise.all([
        request("health"),
        request("ready"),
        request("config"),
      ]);
      setHealth(health.status === "ok" && ready.status === "ready", ready.status.replace("_", " "));
      el("year").value = config.target_year;
      el("max-results").value = config.default_max_results;
      el("version-label").textContent = `Service version ${health.version}`;
    } catch (error) {
      setHealth(false, error.message);
    }
    await refreshLatest();
  }

  el("run-form").addEventListener("submit", startRun);
  el("refresh-button").addEventListener("click", refreshLatest);
  el("view-digest").addEventListener("click", showDigest);
  el("view-results").addEventListener("click", showResults);
  el("close-results").addEventListener("click", () => { el("results-panel").hidden = true; });
  initialize();
})();
