document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggle-sidebar");
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
    
    // Init sidebar state based on screen size
    updateSidebarState();
    window.addEventListener('resize', updateSidebarState);
  }

  function updateSidebarState() {
    if (window.innerWidth <= 768) {
      sidebar.classList.add("collapsed");
    } else {
      sidebar.classList.remove("collapsed");
    }
  }

  function setupEventListeners() {
    // Sidebar toggle
    toggleSidebar.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });

    // New note
    newNoteButton.addEventListener("click", createNewNote);

    // Save note
    saveButton.addEventListener("click", saveNote);
    
    // Download note
    downloadButton.addEventListener("click", downloadNote);

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
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 768 && 
          !sidebar.contains(e.target) && 
          !toggleSidebar.contains(e.target) &&
          !sidebar.classList.contains("collapsed")) {
        sidebar.classList.add("collapsed");
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
    
    // On mobile, collapse sidebar after creating a new note
    if (window.innerWidth <= 768) {
      sidebar.classList.add("collapsed");
    }
    
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
        
        // On mobile, collapse sidebar after selecting a note
        if (window.innerWidth <= 768) {
          sidebar.classList.add("collapsed");
        }
      });

      noteItem.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          loadNote(note);
          setActiveNote(note.id);
          
          // On mobile, collapse sidebar after selecting a note
          if (window.innerWidth <= 768) {
            sidebar.classList.add("collapsed");
          }
        }
      });

      notesList.appendChild(noteItem);
    });
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
    
    // Create a more user-friendly formatted file
    const noteData = {
      title: note.title,
      content: stripHtml(note.content),
      createdAt: new Date(note.createdAt).toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };

    // For plain text file
    const textContent = `# ${noteData.title}\n\n${noteData.content}\n\nCreated: ${noteData.createdAt}\nUpdated: ${noteData.updatedAt}`;
    
    // For HTML file preserving formatting
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${noteData.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #e94057; }
    .meta { color: #888; font-size: 0.9em; margin-top: 30px; }
  </style>
</head>
<body>
  <h1>${noteData.title}</h1>
  <div class="content">
    ${note.content}
  </div>
  <div class="meta">
    <p>Created: ${noteData.createdAt}<br>
    Updated: ${noteData.updatedAt}</p>
  </div>
</body>
</html>`;

    // Create both TXT and HTML versions
    const textBlob = new Blob([textContent], { type: "text/plain" });
    const htmlBlob = new Blob([htmlContent], { type: "text/html" });
    
    // Create a safe filename from the title
    const safeTitle = note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Show download options to user
    const downloadTxt = document.createElement("a");
    downloadTxt.href = URL.createObjectURL(textBlob);
    downloadTxt.download = `${safeTitle}.txt`;
    downloadTxt.style.display = "none";
    document.body.appendChild(downloadTxt);
    downloadTxt.click();
    
    // Small delay between downloads
    setTimeout(() => {
      const downloadHtml = document.createElement("a");
      downloadHtml.href = URL.createObjectURL(htmlBlob);
      downloadHtml.download = `${safeTitle}.html`;
      downloadHtml.style.display = "none";
      document.body.appendChild(downloadHtml);
      downloadHtml.click();
      
      // Clean up the URLs
      URL.revokeObjectURL(downloadTxt.href);
      URL.revokeObjectURL(downloadHtml.href);
      document.body.removeChild(downloadTxt);
      document.body.removeChild(downloadHtml);
    }, 100);
    
    // Provide visual feedback for download
    downloadButton.innerHTML = '<i class="material-icons">check</i>';
    setTimeout(() => {
      downloadButton.innerHTML = '<i class="material-icons">download</i>';
    }, 2000);
  }

  function saveNotesToStorage() {
    localStorage.setItem("baelz-notes", JSON.stringify(notes));
  }

  function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    document.body.classList.toggle("light-theme");
    
    const isDarkMode = document.body.classList.contains("dark-theme");
    localStorage.setItem("baelz-dark-mode", isDarkMode);
    
    // Update icon
    themeToggle.innerHTML = `<i class="material-icons">${
      isDarkMode ? "light_mode" : "dark_mode"
    }</i>`;
  }

  function checkTheme() {
    const isDarkMode = localStorage.getItem("baelz-dark-mode") === "true";
    if (isDarkMode) {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
      themeToggle.innerHTML = '<i class="material-icons">light_mode</i>';
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
      themeToggle.innerHTML = '<i class="material-icons">dark_mode</i>';
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
