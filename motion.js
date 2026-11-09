const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const reloaded = performance.getEntriesByType("navigation")[0]?.type === "reload";

function pinTop() {
  const root = document.documentElement;
  root.style.scrollBehavior = "auto";
  scrollTo(0, 0);
  root.style.scrollBehavior = "";
  const el = document.activeElement;
  if (el && el !== document.body && el !== root) el.blur();
}

if (reloaded || !location.hash) pinTop();
addEventListener("pageshow", (event) => {
  if (event.persisted) return;
  if (reloaded || !location.hash) pinTop();
});
addEventListener("load", () => {
  if (reloaded || !location.hash) pinTop();
});

document.querySelectorAll(".section-head, .case, .offers li, .roles li, .skills, .stage, .store, form").forEach((el) => {
  el.classList.add("reveal");
});

const seen = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const delay = Math.min(entry.boundingClientRect.top, 480) / 480 * 180;
    entry.target.style.transitionDelay = delay + "ms";
    entry.target.classList.add("in");
    seen.unobserve(entry.target);
  });
}, { threshold: 0.08, rootMargin: "0px 0px 8% 0px" });

document.querySelectorAll(".reveal").forEach((el) => seen.observe(el));
if (reduce) document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));

const progress = document.getElementById("progress");
const nav = document.querySelector(".nav");
const links = [...document.querySelectorAll(".nav nav a")];

function onScroll() {
  const root = document.documentElement;
  const max = root.scrollHeight - root.clientHeight;
  progress.style.transform = "scaleX(" + (max ? root.scrollTop / max : 0) + ")";
  nav.classList.toggle("stuck", root.scrollTop > 8);
  const mark = root.scrollTop + 120;
  let current = links[0];
  links.forEach((link) => {
    const id = link.getAttribute("href").slice(1);
    const section = document.getElementById(id);
    if (section && section.offsetTop <= mark) current = link;
  });
  links.forEach((link) => link.setAttribute("aria-current", link === current ? "true" : "false"));
}

addEventListener("scroll", onScroll, { passive: true });
onScroll();

const rows = [
  { provider: "Northline", raw: "truck 184 · 84.20 gal diesel", norm: "Truck 184 · 84.20 gal · $312.40" },
  { provider: "Harbor", raw: "card 9021 · USD 128.00 fuel", norm: "Card 9021 · 31.40 gal · $128.00" },
  { provider: "Fieldline", raw: "unit 17 · fuel 22.10", norm: "Unit 17 · 22.10 gal · $86.55" },
  { provider: "Keystone", raw: "441 · 12.4g unleaded · 46.18", norm: "Card 441 · 12.40 gal · $46.18" }
];

const qa = [
  { a: "Two card programs settle in the nightly batch. One posts within the hour.", source: "Settlement notes.pdf · page 2" },
  { a: "Idle time over five minutes is flagged for review.", source: "Settlement notes.pdf · page 4" },
  { a: "Every answer stays attached to the file it came from.", source: "Settlement notes.pdf · page 1" }
];

const rideStates = [
  { at: 0, status: "Request sent", detail: "Looking for a driver nearby." },
  { at: 0.28, status: "Driver assigned", detail: "The driver is 4 minutes away." },
  { at: 0.62, status: "On the way", detail: "Live location is updating." },
  { at: 0.92, status: "Arrived", detail: "The car is at the pickup point." }
];

const ledger = document.getElementById("ledger");
const unified = document.getElementById("unified");
const answerText = document.getElementById("answer-text");
const answerSource = document.getElementById("answer-source");
const rideStatus = document.getElementById("ride-status");
const rideDetail = document.getElementById("ride-detail");
const car = document.getElementById("car");
const askButtons = [...document.querySelectorAll(".ask button")];

const route = document.querySelector(".route path");
let scene = "fleet";
let fleetTimer = 0;
let typeTimer = 0;
let docTimer = 0;
let rideFrame = 0;
let rowIndex = 0;
let docIndex = 0;
let unifiedCount = 0;
let holdUntil = 0;

