const STORAGE_KEY = "design-archive-sections-v1";

const defaultSections = [
  {
    id: "embedded-development",
    kicker: "Field 01",
    title: "Embedded Development",
    items: [
      {
        id: crypto.randomUUID(),
        title: "Laser Cannon Fighting Trolley",
        description: "Autonomous vehicle platform with target tracking, drive control, and real-time embedded coordination.",
        content: "<p>Use this white paper to store the full design process, hardware architecture, control strategy, and experiment notes for the laser cannon fighting trolley.</p>"
      },
      {
        id: crypto.randomUUID(),
        title: "Punching Robot Arm",
        description: "Servo-driven robotic arm project focused on timing, force control, and embedded motion sequencing.",
        content: "<p>Document the structure, actuator selection, control loops, and test observations for the punching robot arm here.</p>"
      },
      {
        id: crypto.randomUUID(),
        title: "Control Glove",
        description: "Wearable input glove used to capture gestures and map hand motion into remote device commands.",
        content: "<p>Write about sensor placement, gesture recognition logic, communication protocol, and user testing for the control glove.</p>"
      }
    ]
  },
  {
    id: "fpga-development",
    kicker: "Field 02",
    title: "FPGA Development",
    items: [
      {
        id: crypto.randomUUID(),
        title: "Three-Stage State Machine",
        description: "Pipeline-oriented FPGA controller built around a three-stage state machine for deterministic sequencing.",
        content: "<p>Capture the module breakdown, timing constraints, state transitions, and verification results for the FPGA design here.</p>"
      }
    ]
  },
  {
    id: "chip-design",
    kicker: "Field 03",
    title: "Chip Design",
    items: [
      {
        id: crypto.randomUUID(),
        title: "8 In / 8 Out Packet Switching",
        description: "Switching architecture study for balanced packet routing with structured input-output arbitration.",
        content: "<p>Use this space for architecture notes, packet scheduling rules, RTL structure, and simulation conclusions.</p>"
      }
    ]
  },
  {
    id: "hardware-design",
    kicker: "Field 04",
    title: "Hardware Design",
    items: [
      {
        id: crypto.randomUUID(),
        title: "Slow-Start Device Schematic",
        description: "Schematic-based hardware design for staged power-up and inrush current control.",
        content: "<p>Describe the schematic choices, component values, start-up curve, and test records for the slow-start device.</p>"
      }
    ]
  },
  {
    id: "other-projects",
    kicker: "Field 05",
    title: "Maintenance",
    items: [
      {
        id: crypto.randomUUID(),
        title: "New Direction",
        description: "Use the plus button to add a new idea, prototype, experiment, or cross-discipline design record.",
        content: "<p>Store the detailed write-up for any additional design work in this page.</p>"
      }
    ]
  }
];

const homeView = document.querySelector("#home-view");
const detailView = document.querySelector("#detail-view");
const cloudSitesButton = document.querySelector("#cloud-sites-button");
const cloudSitesMenu = document.querySelector("#cloud-sites-menu");
const cloudSyncStatus = document.querySelector("#cloud-sync-status");
const sectionList = document.querySelector("#section-list");
const sectionTemplate = document.querySelector("#section-template");
const cardTemplate = document.querySelector("#card-template");
const backButton = document.querySelector("#back-button");
const deleteButton = document.querySelector("#delete-button");
const saveButtonTop = document.querySelector("#save-button-top");
const moveProjectButton = document.querySelector("#move-project-button");
const moveMenu = document.querySelector("#move-menu");
const saveButton = document.querySelector("#save-button");
const bindFolderButton = document.querySelector("#bind-folder-button");
const githubLoginButton = document.querySelector("#github-login-button");
const uploadGitHubButton = document.querySelector("#upload-github-button");
const imageInput = document.querySelector("#image-input");
const insertImageButton = document.querySelector("#insert-image-button");
const detailKicker = document.querySelector("#detail-kicker");
const documentStatus = document.querySelector("#document-status");
const repoSyncStatus = document.querySelector("#repo-sync-status");
const readonlyBanner = document.querySelector("#readonly-banner");
const detailTitle = document.querySelector("#detail-title");
const editorSurface = document.querySelector("#editor-surface");
const fontSizeSelect = document.querySelector("#font-size-select");
const fontColorInput = document.querySelector("#font-color-input");
const toolbarButtons = document.querySelectorAll("[data-command]");
const githubModal = document.querySelector("#github-modal");
const closeGitHubModalButton = document.querySelector("#close-github-modal");
const saveGitHubSettingsButton = document.querySelector("#save-github-settings-button");
const githubOwnerInput = document.querySelector("#github-owner");
const githubRepoInput = document.querySelector("#github-repo");
const githubBranchInput = document.querySelector("#github-branch");
const githubTokenInput = document.querySelector("#github-token");
const ITEMS_PER_PAGE = 8;
const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000;
const HANDLE_DB_NAME = "design-archive-handles";
const HANDLE_STORE_NAME = "handles";
const DIRECTORY_HANDLE_KEY = "export-directory";
const CLOUD_REGISTRY_KEY = "design-archive-cloud-sites-v1";
const PROJECT_DATA_FILE_NAME = "project_data.js";
const CLOUD_SITES_FILE_NAME = "cloud_sites.js";
const GITHUB_SYNC_SETTINGS_KEY = "design-archive-github-sync-v1";
const DEFAULT_GITHUB_SYNC_SETTINGS = {
  owner: "jiaying19362bristol-lab",
  repo: "programs-network-site-001",
  branch: "main",
  token: ""
};
const IS_READONLY_CLOUD = window.location.protocol !== "file:";

