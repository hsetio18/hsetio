const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'questions.json';
const title = params.get('title') || '....';


// Update the page title (e.g., in <h1 id="quiz-title">...</h1>)
// document.addEventListener("DOMContentLoaded", () => {
  const titleElement = document.getElementById("quiz-title");
  if (titleElement) {
    titleElement.textContent = decodeURIComponent(title);
  }
//});
