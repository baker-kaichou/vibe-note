// Get the note editor, save button, and theme switcher elements
const noteEditor = document.getElementById('note-editor');
const saveButton = document.getElementById('save-button');
const themeSwitcher = document.getElementById('theme-switcher');

// Add event listener to the save button
saveButton.addEventListener('click', () => {
    // Get the note content
    const noteContent = noteEditor.value;

    // Create a blob with the note content
    const blob = new Blob([noteContent], { type: 'text/plain' });

    // Create a link to download the blob
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'note.txt';

    // Simulate a click on the link to download the blob
    link.click();

    // Clean up
    URL.revokeObjectURL(link.href);
});

// Add event listener to the theme switcher
themeSwitcher.addEventListener('click', () => {
    // Toggle dark mode
    document.body.classList.toggle('dark-mode');

    // Update the theme switcher icon
    const icon = themeSwitcher.querySelector('.material-symbols-outlined');
    if (document.body.classList.contains('dark-mode')) {
        icon.textContent = 'light_mode';
    } else {
        icon.textContent = 'dark_mode';
    }
});

// Add event listener to the window beforeunload event
window.addEventListener('beforeunload', () => {
    // Clear the note editor content
    noteEditor.value = '';
});