let sections = loadSections();
let activeProjectRef = null;
let savedSelection = null;
let saveFeedbackTimeout = null;
let documentDirectoryHandle = null;
let autosaveTimerId = null;
let cloudRegistry = loadCloudRegistry();
let githubSyncSettings = loadGitHubSyncSettings();
const sectionPageState = Object.fromEntries(defaultSections.map((section) => [section.id, 0]));

ensureGitHubSyncSettingsInitialized();

renderSections();
routeFromHash();
initializeDocumentStorage();
startAutosaveTimer();
renderCloudSites();
applyReadonlyMode();
updateGitHubSyncStatus();

window.addEventListener("hashchange", routeFromHash);
cloudSitesButton.addEventListener("click", toggleCloudSitesMenu);
backButton.addEventListener("click", () => {
  if (!IS_READONLY_CLOUD) {
    saveActiveProject();
  }
  window.location.hash = "";
});
if (!IS_READONLY_CLOUD) {
  saveButtonTop.addEventListener("click", saveActiveProject);
  moveProjectButton.addEventListener("click", toggleMoveMenu);
  saveButton.addEventListener("click", saveActiveProject);
  bindFolderButton.addEventListener("click", connectDocumentFolder);
  githubLoginButton.addEventListener("click", openGitHubModal);
  uploadGitHubButton.addEventListener("click", uploadProjectDataToGitHub);
  deleteButton.addEventListener("click", deleteActiveProject);
  imageInput.addEventListener("change", handleImageUpload);
  insertImageButton.addEventListener("click", () => imageInput.click());
  fontSizeSelect.addEventListener("change", () => {
    focusEditor();
    document.execCommand("fontSize", false, fontSizeSelect.value);
  });
  fontColorInput.addEventListener("input", () => {
    focusEditor();
    document.execCommand("foreColor", false, fontColorInput.value);
  });
  toolbarButtons.forEach((button) => {
    button.addEventListener("click", () => {
      focusEditor();
      document.execCommand(button.dataset.command, false);
    });
  });
  editorSurface.addEventListener("mouseup", saveSelection);
  editorSurface.addEventListener("keyup", saveSelection);
  editorSurface.addEventListener("focus", saveSelection);
}
document.addEventListener("click", handleOutsideMoveMenuClick);
document.addEventListener("click", handleOutsideCloudMenuClick);
document.addEventListener("click", handleGitHubModalBackdropClick);
closeGitHubModalButton?.addEventListener("click", closeGitHubModal);
saveGitHubSettingsButton?.addEventListener("click", saveGitHubSettingsFromModal);

function loadSections() {
  if (IS_READONLY_CLOUD) {
    return normalizeSections(getBundledProjectData());
  }

  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return normalizeSections(getBundledProjectData());
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? normalizeSections(parsed) : normalizeSections(getBundledProjectData());
  } catch {
    return normalizeSections(getBundledProjectData());
  }
}

function saveSections() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

function loadCloudRegistry() {
  const bundledSites = normalizeCloudSites(window.__CLOUD_SITES__);
  const saved = localStorage.getItem(CLOUD_REGISTRY_KEY);
  let localSites = [];

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      localSites = normalizeCloudSites(parsed);
    } catch {
      localSites = [];
    }
  }

  const merged = [...bundledSites];
  localSites.forEach((site) => {
    if (!merged.some((entry) => entry.url === site.url)) {
      merged.push(site);
    }
  });

  if (IS_READONLY_CLOUD) {
    const currentCloudSite = {
      url: window.location.href,
      lastUpdatedAt: buildCloudPageTimestamp(),
      repo: extractRepoNameFromCloudUrl(window.location.pathname)
    };

    const existingCurrent = merged.find((entry) => entry.url === currentCloudSite.url);
    if (!existingCurrent) {
      merged.unshift(currentCloudSite);
    } else if (!existingCurrent.lastUpdatedAt) {
      existingCurrent.lastUpdatedAt = currentCloudSite.lastUpdatedAt;
    }
  }

  return merged;
}

function normalizeCloudSites(input) {
  if (Array.isArray(input)) {
    return input.filter(isValidCloudSiteEntry);
  }

  if (input && typeof input === "object" && isValidCloudSiteEntry(input)) {
    return [input];
  }

  return [];
}

function isValidCloudSiteEntry(entry) {
  return Boolean(entry && typeof entry.url === "string" && entry.url.trim());
}

function saveCloudRegistry() {
  localStorage.setItem(CLOUD_REGISTRY_KEY, JSON.stringify(cloudRegistry));
}

