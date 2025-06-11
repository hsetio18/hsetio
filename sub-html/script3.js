// script3.js
let allQuestions = [];
let selectedQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let startTime = null;

const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'questions.json';
const title = params.get('title') || 'Sequential Quiz';

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadQuestions() {
  fetch(file + '?' + new Date().getTime())
    .then(response => response.json())
    .then(data => {
      allQuestions = data;
      const numInput = document.getElementById('numInput');
      numInput.max = allQuestions.length;
      numInput.value = allQuestions.length;
    })
    .catch(error => {
      console.error("Error loading questions:", error);
      document.getElementById('quiz').textContent = "Failed to load questions.";
    });
}

function startQuiz() {
  const numInput = document.getElementById('numInput');
  const numQuestions = Math.min(parseInt(numInput.value), allQuestions.length);
  selectedQuestions = shuffleArray([...allQuestions]).slice(0, numQuestions);
  currentQuestionIndex = 0;
  correctAnswers = 0;
  startTime = new Date();
  document.getElementById('setup').style.display = 'none';
  document.getElementById('quiz').style.display = 'block';
  document.getElementById('actions').style.display = 'block';
  document.getElementById('result').innerHTML = '';
  showQuestion();
}

function showQuestion() {
  const quizContainer = document.getElementById('quiz');
  quizContainer.innerHTML = '';
  const q = selectedQuestions[currentQuestionIndex];
  const div = document.createElement('div');

  const questionTitle = document.createElement('p');
  questionTitle.innerHTML = `<strong>Q${currentQuestionIndex + 1}:</strong> ${q.text}`;
  div.appendChild(questionTitle);

  const options = shuffleArray([...q.options]);
  options.forEach(option => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="radio" name="q" value="${option}"> ${option}
    `;
    div.appendChild(label);
    div.appendChild(document.createElement('br'));
  });

  quizContainer.appendChild(div);
}

function nextQuestion() {
  const selected = document.querySelector('input[name="q"]:checked');
  const correct = selectedQuestions[currentQuestionIndex].answer;
  if (selected && selected.value === correct) {
    correctAnswers++;
  }

  currentQuestionIndex++;
  if (currentQuestionIndex < selectedQuestions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const endTime = new Date();
  document.getElementById('quiz').style.display = 'none';
  document.getElementById('actions').style.display = 'none';

  const result = document.getElementById('result');
  result.innerHTML = `
    <h3>Result</h3>
    <p>Score: ${correctAnswers} / ${selectedQuestions.length}</p>
    <p>Start Time: ${startTime.toLocaleTimeString()}</p>
    <p>Finish Time: ${endTime.toLocaleTimeString()}</p>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const titleElement = document.getElementById('quiz-title');
  if (titleElement) {
    titleElement.textContent = decodeURIComponent(title);
  }

  loadQuestions();
  document.getElementById('start-btn').addEventListener('click', startQuiz);
  document.getElementById('next-btn').addEventListener('click', nextQuestion);
});
