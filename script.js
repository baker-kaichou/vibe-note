document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggle-sidebar");
  const newNoteButton = document.getElementById("new-note");
  const notesList = document.getElementById("notes-list");
  const noteTitle = document.getElementById("note-title");
  const noteContent = document.getElementById("note-content");
  const saveButton = document.getElementById("save-button");
  const themeToggle = document.getElementById("theme-toggle");
  const fontFamily = document.getElementById("font-family");
  const fontSize = document.getElementById("font-size");
  const boldButton = document.getElementById("bold-button");
  const italicButton = document.getElementById("italic-button");
  const underlineButton = document.getElementById("underline-button");

  // State
  let notes = [];
  let currentNoteId = null;

  // Initialize
  initApp();

  // Functions
  function initApp() {
    loadNotes();
    setupEventListeners();
    checkTheme();
    createNewNote();
  }

  function setupEventListeners() {
    // Sidebar toggle
    toggleSidebar.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });

    // Sidebar hover behavior on mobile
    sidebar.addEventListener("mouseenter", () => {
      if (window.innerWidth <= 768 && sidebar.classList.contains("collapsed")) {
        sidebar.classList.remove("collapsed");
      }
    });

    sidebar.addEventListener("mouseleave", () => {
      if (window.innerWidth <= 768 && !sidebar.classList.contains("collapsed")) {
        sidebar.classList.add("collapsed");
      }
    });

    // New note
    newNoteButton.addEventListener("click", createNewNote);

    // Save note
    saveButton.addEventListener("click", saveNote);
    
    // Download note
    saveButton.addEventListener("dblclick", downloadNote);

    // Theme toggle
    themeToggle.addEventListener("click", toggleTheme);

    // Font controls
    fontFamily.addEventListener("change", updateFontFamily);
    fontSize.addEventListener("change", updateFontSize);
    boldButton.addEventListener("click", toggleBold);
    italicButton.addEventListener("click", toggleItalic);
    underlineButton.addEventListener("click", toggleUnderline);

    // Auto-save on changes
    noteTitle.addEventListener("input", debounce(autoSave, 1000));
    noteContent.addEventListener("input", debounce(autoSave, 1000));

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);
  }

  function loadNotes() {
    const savedNotes = localStorage.getItem("notes");
    if (savedNotes) {
      notes = JSON.parse(savedNotes);
      renderNotesList();
    }
  }

  function createNewNote() {
    const newNote = {
      id: Date.now(),
      title: "Untitled Note",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    notes.unshift(newNote);
    currentNoteId = newNote.id;
    saveNotesToStorage();
    renderNotesList();
    loadNote(newNote);
  }

  function renderNotesList() {
    notesList.innerHTML = "";
    
    if (notes.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.textContent = "No notes yet. Create one!";
      notesList.appendChild(emptyState);
      return;
    }

    notes.forEach((note) => {
      const noteItem = document.createElement("div");
      noteItem.className = `note-item ${
        note.id === currentNoteId ? "active" : ""
      }`;
      noteItem.setAttribute("data-id", note.id);
      noteItem.setAttribute("tabindex", "0");

      const noteItemTitle = document.createElement("div");
      noteItemTitle.className = "note-item-title";
      noteItemTitle.textContent = note.title;

      const noteItemExcerpt = document.createElement("div");
      noteItemExcerpt.className = "note-item-excerpt";
      noteItemExcerpt.textContent = stripHtml(note.content).substring(0, 50);

      noteItem.appendChild(noteItemTitle);
      noteItem.appendChild(noteItemExcerpt);

      noteItem.addEventListener("click", () => {
        loadNote(note);
        setActiveNote(note.id);
      });

      noteItem.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          loadNote(note);
          setActiveNote(note.id);
        }
      });

      notesList.appendChild(noteItem);
    });
  }

  function loadNote(note) {
    currentNoteId = note.id;
    noteTitle.value = note.title;
    noteContent.innerHTML = note.content;
  }

  function setActiveNote(id) {
    document.querySelectorAll(".note-item").forEach((item) => {
      item.classList.remove("active");
    });
    
    const activeItem = document.querySelector(`.note-item[data-id="${id}"]`);
    if (activeItem) {
      activeItem.classList.add("active");
    }
  }

  function saveNote() {
    if (!currentNoteId) return;

    const noteIndex = notes.findIndex((note) => note.id === currentNoteId);
    if (noteIndex === -1) return;

    notes[noteIndex].title = noteTitle.value || "Untitled Note";
    notes[noteIndex].content = noteContent.innerHTML;
    notes[noteIndex].updatedAt = new Date().toISOString();

    saveNotesToStorage();
    renderNotesList();
    
    // Show save animation
    animateSaveButton();
  }
  
  function animateSaveButton() {
    saveButton.classList.add("saved");
    saveButton.innerHTML = '<span class="material-symbols-outlined">check</span> Saved';
    
    setTimeout(() => {
      saveButton.classList.remove("saved");
      saveButton.innerHTML = '<span class="material-symbols-outlined">save</span> Save';
    }, 2000);
  }

  function autoSave() {
    if (currentNoteId) {
      saveNote();
    }
  }

  function downloadNote() {
    if (!currentNoteId) return;

    const noteIndex = notes.findIndex((note) => note.id === currentNoteId);
    if (noteIndex === -1) return;

    const note = notes[noteIndex];
    const noteData = {
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(noteData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function saveNotesToStorage() {
    localStorage.setItem("notes", JSON.stringify(notes));
  }

  function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    document.body.classList.toggle("light-theme");
    
    const isDarkMode = document.body.classList.contains("dark-theme");
    localStorage.setItem("darkMode", isDarkMode);
    
    // Update icon
    themeToggle.innerHTML = `<span class="material-symbols-outlined">${
      isDarkMode ? "light_mode" : "dark_mode"
    }</span>`;
  }

  function checkTheme() {
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    if (isDarkMode) {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
      themeToggle.innerHTML = '<span class="material-symbols-outlined">light_mode</span>';
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
      themeToggle.innerHTML = '<span class="material-symbols-outlined">dark_mode</span>';
    }
  }

  function updateFontFamily() {
    noteContent.style.fontFamily = fontFamily.value;
  }

  function updateFontSize() {
    noteContent.style.fontSize = fontSize.value;
  }

  function toggleBold() {
    document.execCommand("bold", false, null);
    boldButton.classList.toggle("active");
    noteContent.focus();
  }

  function toggleItalic() {
    document.execCommand("italic", false, null);
    italicButton.classList.toggle("active");
    noteContent.focus();
  }

  function toggleUnderline() {
    document.execCommand("underline", false, null);
    underlineButton.classList.toggle("active");
    noteContent.focus();
  }

  function handleKeyboardShortcuts(e) {
    // Save: Ctrl/Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveNote();
    }
    
    // New note: Ctrl/Cmd + N
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      createNewNote();
    }
    
    // Bold: Ctrl/Cmd + B
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      if (document.activeElement === noteContent) {
        toggleBold();
      }
    }
    
    // Italic: Ctrl/Cmd + I
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      if (document.activeElement === noteContent) {
        toggleItalic();
      }
    }
    
    // Underline: Ctrl/Cmd + U
    if ((e.ctrlKey || e.metaKey) && e.key === "u") {
      if (document.activeElement === noteContent) {
        toggleUnderline();
      }
    }
  }

  // Helper Functions
  function stripHtml(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
});