function renderSections() {
  sectionList.innerHTML = "";

  sections.forEach((section) => {
    const fragment = sectionTemplate.content.cloneNode(true);
    const element = fragment.querySelector(".board-section");
    const kicker = fragment.querySelector(".section-kicker");
    const title = fragment.querySelector(".section-title");
    const addButton = fragment.querySelector(".add-item-button");
    const grid = fragment.querySelector(".card-grid");
    const footerIndicator = fragment.querySelector(".page-indicator");
    const prevButton = fragment.querySelector('[data-action="prev"]');
    const nextButton = fragment.querySelector('[data-action="next"]');
    const totalPages = Math.max(1, Math.ceil(section.items.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(sectionPageState[section.id] ?? 0, totalPages - 1);
    const pageItems = section.items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

    kicker.textContent = section.kicker;
    title.textContent = section.title;
    addButton.setAttribute("aria-label", `Add new item to ${section.title}`);
    if (!IS_READONLY_CLOUD) {
      addButton.addEventListener("click", () => addItem(section.id));
    } else {
      addButton.disabled = true;
    }
    footerIndicator.textContent = `Page ${currentPage + 1} / ${totalPages}`;
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage >= totalPages - 1;
    prevButton.addEventListener("click", () => changePage(section.id, -1));
    nextButton.addEventListener("click", () => changePage(section.id, 1));
    sectionPageState[section.id] = currentPage;

    pageItems.forEach((item) => {
      grid.appendChild(createCard(section.id, section.title, item));
    });

    sectionList.appendChild(element);
  });
}

function renderCloudSites() {
  cloudSitesMenu.innerHTML = "";

  if (!cloudRegistry.length) {
    const empty = document.createElement("div");
    empty.className = "page-indicator";
    empty.textContent = "No historical cloud sites recorded yet.";
    cloudSitesMenu.appendChild(empty);
    cloudSyncStatus.textContent = "Local-first mode. No cloud sites registered yet.";
    return;
  }

  const sortedSites = [...cloudRegistry].sort((left, right) => {
    return new Date(right.lastUpdatedAt).getTime() - new Date(left.lastUpdatedAt).getTime();
  });

  sortedSites.forEach((entry) => {
    const wrapper = document.createElement("article");
    wrapper.className = "cloud-site-entry";

    const link = document.createElement("a");
    link.className = "cloud-site-link";
    link.href = entry.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = entry.url;

    const meta = document.createElement("p");
    meta.className = "cloud-site-meta";
    meta.textContent = `Last update: ${formatTimestamp(entry.lastUpdatedAt)}`;

    wrapper.appendChild(link);
    wrapper.appendChild(meta);
    cloudSitesMenu.appendChild(wrapper);
  });

  const latest = sortedSites[0];
  cloudSyncStatus.textContent = `Local-first mode. Latest cloud site updated ${formatTimestamp(latest.lastUpdatedAt)}.`;
}

function getBundledProjectData() {
  return Array.isArray(window.__PROJECT_DATA__) ? window.__PROJECT_DATA__ : defaultSections;
}

function loadGitHubSyncSettings() {
  const saved = localStorage.getItem(GITHUB_SYNC_SETTINGS_KEY);
  if (!saved) {
    return { ...DEFAULT_GITHUB_SYNC_SETTINGS };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      owner: typeof parsed.owner === "string" && parsed.owner.trim() ? parsed.owner.trim() : DEFAULT_GITHUB_SYNC_SETTINGS.owner,
      repo: typeof parsed.repo === "string" && parsed.repo.trim() ? parsed.repo.trim() : DEFAULT_GITHUB_SYNC_SETTINGS.repo,
      branch: typeof parsed.branch === "string" && parsed.branch.trim() ? parsed.branch.trim() : DEFAULT_GITHUB_SYNC_SETTINGS.branch,
      token: typeof parsed.token === "string" ? parsed.token.trim() : ""
    };
  } catch {
    return { ...DEFAULT_GITHUB_SYNC_SETTINGS };
  }
}

function saveGitHubSyncSettings() {
  localStorage.setItem(GITHUB_SYNC_SETTINGS_KEY, JSON.stringify(githubSyncSettings));
}

function ensureGitHubSyncSettingsInitialized() {
  const mergedSettings = {
    owner: githubSyncSettings.owner || DEFAULT_GITHUB_SYNC_SETTINGS.owner,
    repo: githubSyncSettings.repo || DEFAULT_GITHUB_SYNC_SETTINGS.repo,
    branch: githubSyncSettings.branch || DEFAULT_GITHUB_SYNC_SETTINGS.branch,
    token: githubSyncSettings.token || DEFAULT_GITHUB_SYNC_SETTINGS.token
  };

  const changed =
    mergedSettings.owner !== githubSyncSettings.owner ||
    mergedSettings.repo !== githubSyncSettings.repo ||
    mergedSettings.branch !== githubSyncSettings.branch ||
    mergedSettings.token !== githubSyncSettings.token;

  githubSyncSettings = mergedSettings;
  if (changed) {
    saveGitHubSyncSettings();
  }
}

function createCard(sectionId, sectionTitle, item) {
  const fragment = cardTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".project-row");
  const link = fragment.querySelector(".project-link");
  const deleteButton = fragment.querySelector('[data-action="delete"]');

  link.textContent = item.title;

  link.addEventListener("click", () => {
    window.location.hash = createProjectHash(sectionId, item.id);
  });
  if (!IS_READONLY_CLOUD) {
    deleteButton.addEventListener("click", () => deleteProjectFromHome(sectionId, sectionTitle, item.id));
  }

  return row;
}

function addItem(sectionId) {
  const section = sections.find((entry) => entry.id === sectionId);

  if (!section) {
    return;
  }

  const firstPageWithSpace = findFirstPageWithSpace(section.items.length);
  const insertIndex = Math.min(section.items.length, (firstPageWithSpace + 1) * ITEMS_PER_PAGE);
  const newItem = {
    id: crypto.randomUUID(),
    title: "New Project",
    description: "Open this card to replace the placeholder with your own design details.",
    content: "<p>Write the full project content here.</p>",
    documentFileName: null
  };

  section.items.splice(insertIndex, 0, newItem);

  saveSections();
  sectionPageState[section.id] = firstPageWithSpace;
  renderSections();
  void ensureProjectDocument(newItem);
}