function showScene(name) {
  scene = name;
  document.querySelectorAll("[data-scene]").forEach((tab) => {
    const on = tab.dataset.scene === name;
    tab.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll("[data-scene-panel]").forEach((panel) => {
    const on = panel.dataset.scenePanel === name;
    panel.classList.toggle("on", on);
    panel.setAttribute("aria-hidden", on ? "false" : "true");
  });
  clearInterval(fleetTimer);
  clearInterval(typeTimer);
  clearInterval(docTimer);
  cancelAnimationFrame(rideFrame);
  if (name === "fleet") runFleet();
  if (name === "docs") runDocs();
  if (name === "ride") runRide();
}

function runFleet() {
  const step = () => {
    if (scene !== "fleet") return;
    const item = rows[rowIndex % rows.length];
    rowIndex += 1;
    document.querySelectorAll(".providers span").forEach((pill) => {
      pill.classList.toggle("on", pill.dataset.provider === item.provider);
    });
    const entry = document.createElement("article");
    entry.className = "entry";
    entry.innerHTML = "<header><b></b><em></em></header><p class=\"norm\"></p>";
    entry.querySelector("b").textContent = item.provider;
    entry.querySelector("em").textContent = item.raw;
    entry.querySelector(".norm").textContent = item.norm;
    ledger.prepend(entry);
    unifiedCount += 1;
    unified.textContent = unifiedCount + (unifiedCount === 1 ? " record" : " records") + " written to one schema";
    setTimeout(() => entry.classList.add("settled"), reduce ? 0 : 420);
    while (ledger.children.length > 4) ledger.lastElementChild.remove();
  };
  step();
  if (!reduce) fleetTimer = setInterval(step, 1400);
}

function showAnswer(index) {
  docIndex = index;
  const item = qa[index];
  askButtons.forEach((button, buttonIndex) => button.classList.toggle("on", buttonIndex === index));
  answerSource.textContent = item.source;
  if (reduce) {
    answerText.textContent = item.a;
    return;
  }
  answerText.textContent = "";
  let cursor = 0;
  clearInterval(typeTimer);
  typeTimer = setInterval(() => {
    cursor += 1;
    answerText.textContent = item.a.slice(0, cursor);
    if (cursor >= item.a.length) clearInterval(typeTimer);
  }, 16);
}

function runDocs() {
  showAnswer(docIndex % qa.length);
  if (reduce) return;
  docTimer = setInterval(() => {
    if (scene !== "docs" || Date.now() < holdUntil) return;
    showAnswer((docIndex + 1) % qa.length);
  }, 4200);
}

function runRide() {
  const length = route.getTotalLength();
  const started = performance.now();
  const loop = (now) => {
    if (scene !== "ride") return;
    const progress = ((now - started) % 9000) / 9000;
    const point = route.getPointAtLength((reduce ? 0.62 : progress) * length);
    car.setAttribute("cx", point.x);
    car.setAttribute("cy", point.y);
    const state = rideStates.reduce((picked, item) => (progress >= item.at ? item : picked), rideStates[0]);
    rideStatus.textContent = state.status;
    rideDetail.textContent = state.detail;
    if (!reduce) rideFrame = requestAnimationFrame(loop);
  };
  rideFrame = requestAnimationFrame(loop);
}

document.querySelectorAll("[data-scene]").forEach((tab) => {
  tab.addEventListener("click", () => {
    holdUntil = Date.now() + 12000;
    showScene(tab.dataset.scene);
  });
});

askButtons.forEach((button) => {
  button.addEventListener("click", () => {
    holdUntil = Date.now() + 12000;
    showAnswer(Number(button.dataset.q));
  });
});

if (!reduce) {
  setInterval(() => {
    if (Date.now() < holdUntil) return;
    const order = ["fleet", "docs", "ride"];
    showScene(order[(order.indexOf(scene) + 1) % order.length]);
  }, 9000);
}

showScene("fleet");

const roleEl = document.getElementById("role");
const roles = ["AI agents", "AI automation", "mobile apps", "dashboards"];
let roleIndex = 0;
if (roleEl && !reduce) {
  setInterval(() => {
    roleEl.classList.add("out");
    setTimeout(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      roleEl.textContent = roles[roleIndex];
      roleEl.classList.remove("out");
    }, 280);
  }, 2400);
}

document.getElementById("brief").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = data.get("name").trim();
  const company = data.get("company").trim();
  const email = data.get("email").trim();
  const brief = data.get("brief").trim();
  const subject = "Project brief from " + name + (company ? " at " + company : "");
  const body = ["Name: " + name, company ? "Company: " + company : "", "Email: " + email, "", brief].filter(Boolean).join("\n");
  location.href = "mailto:shahmeerahmed219@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
});
