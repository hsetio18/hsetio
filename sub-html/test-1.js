const params = new URLSearchParams(window.location.search);
const title = params.get('title') || 'Default Quiz Title';
const titleElement = document.getElementById("quiz-title");

if (titleElement) {
  titleElement.textContent = decodeURIComponent(title);
}