function updateItem(sectionId, itemId, changes) {
  sections = sections.map((section) => {
    if (section.id !== sectionId) {
      return section;
    }

    return {
      ...section,
      items: section.items.map((item) =>
        item.id === itemId ? { ...item, ...changes } : item
      )
    };
  });

  saveSections();
  renderSections();
  if (activeProjectRef && activeProjectRef.sectionId === sectionId && activeProjectRef.itemId === itemId) {
    renderActiveProject();
  }
}

function createProjectHash(sectionId, itemId) {
  return `project/${sectionId}/${itemId}`;
}

function changePage(sectionId, delta) {
  const section = sections.find((entry) => entry.id === sectionId);
  if (!section) {
    return;
  }

  const totalPages = Math.max(1, Math.ceil(section.items.length / ITEMS_PER_PAGE));
  const currentPage = sectionPageState[sectionId] ?? 0;
  sectionPageState[sectionId] = Math.max(0, Math.min(totalPages - 1, currentPage + delta));
  renderSections();
}

function routeFromHash() {
  const hash = window.location.hash.replace(/^#/, "");

  if (!hash.startsWith("project/")) {
    activeProjectRef = null;
    detailView.classList.add("hidden");
    homeView.classList.remove("hidden");
    renderSections();
    return;
  }

  const [, sectionId, itemId] = hash.split("/");
  const section = sections.find((entry) => entry.id === sectionId);
  const item = section?.items.find((entry) => entry.id === itemId);

  if (!section || !item) {
    window.location.hash = "";
    return;
  }

  activeProjectRef = { sectionId, itemId };
  homeView.classList.add("hidden");
  detailView.classList.remove("hidden");
  renderActiveProject();
}

function renderActiveProject() {
  const item = getActiveItem();
  const section = getActiveSection();

  if (!item || !section) {
    return;
  }

  detailKicker.textContent = `${section.kicker} / ${section.title}`;
  detailTitle.value = item.title ?? "";
  detailTitle.readOnly = IS_READONLY_CLOUD;
  editorSurface.innerHTML = item.content ?? "<p></p>";
  editorSurface.setAttribute("contenteditable", String(!IS_READONLY_CLOUD));
  updateDocumentStatus(item);
  renderMoveOptions(section.id);
  savedSelection = null;
}

function saveActiveProject() {
  const item = getActiveItem();
  if (!item || !activeProjectRef) {
    return;
  }

  const nextTitle = detailTitle.value.trim() || "Untitled Project";
  const nextContent = editorSurface.innerHTML.trim() || "<p></p>";

  detailTitle.value = nextTitle;

  updateItem(activeProjectRef.sectionId, activeProjectRef.itemId, {
    title: nextTitle,
    description: buildSummaryFromContent(editorSurface.textContent),
    content: nextContent
  });

  showSaveFeedback();
  void persistActiveProjectDocument();
}

function deleteActiveProject() {
  const section = getActiveSection();
  const item = getActiveItem();

  if (!section || !item || !activeProjectRef) {
    return;
  }

  const confirmed = window.confirm(`Delete "${item.title}" from ${section.title}? This cannot be undone.`);
  if (!confirmed) {
    return;
  }

  sections = sections.map((entry) => {
    if (entry.id !== activeProjectRef.sectionId) {
      return entry;
    }

    return {
      ...entry,
      items: entry.items.filter((project) => project.id !== activeProjectRef.itemId)
    };
  });

  saveSections();
  renderSections();
  moveMenu.classList.add("hidden");
  window.location.hash = "";
}

function toggleMoveMenu(event) {
  event.stopPropagation();
  if (!activeProjectRef) {
    return;
  }

  renderMoveOptions(activeProjectRef.sectionId);
  moveMenu.classList.toggle("hidden");
}

function renderMoveOptions(currentSectionId) {
  moveMenu.innerHTML = "";

  const availableSections = sections.filter((section) => section.id !== currentSectionId);
  availableSections.forEach((section) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "move-option-button";
    button.textContent = section.title;
    button.addEventListener("click", () => moveActiveProjectToSection(section.id));
    moveMenu.appendChild(button);
  });

  if (!availableSections.length) {
    const label = document.createElement("div");
    label.className = "page-indicator";
    label.textContent = "No other areas available.";
    moveMenu.appendChild(label);
  }
}

function handleOutsideMoveMenuClick(event) {
  if (!moveMenu || !moveProjectButton) {
    return;
  }

  if (moveMenu.classList.contains("hidden")) {
    return;
  }

  const target = event.target;
  if (moveMenu.contains(target) || moveProjectButton.contains(target)) {
    return;
  }

  moveMenu.classList.add("hidden");
}

function toggleCloudSitesMenu(event) {
  event.stopPropagation();
  cloudSitesMenu.classList.toggle("hidden");
}

function handleOutsideCloudMenuClick(event) {
  if (!cloudSitesMenu || !cloudSitesButton) {
    return;
  }

  if (cloudSitesMenu.classList.contains("hidden")) {
    return;
  }

  const target = event.target;
  if (cloudSitesMenu.contains(target) || cloudSitesButton.contains(target)) {
    return;
  }

  cloudSitesMenu.classList.add("hidden");
}

