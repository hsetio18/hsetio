let allQuestions = [];
let selectedQuestions = [];
let correctAnswers = {};
function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}
function loadQuestions(callback) {
  fetch('questions.json')
    .then(res => res.json())
    .then(data => {
      allQuestions = data;
      newQuiz(); // Load the first quiz automatically
    });
}

function newQuiz() {
  correctAnswers = {};
  selectedQuestions = allQuestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  renderQuiz();
  document.getElementById('result').textContent = "";
}

function renderQuiz() {
  const quizContainer = document.getElementById('quiz');
  quizContainer.innerHTML = "";

  selectedQuestions.forEach((q, idx) => {
    correctAnswers[q.id] = { answer: q.answer, explanation: q.explanation };

    let html = `<div class="question" id="${q.id}">
      <p>${idx + 1}. ${q.text}</p>`;

    // 👇 Shuffle options here
    shuffleArray(q.options).forEach(option => {
      const val = option.charAt(0);
      html += `<label><input type="radio" name="${q.id}" value="${val}"> ${option}</label><br>`;
    });

    html += `<div class="feedback" id="feedback-${q.id}"></div></div>`;
    quizContainer.innerHTML += html;
  });
}

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
        feedback.textContent = "Correct!";
        feedback.className = "feedback correct";
      } else {
        feedback.textContent = `Incorrect. ${explanation}`;
        feedback.className = "feedback incorrect";
      }
    } else {
      feedback.textContent = "You did not answer this question.";
      feedback.className = "feedback incorrect";
    }
  });

  document.getElementById('result').textContent = `You scored ${score} out of ${total}.`;
  document.getElementById('result').className = "score-box";
}

function retryQuiz() {
  // Just clear selected answers and feedback
  selectedQuestions.forEach(q => {
    const radios = document.querySelectorAll(`input[name="${q.id}"]`);
    radios.forEach(r => r.checked = false);

    const feedback = document.getElementById(`feedback-${q.id}`);
    feedback.textContent = "";
    feedback.className = "feedback";
  });

  document.getElementById('result').textContent = "";
}

window.onload = () => loadQuestions();
