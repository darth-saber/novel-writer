// Novel Writer Studio - Main Application JavaScript

// ==================== Data Management ====================
const AppData = {
  chapters: [],
  characters: [],
  plotPoints: [],
  currentChapterId: null,
  settings: {
    fontSize: "16",
    fontFamily: "'Georgia', serif",
    lineHeight: "1.8",
  },
};

// ==================== Initialize Application ====================
document.addEventListener("DOMContentLoaded", () => {
  loadDataFromStorage();
  initializeUI();
  initializeEventListeners();
  updateStats();
  loadLastChapter();
});

// ==================== Load/Save Data ====================
function loadDataFromStorage() {
  const savedData = localStorage.getItem("novelWriterData");
  if (savedData) {
    const parsed = JSON.parse(savedData);
    AppData.chapters = parsed.chapters || [];
    AppData.characters = parsed.characters || [];
    AppData.plotPoints = parsed.plotPoints || [];
    AppData.settings = parsed.settings || AppData.settings;
  }

  // Apply saved settings
  applySettings();
}

function saveDataToStorage() {
  const dataToSave = {
    chapters: AppData.chapters,
    characters: AppData.characters,
    plotPoints: AppData.plotPoints,
    settings: AppData.settings,
    currentChapterId: AppData.currentChapterId,
  };
  localStorage.setItem("novelWriterData", JSON.stringify(dataToSave));
}

function loadLastChapter() {
  const lastChapterId = localStorage.getItem("lastChapterId");
  if (lastChapterId) {
    const chapter = AppData.chapters.find((c) => c.id === lastChapterId);
    if (chapter) {
      loadChapterIntoEditor(chapter);
    }
  }
}

// ==================== UI Initialization ====================
function initializeUI() {
  renderChaptersList();
  renderCharactersGrid();
  renderPlotTimeline();
}

function initializeEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => switchTab(item.dataset.tab));
  });

  // Editor
  const editor = document.getElementById("editor");
  editor.addEventListener("input", updateEditorStats);

  document
    .getElementById("save-chapter")
    .addEventListener("click", saveCurrentChapter);
  document
    .getElementById("new-chapter")
    .addEventListener("click", createNewChapter);

  // Chapters
  document
    .getElementById("add-chapter-btn")
    .addEventListener("click", () => openChapterModal());
  document
    .getElementById("close-chapter-modal")
    .addEventListener("click", closeChapterModal);
  document
    .getElementById("cancel-chapter")
    .addEventListener("click", closeChapterModal);
  document
    .getElementById("save-chapter-modal")
    .addEventListener("click", saveChapterFromModal);

  // Characters
  document
    .getElementById("add-character-btn")
    .addEventListener("click", () => openCharacterModal());
  document
    .getElementById("close-character-modal")
    .addEventListener("click", closeCharacterModal);
  document
    .getElementById("cancel-character")
    .addEventListener("click", closeCharacterModal);
  document
    .getElementById("save-character-modal")
    .addEventListener("click", saveCharacterFromModal);

  // Plot Points
  document
    .getElementById("add-plot-point-btn")
    .addEventListener("click", () => openPlotModal());
  document
    .getElementById("close-plot-modal")
    .addEventListener("click", closePlotModal);
  document
    .getElementById("cancel-plot")
    .addEventListener("click", closePlotModal);
  document
    .getElementById("save-plot-modal")
    .addEventListener("click", savePlotFromModal);

  // Settings
  document
    .getElementById("font-size")
    .addEventListener("change", updateFontSize);
  document
    .getElementById("font-family")
    .addEventListener("change", updateFontFamily);
  document
    .getElementById("line-height")
    .addEventListener("change", updateLineHeight);
  document.getElementById("export-data").addEventListener("click", exportData);
  document
    .getElementById("import-data")
    .addEventListener("click", () =>
      document.getElementById("import-file").click(),
    );
  document.getElementById("import-file").addEventListener("change", importData);
  document.getElementById("clear-data").addEventListener("click", clearAllData);

  // Chapter title input
  document
    .getElementById("chapter-title")
    .addEventListener("blur", updateChapterTitle);
}

// ==================== Tab Navigation ====================
function switchTab(tabId) {
  // Update nav items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.tab === tabId);
  });

  // Update tab content
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.toggle("active", tab.id === `${tabId}-tab`);
  });
}

// ==================== Editor Functions ====================
function updateEditorStats() {
  const editor = document.getElementById("editor");
  const text = editor.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = text.length;
  const readingTime = Math.ceil(words / 200);

  document.getElementById("word-count").textContent = `${words} words`;
  document.getElementById("char-count").textContent = `${chars} characters`;
  document.getElementById("reading-time").textContent =
    `${readingTime} min read`;

  updateTotalWords();
}