function moveActiveProjectToSection(targetSectionId) {
  const item = getActiveItem();
  const currentSection = getActiveSection();

  if (!item || !currentSection || !activeProjectRef || currentSection.id === targetSectionId) {
    return;
  }

  saveActiveProject();

  const latestItem = getActiveItem();
  if (!latestItem) {
    return;
  }

  const movedItem = { ...latestItem };

  sections = sections.map((section) => {
    if (section.id === activeProjectRef.sectionId) {
      return {
        ...section,
        items: section.items.filter((project) => project.id !== activeProjectRef.itemId)
      };
    }

    if (section.id === targetSectionId) {
      const firstPageWithSpace = findFirstPageWithSpace(section.items.length);
      const insertIndex = Math.min(section.items.length, (firstPageWithSpace + 1) * ITEMS_PER_PAGE);
      const nextItems = [...section.items];
      nextItems.splice(insertIndex, 0, movedItem);
      sectionPageState[targetSectionId] = firstPageWithSpace;

      return {
        ...section,
        items: nextItems
      };
    }

    return section;
  });

  const sourceSection = sections.find((section) => section.id === currentSection.id);
  const sourceTotalPages = Math.max(1, Math.ceil((sourceSection?.items.length ?? 0) / ITEMS_PER_PAGE));
  sectionPageState[currentSection.id] = Math.min(sectionPageState[currentSection.id] ?? 0, sourceTotalPages - 1);

  activeProjectRef = { sectionId: targetSectionId, itemId: movedItem.id };
  saveSections();
  renderSections();
  renderActiveProject();
  moveMenu.classList.add("hidden");
}

function deleteProjectFromHome(sectionId, sectionTitle, itemId) {
  const section = sections.find((entry) => entry.id === sectionId);
  const item = section?.items.find((entry) => entry.id === itemId);
  if (!section || !item) {
    return;
  }

  const confirmed = window.confirm(`Delete "${item.title}" from ${sectionTitle}? This cannot be undone.`);
  if (!confirmed) {
    return;
  }

  sections = sections.map((entry) => {
    if (entry.id !== sectionId) {
      return entry;
    }

    return {
      ...entry,
      items: entry.items.filter((project) => project.id !== itemId)
    };
  });

  const updatedSection = sections.find((entry) => entry.id === sectionId);
  const totalPages = Math.max(1, Math.ceil((updatedSection?.items.length ?? 0) / ITEMS_PER_PAGE));
  sectionPageState[sectionId] = Math.min(sectionPageState[sectionId] ?? 0, totalPages - 1);
  saveSections();
  renderSections();
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files ?? []);
  if (!files.length || !activeProjectRef) {
    return;
  }

  Promise.all(files.map(readFileAsDataUrl)).then((images) => {
    focusEditor();
    images.forEach((src) => {
      document.execCommand("insertHTML", false, `<p><img src="${src}" alt="Project image"></p>`);
    });
    imageInput.value = "";
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getActiveSection() {
  if (!activeProjectRef) {
    return null;
  }

  return sections.find((section) => section.id === activeProjectRef.sectionId) ?? null;
}

function getActiveItem() {
  const section = getActiveSection();

  if (!section || !activeProjectRef) {
    return null;
  }

  return section.items.find((item) => item.id === activeProjectRef.itemId) ?? null;
}

function normalizeSections(inputSections) {
  return inputSections.map((section) => ({
    ...section,
    title: normalizeSectionTitle(section),
    items: Array.isArray(section.items)
      ? section.items.map((item) => ({
          id: item.id ?? crypto.randomUUID(),
          title: item.title ?? "Untitled Project",
          description: item.description ?? "No summary provided yet.",
          content: normalizeItemContent(item),
          documentFileName: typeof item.documentFileName === "string" ? item.documentFileName : null
        }))
      : []
  }));
}

function normalizeSectionTitle(section) {
  if (section?.id === "other-projects" && (section.title ?? "").trim() === "Others") {
    return "Maintenance";
  }

  return section.title ?? "";
}

function normalizeItemContent(item) {
  if (typeof item.content === "string" && item.content.trim()) {
    return item.content;
  }

  const legacyBody = typeof item.body === "string" ? item.body.trim() : "";
  const legacyImages = Array.isArray(item.images) ? item.images : [];
  const imageMarkup = legacyImages
    .map((src) => `<p><img src="${src}" alt="Project image"></p>`)
    .join("");
  const bodyMarkup = legacyBody ? `<p>${escapeHtml(legacyBody)}</p>` : "<p>No detailed text provided yet.</p>";
  return `${bodyMarkup}${imageMarkup}`;
}

function buildSummaryFromContent(text) {
  const normalized = (text ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "No summary provided yet.";
  }

  return normalized.slice(0, 120);
}

function findFirstPageWithSpace(itemCount) {
  const totalPages = Math.max(1, Math.ceil(itemCount / ITEMS_PER_PAGE));

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const pageStart = pageIndex * ITEMS_PER_PAGE;
    const pageItemCount = Math.max(0, Math.min(itemCount - pageStart, ITEMS_PER_PAGE));
    if (pageItemCount < ITEMS_PER_PAGE) {
      return pageIndex;
    }
  }

  return totalPages;
}

function showSaveFeedback() {
  const buttons = [saveButtonTop, saveButton];

  buttons.forEach((button) => {
    if (!button) {
      return;
    }

    button.textContent = "Saved";
    button.classList.add("is-saved");
  });

  if (saveFeedbackTimeout) {
    window.clearTimeout(saveFeedbackTimeout);
  }

  saveFeedbackTimeout = window.setTimeout(() => {
    buttons.forEach((button) => {
      if (!button) {
        return;
      }

      button.textContent = "Save Local";
      button.classList.remove("is-saved");
    });
    saveFeedbackTimeout = null;
  }, 900);
}

async function initializeDocumentStorage() {
  if (IS_READONLY_CLOUD) {
    documentStatus.textContent = "Cloud view uses read-only mode.";
    return;
  }

  if (!supportsDocumentSaving()) {
    documentStatus.textContent = "Word autosave requires a Chromium browser with local folder access support.";
    return;
  }

  documentDirectoryHandle = await getStoredHandle(DIRECTORY_HANDLE_KEY);
  if (documentDirectoryHandle) {
    const permission = await verifyHandlePermission(documentDirectoryHandle, false);
    if (permission !== "granted") {
      documentDirectoryHandle = null;
    }
  }

  updateDocumentStatus(getActiveItem());
}

function startAutosaveTimer() {
  if (IS_READONLY_CLOUD) {
    return;
  }

  if (autosaveTimerId) {
    window.clearInterval(autosaveTimerId);
  }

  autosaveTimerId = window.setInterval(() => {
    void persistActiveProjectDocument(true);
  }, AUTOSAVE_INTERVAL_MS);
}

function openGitHubModal() {
  if (!githubModal) {
    return;
  }

  githubOwnerInput.value = githubSyncSettings.owner;
  githubRepoInput.value = githubSyncSettings.repo;
  githubBranchInput.value = githubSyncSettings.branch;
  githubTokenInput.value = githubSyncSettings.token;
  githubModal.classList.remove("hidden");
}

function closeGitHubModal() {
  githubModal?.classList.add("hidden");
}

function handleGitHubModalBackdropClick(event) {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.action === "close-github-modal") {
    closeGitHubModal();
  }
}

