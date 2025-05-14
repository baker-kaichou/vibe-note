document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const sidebar = document.getElementById("sidebar");
  const newNoteButton = document.getElementById("new-note");
  const notesList = document.getElementById("notes-list");
  const noteTitle = document.getElementById("note-title");
  const noteContent = document.getElementById("note-content");
  const saveButton = document.getElementById("save-button");
  const downloadButton = document.getElementById("download-button");
  const themeToggle = document.getElementById("theme-toggle");
  const fontFamily = document.getElementById("font-family");
  const fontSize = document.getElementById("font-size");
  const boldButton = document.getElementById("bold-button");
  const italicButton = document.getElementById("italic-button");
  const underlineButton = document.getElementById("underline-button");

  // State
  let notes = [];
  let currentNoteId = null;
  let activeDeleteItem = null;

  // Initialize
  initApp();

  // Functions
  function initApp() {
    loadNotes();
    setupEventListeners();
    checkTheme();
    
    // Create a new note if there are no notes
    if (notes.length === 0) {
      createNewNote();
    } else {
      loadNote(notes[0]);
      setActiveNote(notes[0].id);
    }
  }

  function setupEventListeners() {
    // New note
    newNoteButton.addEventListener("click", createNewNote);

    // Save note
    saveButton.addEventListener("click", saveNote);
    
    // Download note
    downloadButton.addEventListener("click", downloadNote);

    // Theme toggle
    themeToggle.addEventListener("change", toggleTheme);

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
    
    // Handle clicks on document to close any open delete buttons
    document.addEventListener("click", (e) => {
      // If click is outside a note item
      if (!e.target.closest(".note-item") && activeDeleteItem) {
        document.querySelectorAll(".note-item").forEach(item => {
          item.classList.remove("show-delete");
        });
        activeDeleteItem = null;
      }
    });
  }

  function loadNotes() {
    const savedNotes = localStorage.getItem("baelz-notes");
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
    
    // Focus on the title field
    noteTitle.focus();
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

      // Create note content container
      const noteItemContent = document.createElement("div");
      noteItemContent.className = "note-item-content";

      const noteItemTitle = document.createElement("div");
      noteItemTitle.className = "note-item-title";
      noteItemTitle.textContent = note.title;

      const noteItemExcerpt = document.createElement("div");
      noteItemExcerpt.className = "note-item-excerpt";
      noteItemExcerpt.textContent = stripHtml(note.content).substring(0, 50);

      noteItemContent.appendChild(noteItemTitle);
      noteItemContent.appendChild(noteItemExcerpt);
      
      // Create delete button
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.innerHTML = '<i class="material-icons">delete</i>';
      deleteButton.setAttribute("aria-label", "Delete note");
      
      // Add delete functionality
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent note selection when clicking delete
        deleteNote(note.id);
      });

      noteItem.appendChild(noteItemContent);
      noteItem.appendChild(deleteButton);

      noteItem.addEventListener("click", (e) => {
        // If there's already an active delete item, hide it
        if (activeDeleteItem && activeDeleteItem !== noteItem) {
          activeDeleteItem.classList.remove("show-delete");
        }
        
        // Toggle delete button visibility
        if (e.target.closest(".note-item") && !e.target.closest(".delete-button")) {
          if (noteItem.classList.contains("show-delete")) {
            noteItem.classList.remove("show-delete");
            activeDeleteItem = null;
          } else {
            noteItem.classList.add("show-delete");
            activeDeleteItem = noteItem;
          }
        }
        
        loadNote(note);
        setActiveNote(note.id);
      });

      noteItem.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          loadNote(note);
          setActiveNote(note.id);
        } else if (e.key === "Delete") {
          deleteNote(note.id);
        }
      });

      notesList.appendChild(noteItem);
    });
  }

  function deleteNote(id) {
    if (confirm("Are you sure you want to delete this note?")) {
      notes = notes.filter(note => note.id !== id);
      saveNotesToStorage();
      
      // If the deleted note was the current note, load another note if available
      if (id === currentNoteId) {
        if (notes.length > 0) {
          loadNote(notes[0]);
          setActiveNote(notes[0].id);
        } else {
          // If no notes left, clear the editor
          currentNoteId = null;
          noteTitle.value = "";
          noteContent.innerHTML = "";
        }
      }
      
      renderNotesList();
    }
  }

  function loadNote(note) {
    currentNoteId = note.id;
    noteTitle.value = note.title;
    noteContent.innerHTML = note.content;
    // Set active state
    setActiveNote(note.id);
  }

  function setActiveNote(id) {
    document.querySelectorAll(".note-item").forEach((item) => {
      item.classList.remove("active");
    });
    
    const activeItem = document.querySelector(`.note-item[data-id="${id}"]`);
    if (activeItem) {
      activeItem.classList.add("active");
      // Ensure the active item is visible in the scrollable area
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    saveButton.innerHTML = '<i class="material-icons">check</i><span>Saved</span>';
    
    setTimeout(() => {
      saveButton.classList.remove("saved");
      saveButton.innerHTML = '<i class="material-icons">save</i><span>Save</span>';
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
    
    // Create a formatted text file
    const textContent = `# ${note.title}\n\n${stripHtml(note.content)}\n\nCreated: ${new Date(note.createdAt).toLocaleString()}\nUpdated: ${new Date().toLocaleString()}`;
    
    // Create safe filename
    const safeTitle = note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Create and trigger the download
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `${safeTitle}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
    // Provide visual feedback for download
    downloadButton.innerHTML = '<i class="material-icons">check</i><span>Downloaded</span>';
    setTimeout(() => {
      downloadButton.innerHTML = '<i class="material-icons">download</i><span>Download</span>';
    }, 2000);
  }

  function saveNotesToStorage() {
    localStorage.setItem("baelz-notes", JSON.stringify(notes));
  }

  function toggleTheme() {
    const isDarkMode = themeToggle.checked;
    
    if (isDarkMode) {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    }
    
    localStorage.setItem("baelz-dark-mode", isDarkMode);
  }

  function checkTheme() {
    const isDarkMode = localStorage.getItem("baelz-dark-mode") === "true";
    themeToggle.checked = isDarkMode;
    
    if (isDarkMode) {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
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
    noteContent.focus();
    checkActiveFormatting();
  }

  function toggleItalic() {
    document.execCommand("italic", false, null);
    noteContent.focus();
    checkActiveFormatting();
  }

  function toggleUnderline() {
    document.execCommand("underline", false, null);
    noteContent.focus();
    checkActiveFormatting();
  }
  
  function checkActiveFormatting() {
    // Check current selection formatting
    boldButton.classList.toggle("active", document.queryCommandState("bold"));
    italicButton.classList.toggle("active", document.queryCommandState("italic"));
    underlineButton.classList.toggle("active", document.queryCommandState("underline"));
  }
  
  // Check formatting when user selects text
  noteContent.addEventListener("mouseup", checkActiveFormatting);
  noteContent.addEventListener("keyup", checkActiveFormatting);

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
        e.preventDefault();
        toggleBold();
      }
    }
    
    // Italic: Ctrl/Cmd + I
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      if (document.activeElement === noteContent) {
        e.preventDefault();
        toggleItalic();
      }
    }
    
    // Underline: Ctrl/Cmd + U
    if ((e.ctrlKey || e.metaKey) && e.key === "u") {
      if (document.activeElement === noteContent) {
        e.preventDefault();
        toggleUnderline();
      }
    }
    
    // Download: Ctrl/Cmd + D
    if ((e.ctrlKey || e.metaKey) && e.key === "d") {
      e.preventDefault();
      downloadNote();
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