function updateTotalWords() {
  let totalWords = 0;
  AppData.chapters.forEach((chapter) => {
    const words = chapter.content
      ? chapter.content.trim().split(/\s+/).length
      : 0;
    totalWords += words;
  });
  document.getElementById("total-words").textContent =
    totalWords.toLocaleString();
}

function saveCurrentChapter() {
  const title = document.getElementById("chapter-title").value.trim();
  const content = document.getElementById("editor").value;

  if (!title) {
    showToast("Please enter a chapter title", "error");
    return;
  }

  if (AppData.currentChapterId) {
    // Update existing chapter
    const chapter = AppData.chapters.find(
      (c) => c.id === AppData.currentChapterId,
    );
    if (chapter) {
      chapter.title = title;
      chapter.content = content;
      chapter.lastModified = new Date().toISOString();
    }
  } else {
    // Create new chapter
    const newChapter = {
      id: generateId(),
      number: AppData.chapters.length + 1,
      title: title,
      content: content,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    AppData.chapters.push(newChapter);
    AppData.currentChapterId = newChapter.id;
  }

  saveDataToStorage();
  renderChaptersList();
  updateStats();
  showToast("Chapter saved successfully!");
}

function createNewChapter() {
  AppData.currentChapterId = null;
  document.getElementById("chapter-title").value = "";
  document.getElementById("editor").value = "";
  updateEditorStats();
  showToast("New chapter created!");
}

function loadChapterIntoEditor(chapter) {
  AppData.currentChapterId = chapter.id;
  document.getElementById("chapter-title").value = chapter.title;
  document.getElementById("editor").value = chapter.content || "";
  updateEditorStats();
}

function updateChapterTitle() {
  const title = document.getElementById("chapter-title").value.trim();
  if (AppData.currentChapterId && title) {
    const chapter = AppData.chapters.find(
      (c) => c.id === AppData.currentChapterId,
    );
    if (chapter) {
      chapter.title = title;
      saveDataToStorage();
      renderChaptersList();
    }
  }
  localStorage.setItem("lastChapterId", AppData.currentChapterId || "");
}

// ==================== Chapters CRUD ====================
let editingChapterId = null;

function renderChaptersList() {
  const container = document.getElementById("chapters-list");

  if (AppData.chapters.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>No Chapters Yet</h3>
                <p>Start writing your novel by creating your first chapter</p>
            </div>
        `;
    return;
  }

  // Sort chapters by number
  const sortedChapters = [...AppData.chapters].sort(
    (a, b) => a.number - b.number,
  );

  container.innerHTML = sortedChapters
    .map((chapter) => {
      const wordCount = chapter.content
        ? chapter.content.trim().split(/\s+/).length
        : 0;
      const date = new Date(chapter.lastModified).toLocaleDateString();

      return `
            <div class="chapter-item" data-id="${chapter.id}">
                <div class="chapter-info">
                    <h3>Chapter ${chapter.number}: ${escapeHtml(chapter.title)}</h3>
                    <span>${wordCount} words • Last edited: ${date}</span>
                </div>
                <div class="chapter-actions">
                    <button class="edit-btn" onclick="editChapter('${chapter.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteChapter('${chapter.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    })
    .join("");
}

function openChapterModal(chapterId = null) {
  const modal = document.getElementById("chapter-modal");
  const titleEl = document.getElementById("chapter-modal-title");

  if (chapterId) {
    const chapter = AppData.chapters.find((c) => c.id === chapterId);
    if (chapter) {
      editingChapterId = chapterId;
      titleEl.textContent = "Edit Chapter";
      document.getElementById("chapter-number-input").value = chapter.number;
      document.getElementById("chapter-title-input").value = chapter.title;
      document.getElementById("chapter-content-input").value =
        chapter.content || "";
    }
  } else {
    editingChapterId = null;
    titleEl.textContent = "Add New Chapter";
    document.getElementById("chapter-number-input").value =
      AppData.chapters.length + 1;
    document.getElementById("chapter-title-input").value = "";
    document.getElementById("chapter-content-input").value = "";
  }

  modal.classList.add("active");
}

function closeChapterModal() {
  document.getElementById("chapter-modal").classList.remove("active");
  editingChapterId = null;
}

function saveChapterFromModal() {
  const number = parseInt(
    document.getElementById("chapter-number-input").value,
  );
  const title = document.getElementById("chapter-title-input").value.trim();
  const content = document.getElementById("chapter-content-input").value;

  if (!title) {
    showToast("Please enter a chapter title", "error");
    return;
  }

  if (editingChapterId) {
    const chapter = AppData.chapters.find((c) => c.id === editingChapterId);
    if (chapter) {
      chapter.number = number;
      chapter.title = title;
      chapter.content = content;
      chapter.lastModified = new Date().toISOString();
    }
  } else {
    const newChapter = {
      id: generateId(),
      number: number,
      title: title,
      content: content,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    AppData.chapters.push(newChapter);
    // Re-sort chapters
    AppData.chapters.sort((a, b) => a.number - b.number);
  }

  saveDataToStorage();
  renderChaptersList();
  updateStats();
  closeChapterModal();
  showToast("Chapter saved successfully!");
}

function editChapter(id) {
  openChapterModal(id);
}

function deleteChapter(id) {
  if (confirm("Are you sure you want to delete this chapter?")) {
    AppData.chapters = AppData.chapters.filter((c) => c.id !== id);

    if (AppData.currentChapterId === id) {
      AppData.currentChapterId = null;
      document.getElementById("chapter-title").value = "";
      document.getElementById("editor").value = "";
      updateEditorStats();
    }

    saveDataToStorage();
    renderChaptersList();
    updateStats();
    showToast("Chapter deleted");
  }
}

// ==================== Characters CRUD ====================
let editingCharacterId = null;

function renderCharactersGrid() {
  const container = document.getElementById("characters-grid");

  if (AppData.characters.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Characters Yet</h3>
                <p>Create character profiles to bring your story to life</p>
            </div>
        `;
    return;
  }

  container.innerHTML = AppData.characters
    .map(
      (character) => `
        <div class="character-card" data-id="${character.id}">
            <div class="character-header">
                <div>
                    <div class="character-name">${escapeHtml(character.name)}</div>
                    <span class="character-role ${character.role}">${capitalizeFirst(character.role)}</span>
                </div>
                <div class="character-actions">
                    <button onclick="editCharacter('${character.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCharacter('${character.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="character-bio">${escapeHtml(character.bio) || "No biography available"}</p>
            ${character.traits ? `<p class="character-traits"><strong>Traits:</strong> ${escapeHtml(character.traits)}</p>` : ""}
        </div>
    `,
    )
    .join("");
}

function openCharacterModal(characterId = null) {
  const modal = document.getElementById("character-modal");
  const titleEl = document.getElementById("character-modal-title");

  if (characterId) {
    const character = AppData.characters.find((c) => c.id === characterId);
    if (character) {
      editingCharacterId = characterId;
      titleEl.textContent = "Edit Character";
      document.getElementById("character-name").value = character.name;
      document.getElementById("character-role").value = character.role;
      document.getElementById("character-bio").value = character.bio || "";
      document.getElementById("character-traits").value =
        character.traits || "";
      document.getElementById("character-notes").value = character.notes || "";
    }
  } else {
    editingCharacterId = null;
    titleEl.textContent = "Add New Character";
    document.getElementById("character-name").value = "";
    document.getElementById("character-role").value = "protagonist";
    document.getElementById("character-bio").value = "";
    document.getElementById("character-traits").value = "";
    document.getElementById("character-notes").value = "";
  }

  modal.classList.add("active");
}

function closeCharacterModal() {
  document.getElementById("character-modal").classList.remove("active");
  editingCharacterId = null;
}

function saveCharacterFromModal() {
  const name = document.getElementById("character-name").value.trim();
  const role = document.getElementById("character-role").value;
  const bio = document.getElementById("character-bio").value;
  const traits = document.getElementById("character-traits").value;
  const notes = document.getElementById("character-notes").value;

  if (!name) {
    showToast("Please enter a character name", "error");
    return;
  }

  if (editingCharacterId) {
    const character = AppData.characters.find(
      (c) => c.id === editingCharacterId,
    );
    if (character) {
      character.name = name;
      character.role = role;
      character.bio = bio;
      character.traits = traits;
      character.notes = notes;
    }
  } else {
    const newCharacter = {
      id: generateId(),
      name: name,
      role: role,
      bio: bio,
      traits: traits,
      notes: notes,
      createdAt: new Date().toISOString(),
    };
    AppData.characters.push(newCharacter);
  }

  saveDataToStorage();
  renderCharactersGrid();
  updateStats();
  closeCharacterModal();
  showToast("Character saved successfully!");
}

function editCharacter(id) {
  openCharacterModal(id);
}

function deleteCharacter(id) {
  if (confirm("Are you sure you want to delete this character?")) {
    AppData.characters = AppData.characters.filter((c) => c.id !== id);
    saveDataToStorage();
    renderCharactersGrid();
    updateStats();
    showToast("Character deleted");
  }
}

// ==================== Plot Points CRUD ====================
let editingPlotId = null;

function renderPlotTimeline() {
  const container = document.getElementById("plot-timeline");

  if (AppData.plotPoints.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sitemap"></i>
                <h3>No Plot Points Yet</h3>
                <p>Plan your story structure by adding plot points</p>
            </div>
        `;
    return;
  }

  // Sort by type order
  const typeOrder = [
    "exposition",
    "rising-action",
    "climax",
    "falling-action",
    "resolution",
  ];

  const sortedPoints = [...AppData.plotPoints].sort((a, b) => {
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
  });

  container.innerHTML = sortedPoints
    .map(
      (point) => `
        <div class="plot-point ${point.type}" data-id="${point.id}">
            <div class="plot-point-header">
                <h3>${escapeHtml(point.title)}</h3>
                <span class="plot-type-badge ${point.type}">${formatPlotType(point.type)}</span>
            </div>
            ${point.chapter ? `<p class="plot-chapter">Chapter: ${escapeHtml(point.chapter)}</p>` : ""}
            <p class="plot-description">${escapeHtml(point.description) || "No description"}</p>
            <div class="plot-actions">
                <button onclick="editPlotPoint('${point.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deletePlotPoint('${point.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function openPlotModal(plotId = null) {
  const modal = document.getElementById("plot-modal");
  const titleEl = document.getElementById("plot-modal-title");

  if (plotId) {
    const point = AppData.plotPoints.find((p) => p.id === plotId);
    if (point) {
      editingPlotId = plotId;
      titleEl.textContent = "Edit Plot Point";
      document.getElementById("plot-title").value = point.title;
      document.getElementById("plot-type").value = point.type;
      document.getElementById("plot-chapter").value = point.chapter || "";
      document.getElementById("plot-description").value =
        point.description || "";
    }
  } else {
    editingPlotId = null;
    titleEl.textContent = "Add New Plot Point";
    document.getElementById("plot-title").value = "";
    document.getElementById("plot-type").value = "exposition";
    document.getElementById("plot-chapter").value = "";
    document.getElementById("plot-description").value = "";
  }

  modal.classList.add("active");
}

function closePlotModal() {
  document.getElementById("plot-modal").classList.remove("active");
  editingPlotId = null;
}

function savePlotFromModal() {
  const title = document.getElementById("plot-title").value.trim();
  const type = document.getElementById("plot-type").value;
  const chapter = document.getElementById("plot-chapter").value.trim();
  const description = document.getElementById("plot-description").value;

  if (!title) {
    showToast("Please enter a plot point title", "error");
    return;
  }

  if (editingPlotId) {
    const point = AppData.plotPoints.find((p) => p.id === editingPlotId);
    if (point) {
      point.title = title;
      point.type = type;
      point.chapter = chapter;
      point.description = description;
    }
  } else {
    const newPoint = {
      id: generateId(),
      title: title,
      type: type,
      chapter: chapter,
      description: description,
      createdAt: new Date().toISOString(),
    };
    AppData.plotPoints.push(newPoint);
  }

  saveDataToStorage();
  renderPlotTimeline();
  closePlotModal();
  showToast("Plot point saved successfully!");
}

function editPlotPoint(id) {
  openPlotModal(id);
}

function deletePlotPoint(id) {
  if (confirm("Are you sure you want to delete this plot point?")) {
    AppData.plotPoints = AppData.plotPoints.filter((p) => p.id !== id);
    saveDataToStorage();
    renderPlotTimeline();
    showToast("Plot point deleted");
  }
}

// ==================== Settings Functions ====================
function applySettings() {
  document.getElementById("font-size").value = AppData.settings.fontSize;
  document.getElementById("font-family").value = AppData.settings.fontFamily;
  document.getElementById("line-height").value = AppData.settings.lineHeight;

  updateEditorStyles();
}

function updateEditorStyles() {
  const editor = document.getElementById("editor");
  editor.style.fontSize = `${AppData.settings.fontSize}px`;
  editor.style.fontFamily = AppData.settings.fontFamily;
  editor.style.lineHeight = AppData.settings.lineHeight;
}

function updateFontSize() {
  AppData.settings.fontSize = document.getElementById("font-size").value;
  updateEditorStyles();
  saveDataToStorage();
}

function updateFontFamily() {
  AppData.settings.fontFamily = document.getElementById("font-family").value;
  updateEditorStyles();
  saveDataToStorage();
}

function updateLineHeight() {
  AppData.settings.lineHeight = document.getElementById("line-height").value;
  updateEditorStyles();
  saveDataToStorage();
}

// ==================== Export/Import Functions ====================
function exportData() {
  const data = {
    chapters: AppData.chapters,
    characters: AppData.characters,
    plotPoints: AppData.plotPoints,
    settings: AppData.settings,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `novel-writer-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Data exported successfully!");
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.chapters) AppData.chapters = data.chapters;
      if (data.characters) AppData.characters = data.characters;
      if (data.plotPoints) AppData.plotPoints = data.plotPoints;
      if (data.settings) AppData.settings = data.settings;

      saveDataToStorage();
      initializeUI();
      updateStats();
      showToast("Data imported successfully!");
    } catch (error) {
      showToast("Error importing data. Please check the file format.", "error");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function clearAllData() {
  if (
    confirm("Are you sure you want to delete ALL data? This cannot be undone!")
  ) {
    if (
      confirm(
        "This will delete all chapters, characters, and plot points. Continue?",
      )
    ) {
      AppData.chapters = [];
      AppData.characters = [];
      AppData.plotPoints = [];
      AppData.currentChapterId = null;

      localStorage.removeItem("novelWriterData");
      localStorage.removeItem("lastChapterId");

      document.getElementById("chapter-title").value = "";
      document.getElementById("editor").value = "";
      updateEditorStats();

      initializeUI();
      updateStats();
      showToast("All data has been cleared");
    }
  }
}

// ==================== Stats Update ====================
function updateStats() {
  document.getElementById("total-chapters").textContent =
    AppData.chapters.length;
  document.getElementById("total-characters").textContent =
    AppData.characters.length;
  updateTotalWords();
}

// ==================== Utility Functions ====================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatPlotType(type) {
  const types = {
    exposition: "Exposition",
    "rising-action": "Rising Action",
    climax: "Climax",
    "falling-action": "Falling Action",
    resolution: "Resolution",
  };
  return types[type] || type;
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  toastMessage.textContent = message;
  toast.className = "toast show";
  if (type === "error") {
    toast.classList.add("error");
  }

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Make functions globally accessible for onclick handlers
window.editChapter = editChapter;
window.deleteChapter = deleteChapter;
window.editCharacter = editCharacter;
window.deleteCharacter = deleteCharacter;
window.editPlotPoint = editPlotPoint;
window.deletePlotPoint = deletePlotPoint;

// ==================== AI Writing Assistant ====================
let currentSuggestion = "";

function initializeAIAssistant() {
  // Generate content button
  document
    .getElementById("generate-content")
    .addEventListener("click", generateContent);

  // Copy suggestion button
  document
    .getElementById("copy-suggestion")
    .addEventListener("click", copySuggestion);

  // Insert suggestion button
  document
    .getElementById("insert-suggestion")
    .addEventListener("click", insertSuggestion);
}

async function generateContent() {
  const promptType = document.getElementById("prompt-type").value;
  const userPrompt = document.getElementById("writing-prompt").value.trim();
  const editor = document.getElementById("editor");
  const currentContent = editor.value;
  const cursorPosition = editor.selectionStart;

  // Show loading state
  const suggestionContent = document.getElementById("suggestion-content");
  suggestionContent.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Generating content...</p>
        </div>
    `;

  document.getElementById("suggestion-actions").style.display = "none";

  // Simulate AI generation delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate content based on type
  let generatedContent = "";

  switch (promptType) {
    case "continue":
      generatedContent = generateContinuation(currentContent, userPrompt);
      break;
    case "dialogue":
      generatedContent = generateDialogue(userPrompt);
      break;
    case "description":
      generatedContent = generateDescription(userPrompt);
      break;
    case "plot-hole":
      generatedContent = generatePlotSolution(userPrompt);
      break;
    case "rewrite":
      generatedContent = generateRewrite(currentContent, userPrompt);
      break;
    case "brainstorm":
      generatedContent = generateBrainstorm(currentContent);
      break;
    case "outline":
      generatedContent = generateOutline(userPrompt);
      break;
    case "conflict":
      generatedContent = generateConflict(currentContent, userPrompt);
      break;
    case "ending":
      generatedContent = generateEnding(currentContent, userPrompt);
      break;
    default:
      generatedContent = "Please select a type of assistance.";
  }

  currentSuggestion = generatedContent;

  // Display the suggestion
  suggestionContent.innerHTML = `
        <div class="suggestion-text">
            ${generatedContent
              .split("\n")
              .map((p) => (p.trim() ? `<p>${p}</p>` : "<br>"))
              .join("")}
        </div>
    `;

  document.getElementById("suggestion-actions").style.display = "flex";
  showToast("Content generated successfully!");
}

function generateContinuation(content, userPrompt) {
  const continuations = [
    "The morning sun cast long shadows across the room as the character prepared for what lay ahead. Every step felt heavier than the last, knowing that decisions made today would echo through tomorrow.",
    "And then, as if the universe had been waiting, the opportunity presented itself. The timing was perfect—or perhaps it was fate stepping in at just the right moment.",
    "But within the silence, a new resolve began to form. Whatever the cost, whatever the consequence, they would see this through to the end.",
    "The weight of the moment settled upon their shoulders like an invisible cloak. There was no turning back now; the path ahead was set, and it led only forward.",
    "Yet doubt crept in like morning mist, clouding judgment and whispering seditious thoughts. Was this truly the right choice? Only time would tell.",
    "With trembling hands but steady heart, they reached for what had seemed impossible just moments before. The impossible had become possible.",
    "The air grew thick with anticipation. Somewhere in the distance, a door creaked open, and with it came the promise of answers long sought.",
  ];

  if (content.length < 50) {
    return `The story begins with promise and uncertainty. ${continuations[Math.floor(Math.random() * continuations.length)]}`;
  }

  const lastParagraph =
    content
      .split(/[.!?]+/)
      .filter((s) => s.trim())
      .pop()
      ?.trim() || "";
  const selected =
    continuations[Math.floor(Math.random() * continuations.length)];

  return userPrompt
    ? `${selected}\n\nBased on your input: "${userPrompt}"\n\nThe narrative weaves toward this moment, where past and future collide in a dance of destiny.`
    : selected;
}

function generateDialogue(userPrompt) {
  const dialogueTemplates = [
    `"I can't believe you would do this," she said, her voice trembling with a mix of anger and betrayal.\n\n"Believe it," he replied, his eyes hard as stone. "Some things are more important than feelings."\n\n"And what about us? What about everything we've built?"\n\nHe turned away, unable to meet her gaze. "Some things, once broken, can never be repaired."`,

    `"You think you know the truth?" he laughed bitterly. "You've only seen what they wanted you to see."\n\nHer heart raced. "What are you saying?"\n\n"I'm saying that every assumption you've made, every belief you've held—it's all been built on lies."\n\nThe ground beneath her feet suddenly felt unstable.`,

    `"Wait," she called out, her voice echoing through the empty corridor. "Please, just listen."\n\nHe stopped but didn't turn around. "There's nothing left to say."\n\n"There is," she insisted, stepping closer. "I made mistakes. Terrible mistakes. But I never stopped caring."\n\nFinally, he faced her, and in his eyes, she saw a flicker of something that might have been hope.`,
  ];

  if (userPrompt) {
    return `Scene: ${userPrompt}\n\n${dialogueTemplates[Math.floor(Math.random() * dialogueTemplates.length)]}`;
  }

  return dialogueTemplates[
    Math.floor(Math.random() * dialogueTemplates.length)
  ];
}

function generateDescription(userPrompt) {
  const descriptions = [
    `The room was a masterpiece of organized chaos. Books teetered in precarious towers along every surface, their spines faded by countless readings. Dust motes danced in the pale light that filtered through grimy windows, creating an ethereal display that seemed almost alive. The smell of old paper and leather bindings hung heavy in the air, a perfume that spoke of countless stories waiting to be discovered.`,

    `The forest had transformed into something otherworldly. Mist crept between ancient trunks like living smoke, swirling around gnarled roots and disappearing into shadows that seemed deeper than they should be. Every step forward felt like stepping into an unknown world, where the rules of nature had been bent and twisted into something strange and beautiful. The silence was complete, broken only by the occasional drop of dew falling from unseen leaves.`,

    `The city stretched below like a circuit board of light and shadow. Towering skyscrapers glittered with a thousand windows, each one a story of hopes, dreams, and failures. The hum of traffic formed a distant lullaby, a constant reminder of the millions of lives intertwining below. Above, the sky was painted in shades of orange and purple, the sun beginning its slow descent toward the horizon.`,
  ];

  if (userPrompt) {
    return `Description of ${userPrompt}:\n\n${descriptions[Math.floor(Math.random() * descriptions.length)]}`;
  }

  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generatePlotSolution(userPrompt) {
  const solutions = [
    `Consider this possibility: The mysterious figure who appeared at the critical moment turns out to be someone from the protagonist's past—someone they wronged. This creates both a solution to the immediate problem and introduces a new layer of moral complexity. The resolution requires the protagonist to face their past actions while saving the present.`,

    `Here's an interesting angle: The seemingly insurmountable obstacle is actually a test, designed by an ally the protagonist didn't know they had. The key to overcoming it lies in something the protagonist considered a weakness but is actually their greatest strength. This revelation can lead to a powerful moment of self-discovery.`,

    `Think about introducing a hidden resource: What if the answer has been with the protagonist all along, perhaps an object they dismissed as insignificant or a skill they never thought to use in this context? The "plot hole" becomes a moment of realization where everything clicks into place.`,

    `Consider raising the stakes further: Instead of solving the problem directly, the protagonist discovers that by solving it their way, they'd cause something worse. This forces them to rethink everything and find a solution that addresses the underlying issue rather than just the symptoms.`,
  ];

  return userPrompt
    ? `Addressing: ${userPrompt}\n\n${solutions[Math.floor(Math.random() * solutions.length)]}`
    : solutions[Math.floor(Math.random() * solutions.length)];
}

function generateRewrite(content, userPrompt) {
  if (!content || content.length < 10) {
    return "Please write some content in the editor first, then select it and use the rewrite option to improve it.";
  }

  const improvements = [
    `Here's a revised version with stronger imagery and more dynamic pacing:\n\n"Time seemed to freeze in that crystalline moment. Every detail sharpened—the individual grains of dust suspended in the air, the subtle tremor in her hands, the way light caught the tears that lingered on her lashes. In that eternal instant before the world resumed its relentless march forward, she understood something fundamental about herself."`,

    `Here's a more emotionally resonant version:\n\n"She felt it then—a clarity so profound it bordered on pain. Every word, every glance, every small kindness and petty cruelty of the past months recontextualized itself in a heartbeat. The truth, when it finally arrived, wore the face of something she had been too busy or too afraid to see."`,

    `Here's a version with more vivid sensory details:\n\n"The scent of rain on hot pavement rose from the street below, mingling with coffee from a nearby café and something else—something that triggered a memory so sharp it almost hurt. Sound fell away until there was only the rhythm of her own heartbeat, loud as thunder, steady as a drum leading her toward her destiny."`,
  ];

  return userPrompt
    ? `Based on your suggestion: "${userPrompt}"\n\n${improvements[Math.floor(Math.random() * improvements.length)]}`
    : improvements[Math.floor(Math.random() * improvements.length)];
}

function generateBrainstorm(content) {
  const ideas = [
    `✨ **Story Possibilities to Explore:**\n\n• What if the main conflict stems from a misunderstanding that could be resolved with one honest conversation?\n\n• Consider introducing a wildcard character whose motivations are unclear—will they help or hinder?\n\n• The setting itself could be an antagonist. How might the environment work against the protagonist?\n\n• Think about what the protagonist fears most—and find a way to force them to face it.\n\n• A revelation about a secondary character's hidden agenda could shake everything up.`,

    `✨ **Scene Development Ideas:**\n\n• Start this scene in the middle of action (in medias res) rather than building up to it.\n\n• What sensory details define this moment? What does the character smell, hear, feel?\n\n• What does the character want in this scene? What prevents them from getting it?\n\n• Consider the emotional arc: Where does the character begin emotionally, and where do they end?\n\n• Is there a secret, a lie, or a truth that could transform this scene?`,

    `✨ **Character Angles to Consider:**\n\n• What is the character's deepest fear? How can you use it against them?\n\n• What do they want vs. what do they need? The gap between these drives great stories.\n\n• Consider a moment of weakness that reveals their humanity.\n\n• Who in their life would be surprised to see them in this situation? Why?\n\n• What past experience shaped their reaction to current events?`,
  ];

  return ideas[Math.floor(Math.random() * ideas.length)];
}

function generateOutline(userPrompt) {
  const outlineTemplates = [
    `📝 **Suggested Chapter Outline: ${userPrompt || "Untitled Chapter"}**\n\n**Opening Hook**\nStart with something attention-grabbing—a question, a conflict, or an intriguing observation.\n\n**Setup (1-3 paragraphs)**\nEstablish the setting and introduce the scene's central question or tension.\n\n**Rising Action**\n- Introduce obstacles or complications\n- Develop character dynamics\n- Build tension through action and dialogue\n\n**Climax Point**\nThe moment of maximum tension or a turning point that changes everything.\n\n**Resolution/Tease**\nAddress immediate questions while raising new ones for future chapters.`,

    `📝 **Scene Structure for: ${userPrompt || "This Scene"}**\n\n**1. The Goal**\nWhat does your character want in this scene? Be specific.\n\n**2. The Obstacle**\nWhat's in their way? External conflict or internal struggle?\n\n**3. The Action**\nShow the character attempting to overcome the obstacle. This is where the scene's action happens.\n\n**4. The Reaction**\nHow do they respond to what happened? What do they learn?\n\n**5. The Hook**\nEnd with something that propels the reader into the next scene.`,

    `📝 **Chapter Blueprint**\n\n**Title:** ${userPrompt || "Chapter Title"}\n\n**Purpose:** What must happen in this chapter? What emotional beats?\n\n**Key Scenes:**\n1. Opening scene (1-2 paragraphs)\n2. Development scene (major portion of chapter)\n3. Turning point scene\n4. Closing scene with forward momentum\n\n**Characters Present:** Who needs to appear? What roles do they play?\n\n**Notes:** Any important dialogue, revelations, or actions that must occur?`,
  ];

  return outlineTemplates[Math.floor(Math.random() * outlineTemplates.length)];
}

function generateConflict(currentContent, userPrompt) {
  const conflicts = [
    `🎭 **Conflict Injection Ideas:**\n\n**Internal Conflict:**\nThe protagonist discovers they possess a power they neither wanted nor understand. Now they must choose between embracing this gift and risking everything, or suppressing it and living a lie.\n\n**Relationship Conflict:**\nA trusted ally reveals they've been working for the antagonist all along. The protagonist must grapple with betrayal while still needing help.\n\n**Environmental Conflict:**\nAn approaching crisis forces impossible choices: save the ones you love or save strangers. No perfect solution exists.`,

    `🎭 **Tension-Building Techniques:**\n\n• **Time Pressure:** Add a ticking clock. "You have until sunset..."\n\n• **Information Asymmetry:** The protagonist knows something the reader doesn't—or vice versa.\n\n• **Stakes Escalation:** What was a personal quest becomes something much larger.\n\n• **Almost-Success:** The protagonist almost achieves their goal, but at the last moment, something goes wrong.\n\n• **Complications:** Just when things seem to be working, a new problem emerges.`,

    `🎭 **Creating Dramatic Tension:**\n\n**The Unspoken:** Two characters who clearly have history but whose past remains mysterious. Let readers piece it together through charged interactions.\n\n**The Wait:** Characters forced to wait for something important to happen. The anticipation can be more stressful than the event itself.\n\n**The Secret:** One character knows something that could change everything but can't reveal it yet. The dramatic irony keeps readers engaged.\n\n**The Choice:** Present two paths, both with serious consequences. Let readers sweat over which the character will choose.`,
  ];

  return userPrompt
    ? `Conflict for: ${userPrompt}\n\n${conflicts[Math.floor(Math.random() * conflicts.length)]}`
    : conflicts[Math.floor(Math.random() * conflicts.length)];
}

function generateEnding(currentContent, userPrompt) {
  const endings = [
    `🌅 **Possible Ending Options:**\n\n**The Bittersweet Close:**\nThey succeeded, but at what cost? The victory tastes like ash as they survey what remains. Yet in the quiet aftermath, there's a glimmer of hope—a promise that from these ashes, something new will rise.\n\n**The Open Door:**\nOne problem solved, but another revealed. As the character turns from the window, they notice a letter that changes everything. The end is also a beginning.\n\n**The Circle Complete:**\nThe story comes full circle, echoing the opening in a way that illuminates the character's journey. They are not the same person who started this adventure.`,

    `🌅 **Scene Conclusion Ideas:**\n\n**Reflection Moment:** After the action settles, let your character process what happened. What does this mean for them?\n\n**Silent Promise:** A moment of quiet resolve. Whatever comes next, they're ready. The look in their eyes says everything.\n\n**The New Normal:** Things will never be the same. The character steps forward into a changed world, carrying new knowledge and strength.\n\n**Unresolved Thread:** A final image or line hints at something left undone. The reader closes the book thinking about what comes next.`,

    `🌅 **Strong Closing Beats:**\n\n• **Echo and Amplify:** Return to an image or phrase from the beginning, but now it carries new meaning.\n\n• **The Lesson Learned:** Show how the character's journey has changed them. What do they understand now that they didn't before?\n\n• **Hope's Light:** Even in dark stories, leave a thread of hope. Humans need to believe in the possibility of better days.\n\n• **The Quiet Moment:** Sometimes the most powerful ending is the simplest—a single moment of peace, however brief.`,
  ];

  return userPrompt
    ? `Ending for: ${userPrompt}\n\n${endings[Math.floor(Math.random() * endings.length)]}`
    : endings[Math.floor(Math.random() * endings.length)];
}

function copySuggestion() {
  if (!currentSuggestion) {
    showToast("No suggestion to copy", "error");
    return;
  }

  navigator.clipboard
    .writeText(currentSuggestion)
    .then(() => {
      showToast("Suggestion copied to clipboard!");
    })
    .catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = currentSuggestion;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("Suggestion copied to clipboard!");
    });
}

function insertSuggestion() {
  if (!currentSuggestion) {
    showToast("No suggestion to insert", "error");
    return;
  }

  const editor = document.getElementById("editor");
  const startPos = editor.selectionStart;
  const endPos = editor.selectionEnd;
  const currentContent = editor.value;

  // Insert the suggestion at cursor position
  editor.value =
    currentContent.substring(0, startPos) +
    currentSuggestion +
    currentContent.substring(endPos);

  // Place cursor after inserted text
  editor.focus();
  editor.selectionStart = editor.selectionEnd =
    startPos + currentSuggestion.length;

  showToast("Suggestion inserted at cursor!");
  updateEditorStats();
}

// Update the initializeEventListeners function to include AI Assistant initialization
const originalInitializeEventListeners = initializeEventListeners;
initializeEventListeners = function () {
  originalInitializeEventListeners();
  initializeAIAssistant();
};