function saveGitHubSettingsFromModal() {
  githubSyncSettings = {
    owner: githubOwnerInput.value.trim() || DEFAULT_GITHUB_SYNC_SETTINGS.owner,
    repo: githubRepoInput.value.trim() || DEFAULT_GITHUB_SYNC_SETTINGS.repo,
    branch: githubBranchInput.value.trim() || DEFAULT_GITHUB_SYNC_SETTINGS.branch,
    token: githubTokenInput.value.trim()
  };

  saveGitHubSyncSettings();
  updateGitHubSyncStatus("GitHub login saved in this browser.");
  closeGitHubModal();
}

async function connectDocumentFolder() {
  if (IS_READONLY_CLOUD) {
    return;
  }

  if (!supportsDocumentSaving()) {
    documentStatus.textContent = "This browser does not support direct local Word autosave.";
    return;
  }

  try {
    const directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    const permission = await verifyHandlePermission(directoryHandle, true);
    if (permission !== "granted") {
      documentStatus.textContent = "Folder access was not granted.";
      return;
    }

    documentDirectoryHandle = directoryHandle;
    await setStoredHandle(DIRECTORY_HANDLE_KEY, directoryHandle);
    updateDocumentStatus(getActiveItem());
    await persistActiveProjectDocument();
  } catch (error) {
    if (error?.name !== "AbortError") {
      documentStatus.textContent = "Unable to bind a local folder for Word autosave.";
    }
  }
}

async function uploadProjectDataToGitHub() {
  if (IS_READONLY_CLOUD) {
    return;
  }

  if (!githubSyncSettings.token) {
    updateGitHubSyncStatus("GitHub token missing. Open GitHub Login first.");
    openGitHubModal();
    return;
  }

  if (activeProjectRef) {
    saveActiveProject();
  }

  const originalLabel = uploadGitHubButton?.textContent ?? "Upload To GitHub";
  setGitHubUploadBusyState(true, "Uploading...");
  updateGitHubSyncStatus("Uploading project data to GitHub...");

  try {
    await uploadProjectDataWithRetries();
    const siteUrl = buildGitHubPagesUrl(githubSyncSettings.owner, githubSyncSettings.repo);
    const timestamp = new Date().toISOString();
    upsertCloudSite({
      repo: githubSyncSettings.repo,
      url: siteUrl,
      lastUpdatedAt: timestamp
    });
    updateGitHubSyncStatus(`Upload succeeded. Cloud site: ${siteUrl}`);
  } catch (error) {
    updateGitHubSyncStatus(`Upload failed: ${describeGitHubUploadError(error)}`);
  } finally {
    setGitHubUploadBusyState(false, originalLabel);
  }
}

async function persistActiveProjectDocument(isAutosave = false) {
  const item = getActiveItem();
  if (!item || !documentDirectoryHandle) {
    updateDocumentStatus(item);
    return;
  }

  const permission = await verifyHandlePermission(documentDirectoryHandle, false);
  if (permission !== "granted") {
    updateDocumentStatus(item, "Folder access expired. Rebind the save folder.");
    return;
  }

  const fileName = item.documentFileName || buildDocumentFileName(item.title);

  try {
    const fileHandle = await documentDirectoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(buildWordDocument(item.title, item.content));
    await writable.close();

    if (item.documentFileName !== fileName && activeProjectRef) {
      updateItem(activeProjectRef.sectionId, activeProjectRef.itemId, {
        documentFileName: fileName
      });
      return;
    }

    updateDocumentStatus(item, isAutosave ? `Autosaved to ${fileName}` : `Saved to ${fileName}`);
  } catch {
    updateDocumentStatus(item, "Failed to write the local Word document.");
  }
}

