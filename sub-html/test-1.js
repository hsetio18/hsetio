const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'questions.json';
const title = params.get('title') || '....'
// Update the page title not working
const titleElement = document.getElementById("quiz-title");
if (titleElement) {
    titleElement.textContent = decodeURIComponent(title);
}

