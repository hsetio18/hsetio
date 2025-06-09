let allQuestions = [];
let selectedQuestions = [];
let correctAnswers = {};

// Shuffle utility
function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Load questions from embedded JSON in index.html
function loadQuestions() {
  const jsonData = document.getElementById("quiz-data").textContent;
  allQuestions = JSON.parse(jsonData);
  newQuiz();
}

// Create a new quiz with 3 random questions
function newQuiz() {
  correctAnswers = {};
  selectedQuestions = shuffleArray(allQuestions).slice(0, 3);
  renderQuiz();
  document.getElementById('result').textContent = "";
}

// Display the selected questions with shuffled options
function renderQuiz() {
  const quizContainer = document.getElementById('quiz');
  quizContainer.innerHTML = "";

  selectedQuestions.forEach((q, idx) => {
    correctAnswers[q.id] = { answer: q.answer, explanation: q.explanation };

    let html = `<div class="question" id="${q.id}">
      <p>${idx + 1}. ${q.text}</p>`;

    shuffleArray(q.options).forEach(option => {
      html += `<label><input type="radio" name="${q.id}" value="${option}"> ${option}</label><br>`;
    });

    html += `<div class="feedback" id="feedback-${q.id}"></div></div>`;
    quizContainer.innerHTML += html;
  });
}

// Check user's answers and display feedback
function checkAnswers() {
  let score = 0;
  const total = selectedQuestions.length;

  selectedQuestions.forEach(q => {
    const selected = document.querySelector(`input[name="${q.id}"]:checked`);
    const correct = correctAnswers[q.id].answer;
    const explanation = correctAnswers[q.id].explanation;
    const feedback = document.getElementById(`feedback-${q.id}`);
    feedback.textContent = "";

    if (selected) {
      if (selected.value === correct) {
        score++;
        feedback.textContent = "✅ Correct!";
        feedback.className = "feedback correct";
      } else {
        feedback.textContent = `❌ Incorrect. ${explanation}`;
        feedback.className = "feedback incorrect";
      }
    } else {
      feedback.textContent = "⚠️ You did not answer this question.";
      feedback.className = "feedback incorrect";
    }
  });

  document.getElementById('result').textContent = `You scored ${score} out of ${total}.`;
  document.getElementById('result').className = "score-box";
}

// Reset selected options and feedback (for retry)
function retryQuiz() {
  selectedQuestions.forEach(q => {
    const radios = document.querySelectorAll(`input[name="${q.id}"]`);
    radios.forEach(r => r.checked = false);

    const feedback = document.getElementById(`feedback-${q.id}`);
    feedback.textContent = "";
    feedback.className = "feedback";
  });

  document.getElementById('result').textContent = "";
}

// Run on page load
window.onload = () => loadQuestions();