async function ensureProjectDocument(project) {
  if (!documentDirectoryHandle || !project) {
    return;
  }

  const permission = await verifyHandlePermission(documentDirectoryHandle, false);
  if (permission !== "granted") {
    return;
  }

  const fileName = project.documentFileName || buildDocumentFileName(project.title);

  try {
    const fileHandle = await documentDirectoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(buildWordDocument(project.title, project.content));
    await writable.close();

    sections = sections.map((section) => ({
      ...section,
      items: section.items.map((item) =>
        item.id === project.id ? { ...item, documentFileName: fileName } : item
      )
    }));
    saveSections();
    renderSections();
  } catch {
    // Keep the project even if the matching document cannot be created.
  }
}

function buildProjectDataSnapshot() {
  return `window.__PROJECT_DATA__ = ${JSON.stringify(sections, null, 2)};\n`;
}

async function uploadProjectDataWithRetries() {
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await uploadProjectDataOnce();
      return;
    } catch (error) {
      lastError = error;
      if (!shouldRetryGitHubUpload(error) || attempt === maxAttempts) {
        throw error;
      }

      updateGitHubSyncStatus(`Upload attempt ${attempt} failed. Retrying...`);
      await delay(1200 * attempt);
    }
  }

  throw lastError ?? new Error("Unknown upload failure.");
}

async function uploadProjectDataOnce() {
  const timestamp = new Date().toISOString();
  const commitMessage = `Update project data ${timestamp}`;
  await putGitHubFile("index.html", await loadLocalTextFile("index.html"), `Update index ${timestamp}`);
  await putGitHubFile("styles.css", await loadLocalTextFile("styles.css"), `Update styles ${timestamp}`);
  await putGitHubFile("script.js", await loadLocalTextFile("script.js"), `Update script ${timestamp}`);
  await putGitHubFile(PROJECT_DATA_FILE_NAME, buildProjectDataSnapshot(), commitMessage);
  await putGitHubFile(CLOUD_SITES_FILE_NAME, buildCloudSitesSnapshot(timestamp), `Update cloud registry ${timestamp}`);
}

async function putGitHubFile(path, content, message) {
  const sha = await getGitHubFileSha(path);
  const response = await githubApiFetch(buildGitHubContentsUrl(path), {
    method: "PUT",
    headers: buildGitHubHeaders(),
    body: JSON.stringify({
      message,
      branch: githubSyncSettings.branch,
      content: base64EncodeUtf8(content),
      sha
    })
  });

  if (!response.ok) {
    throw await createGitHubApiError(response);
  }
}

async function getGitHubFileSha(path) {
  const response = await githubApiFetch(buildGitHubContentsUrl(path, true), {
    method: "GET",
    headers: buildGitHubHeaders()
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw await createGitHubApiError(response);
  }

  const payload = await response.json();
  return typeof payload.sha === "string" ? payload.sha : undefined;
}

function buildCloudSitesSnapshot(timestamp) {
  const nextRegistry = mergeCloudSiteEntry(cloudRegistry, {
    repo: githubSyncSettings.repo,
    url: buildGitHubPagesUrl(githubSyncSettings.owner, githubSyncSettings.repo),
    lastUpdatedAt: timestamp
  });

  return `window.__CLOUD_SITES__ = ${JSON.stringify(nextRegistry, null, 2)};\n`;
}

function mergeCloudSiteEntry(registry, entry) {
  const nextRegistry = Array.isArray(registry) ? [...registry] : [];
  const existingIndex = nextRegistry.findIndex((site) => site.url === entry.url);
  if (existingIndex >= 0) {
    nextRegistry[existingIndex] = { ...nextRegistry[existingIndex], ...entry };
  } else {
    nextRegistry.unshift(entry);
  }

  return nextRegistry;
}

function buildGitHubContentsUrl(path, includeRef = false) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`https://api.github.com/repos/${githubSyncSettings.owner}/${githubSyncSettings.repo}/contents/${encodedPath}`);
  if (includeRef) {
    url.searchParams.set("ref", githubSyncSettings.branch);
  }

  return url.toString();
}

function buildGitHubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubSyncSettings.token}`,
    "Content-Type": "application/json"
  };
}

async function githubApiFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error("Network request to GitHub failed.");
  }
}

async function createGitHubApiError(response) {
  let message = `GitHub API error ${response.status}`;

  try {
    const payload = await response.json();
    if (payload?.message) {
      message = payload.message;
    }
  } catch {
    // Keep the default message.
  }

  const error = new Error(message);
  error.status = response.status;
  return error;
}

function shouldRetryGitHubUpload(error) {
  const status = Number(error?.status ?? 0);
  if (!status) {
    return true;
  }

  return status >= 500 || status === 409;
}

function describeGitHubUploadError(error) {
  const status = Number(error?.status ?? 0);
  if (status === 401 || status === 403) {
    return "GitHub token is invalid or does not have permission.";
  }

  if (status === 404) {
    return "GitHub owner, repository, or branch was not found.";
  }

  if (status === 409) {
    return "GitHub reported a content conflict. Try uploading again.";
  }

  return error?.message || "Unknown upload error.";
}

function setGitHubUploadBusyState(isBusy, label) {
  if (!uploadGitHubButton) {
    return;
  }

  uploadGitHubButton.disabled = isBusy;
  uploadGitHubButton.textContent = label;
}

function buildGitHubPagesUrl(owner, repo) {
  return `https://${owner}.github.io/${repo}/`;
}

