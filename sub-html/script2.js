let allQuestions = [];
let selectedQuestions = [];
let correctAnswers = {};
let NUM_QUESTIONS = 5;
let startTime = null;
// Extract URL parameters
const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'questions.json';
const title = params.get('title') || 'Quiz';

// Update the page title (e.g., in <h1 id="quiz-title">...</h1>)
document.addEventListener("DOMContentLoaded", () => {
  const titleElement = document.getElementById("quiz-title");
  if (titleElement) {
    titleElement.textContent = decodeURIComponent(title);
  }
});
function getParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    file: urlParams.get('file') || 'questions.json'
  };
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadQuestions() {
  const { file } = getParams();
  fetch(file + '?' + new Date().getTime())
    .then(response => response.json())
    .then(data => {
      allQuestions = data;
      document.getElementById('numInput').max = allQuestions.length;
    })
    .catch(error => {
      console.error("Error loading questions:", error);
      document.getElementById('quiz').textContent = "Failed to load questions.";
    });
}

function startQuiz() {
  NUM_QUESTIONS = parseInt(document.getElementById('numInput').value) || 1;
  NUM_QUESTIONS = Math.min(NUM_QUESTIONS, allQuestions.length);
  startTime = new Date();

  const quizContainer = document.getElementById('quiz');
  quizContainer.innerHTML = '';
  correctAnswers = {};
  selectedQuestions = shuffleArray([...allQuestions]).slice(0, NUM_QUESTIONS);

  selectedQuestions.forEach((q, index) => {
    const div = document.createElement('div');
    div.classList.add('question-block');

    const questionTitle = document.createElement('p');
    questionTitle.innerHTML = `<strong>Q${index + 1}:</strong> ${q.text}`;
    div.appendChild(questionTitle);

    const options = shuffleArray([...q.options]);
    correctAnswers[`q${index}`] = q.answer;

    options.forEach(option => {
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="radio" name="q${index}" value="${option}">
        ${option}
      `;
      div.appendChild(label);
      div.appendChild(document.createElement('br'));
    });

    const explanation = document.createElement('div');
    explanation.classList.add('explanation');
    explanation.id = `explanation-q${index}`;
    div.appendChild(explanation);

    quizContainer.appendChild(div);
  });

  document.getElementById('actions').style.display = 'block';
  document.getElementById('result').innerHTML = '';
}

function checkAnswers() {
  let score = 0;
  const endTime = new Date();

  selectedQuestions.forEach((q, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    const explanationDiv = document.getElementById(`explanation-q${index}`);
    const correct = correctAnswers[`q${index}`];

    if (selected && selected.value === correct) {
      explanationDiv.innerHTML = `<span style="color: green;">Correct!</span><br>${q.explanation}`;
      score++;
    } else if (selected) {
      explanationDiv.innerHTML = `<span style="color: red;">Wrong. Correct answer: ${correct}</span><br>${q.explanation}`;
    } else {
      explanationDiv.innerHTML = `<span style="color: orange;">No answer selected.</span>`;
    }
  });

  const result = document.getElementById('result');
  result.innerHTML = `
    <h3>Result</h3>
    <p>Score: ${score} / ${NUM_QUESTIONS}</p>
    <p>Start Time: ${startTime.toLocaleTimeString()}</p>
    <p>Finish Time: ${endTime.toLocaleTimeString()}</p>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();
  document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('setup').style.display = 'none';
    startQuiz();
  });
  document.getElementById('check-btn').addEventListener('click', checkAnswers);
  document.getElementById('retry-btn').addEventListener('click', startQuiz);
  document.getElementById('new-btn').addEventListener('click', () => {
    location.reload();
  });
});
