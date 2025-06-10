let allQuestions = [];
let selectedQuestions = [];
let correctAnswers = {};
let NUM_QUESTIONS = 5;

// Get parameters from URL
function getParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    file: urlParams.get('file') || 'questions.json',
    num: parseInt(urlParams.get('num')) || 5
  };
}

// Shuffle array helper
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Load questions
function loadQuestions() {
  const { file, num } = getParams();
  fetch(file + '?' + new Date().getTime()) // Bypass cache
    .then(response => response.json())
    .then(data => {
      allQuestions = data;
      NUM_QUESTIONS = Math.min(num, allQuestions.length);
      newQuiz();
    })
    .catch(error => {
      console.error("Error loading questions:", error);
      document.getElementById('quiz').textContent = "Failed to load questions.";
    });
}

// Start a new quiz
function newQuiz() {
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

  document.getElementById('check-btn').style.display = 'inline-block';
  document.getElementById('retry-btn').style.display = 'inline-block';
  document.getElementById('new-btn').style.display = 'inline-block';
}

// Check answers
function checkAnswers() {
  selectedQuestions.forEach((q, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    const explanationDiv = document.getElementById(`explanation-q${index}`);

    if (!selected) {
      explanationDiv.innerHTML = `<span style="color: orange;">Please select an option.</span>`;
      return;
    }

    if (selected.value === correctAnswers[`q${index}`]) {
      explanationDiv.innerHTML = `<span style="color: green;">Correct!</span><br>${q.explanation}`;
    } else {
      explanationDiv.innerHTML = `<span style="color: red;">Wrong. Correct answer: ${correctAnswers[`q${index}`]}</span><br>${q.explanation}`;
    }
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();
  document.getElementById('check-btn').addEventListener('click', checkAnswers);
  document.getElementById('retry-btn').addEventListener('click', () => {
    newQuiz();
  });
  document.getElementById('new-btn').addEventListener('click', () => {
    loadQuestions(); // pick new set of random questions
  });
});