function base64EncodeUtf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function loadLocalTextFile(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to read local file: ${path}`);
  }

  return response.text();
}

function updateDocumentStatus(item, overrideMessage = "") {
  if (overrideMessage) {
    documentStatus.textContent = overrideMessage;
    documentStatus.classList.toggle("is-ready", /saved|autosaved|connected/i.test(overrideMessage));
    return;
  }

  if (!supportsDocumentSaving()) {
    documentStatus.textContent = "Word autosave requires a Chromium browser with local folder access support.";
    documentStatus.classList.remove("is-ready");
    return;
  }

  if (!documentDirectoryHandle) {
    documentStatus.textContent = "Word autosave folder not connected.";
    documentStatus.classList.remove("is-ready");
    return;
  }

  if (!item) {
    documentStatus.textContent = "Word autosave folder connected.";
    documentStatus.classList.add("is-ready");
    return;
  }

  const fileName = item.documentFileName || buildDocumentFileName(item.title);
  documentStatus.textContent = `Word autosave folder connected. File: ${fileName}`;
  documentStatus.classList.add("is-ready");
}

function updateGitHubSyncStatus(overrideMessage = "") {
  if (!repoSyncStatus) {
    return;
  }

  if (overrideMessage) {
    repoSyncStatus.textContent = overrideMessage;
    return;
  }

  if (IS_READONLY_CLOUD) {
    repoSyncStatus.textContent = "Cloud view uses read-only mode.";
    return;
  }

  if (!githubSyncSettings.token) {
    repoSyncStatus.textContent = "GitHub upload is not configured. Open GitHub Login and save your token.";
    return;
  }

  repoSyncStatus.textContent = `GitHub upload ready for ${githubSyncSettings.owner}/${githubSyncSettings.repo} on ${githubSyncSettings.branch}.`;
}

function upsertCloudSite(entry) {
  const existingIndex = cloudRegistry.findIndex((site) => site.url === entry.url);
  if (existingIndex >= 0) {
    cloudRegistry[existingIndex] = { ...cloudRegistry[existingIndex], ...entry };
  } else {
    cloudRegistry.push(entry);
  }

  saveCloudRegistry();
  renderCloudSites();
}

function supportsDocumentSaving() {
  return typeof window.showDirectoryPicker === "function" && typeof indexedDB !== "undefined";
}

function applyReadonlyMode() {
  if (!IS_READONLY_CLOUD) {
    readonlyBanner.classList.add("hidden");
    return;
  }

  document.body.classList.add("readonly-mode");
  readonlyBanner.classList.remove("hidden");
}

function buildDocumentFileName(title) {
  const safeBase = (title || "Untitled Project")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  return `${safeBase || "Untitled Project"}.doc`;
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString();
}

function buildCloudPageTimestamp() {
  if (document.lastModified) {
    const modifiedDate = new Date(document.lastModified);
    if (!Number.isNaN(modifiedDate.getTime())) {
      return modifiedDate.toISOString();
    }
  }

  return new Date().toISOString();
}

function extractRepoNameFromCloudUrl(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] || "current-cloud-site";
}

function buildWordDocument(title, contentHtml) {
  const safeTitle = escapeHtml(title || "Untitled Project");
  const bodyContent = contentHtml?.trim() || "<p></p>";

  return [
    "<!DOCTYPE html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8">',
    "<title>",
    safeTitle,
    "</title>",
    "<style>",
    "body { font-family: SimSun, 'Songti SC', serif; font-size: 12pt; line-height: 1.7; color: #111; }",
    "h1 { font-family: SimSun, 'Songti SC', serif; font-size: 18pt; margin-bottom: 18pt; }",
    "p, div, span, td, th { font-family: SimSun, 'Songti SC', serif; }",
    "img { max-width: 100%; height: auto; }",
    "</style>",
    "</head>",
    "<body>",
    `<h1>${safeTitle}</h1>`,
    bodyContent,
    "</body>",
    "</html>"
  ].join("");
}

function openHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        database.createObjectStore(HANDLE_STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredHandle(key) {
  const database = await openHandleDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE_NAME, "readonly");
    const store = transaction.objectStore(HANDLE_STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => {
      resolve(request.result?.value ?? null);
      database.close();
    };
    request.onerror = () => {
      reject(request.error);
      database.close();
    };
  });
}

async function setStoredHandle(key, value) {
  const database = await openHandleDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(HANDLE_STORE_NAME);
    const request = store.put({ key, value });
    request.onsuccess = () => {
      resolve();
      database.close();
    };
    request.onerror = () => {
      reject(request.error);
      database.close();
    };
  });
}

async function verifyHandlePermission(handle, requestWrite) {
  if (!handle) {
    return "denied";
  }

  const options = requestWrite ? { mode: "readwrite" } : {};
  if (typeof handle.queryPermission === "function") {
    const current = await handle.queryPermission(options);
    if (current === "granted" || !requestWrite) {
      return current;
    }
  }

  if (requestWrite && typeof handle.requestPermission === "function") {
    return handle.requestPermission({ mode: "readwrite" });
  }

  return "prompt";
}

function focusEditor() {
  editorSurface.focus();
  restoreSelection();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function saveSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  if (editorSurface.contains(range.commonAncestorContainer)) {
    savedSelection = range.cloneRange();
  }
}

function restoreSelection() {
  if (!savedSelection) {
    return;
  }

  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  selection.removeAllRanges();
  selection.addRange(savedSelection);
}
