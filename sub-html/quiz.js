const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'problems.json';
const title = params.get('title') || 'Quiz';

let allQuestions = [];
let selectedQuestions = [];
let currentIndex = 0;
let userAnswers = [];
let score = 0;

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("quiz-title").textContent = decodeURIComponent(title);
  try {
    const response = await fetch(file);
    allQuestions = await response.json();
    document.getElementById("question-count").textContent = allQuestions.length;
    document.getElementById("num-questions").max = allQuestions.length;
  } catch (err) {
    document.getElementById("setup-screen").innerHTML = `<p>Error loading questions: ${err.message}</p>`;
  }
});

document.getElementById("start-quiz").onclick = () => {
  const n = parseInt(document.getElementById("num-questions").value);
  if (isNaN(n) || n < 1 || n > allQuestions.length) {
    alert("Please enter a valid number between 1 and " + allQuestions.length);
    return;
  }
  selectedQuestions = shuffle(allQuestions).slice(0, n);
  document.getElementById("setup-screen").style.display = 'none';
  document.getElementById("quiz-screen").style.display = 'block';
  showQuestion();
};

document.getElementById("next-btn").onclick = () => {
  const input = document.querySelector("#quiz-input input, #quiz-input select");
  const userInput = input?.value;
  const q = selectedQuestions[currentIndex];

  let correct = false;
  let correctAnswer = null;
  let explanation = q.explanation || "";

  if (q.answer_type === "number") {
    const val = parseFloat(userInput);
    const expected = eval(substitute(q.formula, q.variables));
    correct = Math.abs(val - expected) <= (q.accuracy || 0.01);
    correctAnswer = expected.toFixed(q.decimals || 2);
  } else if (q.answer_type === "mc") {
    correct = userInput === q.correct_choice;
    correctAnswer = q.correct_choice;
  }

  if (correct) score++;

  userAnswers.push({
    question: renderText(q),
    userInput,
    correctAnswer,
    correct,
    explanation
  });

  currentIndex++;
  if (currentIndex < selectedQuestions.length) {
    showQuestion();
  } else {
    document.getElementById("quiz-screen").style.display = 'none';
    document.getElementById("result-screen").style.display = 'block';
    document.getElementById("final-score").textContent = `You got ${score} out of ${selectedQuestions.length}`;
  }
};

document.getElementById("review-btn").onclick = () => {
  document.getElementById("result-screen").style.display = 'none';
  document.getElementById("review-screen").style.display = 'block';

  const list = document.getElementById("review-list");
  list.innerHTML = "";
  userAnswers.forEach((item, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>Q${i + 1}:</strong> ${item.question}</p>
      <p>Your answer: ${item.userInput}</p>
      <p>Correct answer: ${item.correctAnswer}</p>
      <p>${item.correct ? '✅ Correct' : '❌ Incorrect'}</p>
      <p><em>${item.explanation}</em></p>
      <hr>
    `;
    list.appendChild(div);
  });
};

function showQuestion() {
  const q = selectedQuestions[currentIndex];
  document.getElementById("quiz-question").innerHTML = `<strong>Q${currentIndex + 1}:</strong> ${renderText(q)}`;

  const inputBox = document.getElementById("quiz-input");
  inputBox.innerHTML = "";

  if (q.answer_type === "number") {
    inputBox.innerHTML = `<input type="number" step="any" placeholder="Your answer">`;
  } else if (q.answer_type === "mc") {
    const select = document.createElement("select");
    q.choices.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });
    inputBox.appendChild(select);
  }
}

function renderText(q) {
  let txt = q.problem;
  if (q.variables) {
    for (const [k, v] of Object.entries(q.variables)) {
      const rand = v.mean + (Math.random() * 2 - 1) * v.range;
      const rounded = parseFloat(rand.toFixed(v.decimals));
      txt = txt.replaceAll(`{${k}}`, rounded);
      q.variables[k].__value = rounded;
    }
  }
  return txt;
}

function substitute(expr, vars) {
  for (const [k, v] of Object.entries(vars)) {
    expr = expr.replaceAll(`{${k}}`, `(${v.__value})`);
  }
  expr = expr.replace(/\bsqrt\(/g, "Math.sqrt(");
  return expr;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
