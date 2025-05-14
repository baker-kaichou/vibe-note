document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const themeToggle = document.getElementById("theme-toggle");
  const notesListContainer = document.getElementById("notes-list");
  const editorContainer = document.getElementById("editor-container");
  const welcomeScreen = document.getElementById("welcome-screen");
  const newNoteBtn = document.getElementById("new-note-btn");
  const welcomeNewNoteBtn = document.getElementById("welcome-new-note-btn");
  const saveBtn = document.getElementById("save-btn");
  const noteTitleInput = document.getElementById("note-title");
  const fontFamilySelect = document.getElementById("font-family");
  const fontSizeSelect = document.getElementById("font-size");
  const boldBtn = document.getElementById("bold-btn");
  const italicBtn = document.getElementById("italic-btn");
  const underlineBtn = document.getElementById("underline-btn");

  // State
  let notes = [];
  let currentNoteId = null;

  // Initialize Quill editor
  const quill = new Quill("#editor", {
    theme: "snow",
    modules: {
      toolbar: false, // We're using our custom toolbar
    },
    placeholder: "Start writing your note...",
  });

  // Theme Toggling
  themeToggle.addEventListener("change", function () {
    if (this.checked) {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
    }
  });

  // Create a new note
  function createNewNote() {
    const newNote = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      createdAt: new Date().toISOString(),
    };

    notes.push(newNote);
    currentNoteId = newNote.id;
    renderNotesList();
    showEditor();
    loadNote(newNote);
  }

  // Render notes list in sidebar
  function renderNotesList() {
    notesListContainer.innerHTML = "";

    if (notes.length === 0) {
      notesListContainer.innerHTML =
        '<div class="empty-notes">No notes yet</div>';
      return;
    }

    notes.forEach((note) => {
      const noteCard = document.createElement("div");
      noteCard.className = `note-card ${
        note.id === currentNoteId ? "active" : ""
      }`;
      noteCard.dataset.id = note.id;

      noteCard.innerHTML = `
        <div class="note-card-title">${note.title}</div>
        <button class="note-card-delete" data-id="${note.id}">
          <span class="material-symbols-rounded">delete</span>
        </button>
      `;

      noteCard.addEventListener("click", function (e) {
        if (!e.target.closest(".note-card-delete")) {
          currentNoteId = note.id;
          loadNote(note);
          renderNotesList(); // Re-render to update active state
        }
      });

      notesListContainer.appendChild(noteCard);
    });

    // Add delete event listeners
    document.querySelectorAll(".note-card-delete").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const noteId = this.dataset.id;
        deleteNote(noteId);
      });
    });
  }

  // Delete a note
  function deleteNote(noteId) {
    notes = notes.filter((note) => note.id !== noteId);

    if (noteId === currentNoteId) {
      currentNoteId = notes.length > 0 ? notes[0].id : null;
      
      if (currentNoteId) {
        loadNote(notes[0]);
      } else {
        hideEditor();
      }
    }

    renderNotesList();
  }

  // Load note into editor
  function loadNote(note) {
    noteTitleInput.value = note.title;
    quill.root.innerHTML = note.content;
    showEditor();
  }

  // Show editor, hide welcome screen
  function showEditor() {
    welcomeScreen.style.display = "none";
    editorContainer.style.display = "flex";
  }

  // Hide editor, show welcome screen
  function hideEditor() {
    welcomeScreen.style.display = "flex";
    editorContainer.style.display = "none";
  }

  // Save current note
  function saveCurrentNote() {
    if (!currentNoteId) return;

    const noteIndex = notes.findIndex((note) => note.id === currentNoteId);
    if (noteIndex !== -1) {
      notes[noteIndex].title = noteTitleInput.value;
      notes[noteIndex].content = quill.root.innerHTML;
      renderNotesList();
    }
  }

  // Download note as JSON file
  function downloadNote() {
    if (!currentNoteId) return;

    const note = notes.find((note) => note.id === currentNoteId);
    if (!note) return;

    // Save any pending changes
    saveCurrentNote();

    const noteData = JSON.stringify(note, null, 2);
    const blob = new Blob([noteData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Format text with Quill
  function formatText(format) {
    const selection = quill.getSelection();
    if (selection) {
      // Check current format state
      const formatState = quill.getFormat(selection);
      quill.format(format, !formatState[format]);
      
      // Update toolbar button states
      updateFormatButtonStates(quill.getFormat(selection));
    }
  }

  // Update toolbar button states based on current format
  function updateFormatButtonStates(formats) {
    boldBtn.classList.toggle("active", formats.bold === true);
    italicBtn.classList.toggle("active", formats.italic === true);
    underlineBtn.classList.toggle("active", formats.underline === true);
  }

  // Update font family
  function updateFontFamily(fontFamily) {
    const selection = quill.getSelection();
    if (selection) {
      quill.format("font", fontFamily);
    } else {
      quill.format("font", fontFamily);
    }
  }

  // Update font size
  function updateFontSize(fontSize) {
    const selection = quill.getSelection();
    if (selection) {
      quill.format("size", fontSize);
    } else {
      quill.format("size", fontSize);
    }
  }

  // Event Listeners
  newNoteBtn.addEventListener("click", createNewNote);
  welcomeNewNoteBtn.addEventListener("click", createNewNote);
  saveBtn.addEventListener("click", downloadNote);

  noteTitleInput.addEventListener("blur", saveCurrentNote);
  noteTitleInput.addEventListener("keyup", function () {
    if (currentNoteId) {
      const noteIndex = notes.findIndex((note) => note.id === currentNoteId);
      if (noteIndex !== -1) {
        notes[noteIndex].title = this.value;
        renderNotesList();
      }
    }
  });

  boldBtn.addEventListener("click", () => formatText("bold"));
  italicBtn.addEventListener("click", () => formatText("italic"));
  underlineBtn.addEventListener("click", () => formatText("underline"));

  fontFamilySelect.addEventListener("change", function () {
    updateFontFamily(this.value);
  });

  fontSizeSelect.addEventListener("change", function () {
    updateFontSize(this.value);
  });

  // Update format button states when selection changes
  quill.on("selection-change", function (range) {
    if (range) {
      const formats = quill.getFormat(range);
      updateFormatButtonStates(formats);
    }
  });

  // Auto-save current note content when quill editor changes
  quill.on("text-change", function () {
    saveCurrentNote();
  });

  // Initialize the app
  hideEditor(); // Start with welcome screen
});
