let problems = [];
let currentIndex = 0;
let currentVars = {};
let currentAnswer = null;

// Utility to get file and title from URL
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    file: params.get("file") || "problems.json",
    title: params.get("title") || "Math Quiz"
  };
}

// Generate a random variable
function generateValue(spec) {
  const offset = (Math.random() - 0.5) * 2 * spec.range;
  const value = spec.mean + offset;
  return Number(value.toFixed(spec.decimals));
}

// Format signed numbers for display
function formatSigned(value) {
  const num = Number(value);
  return (num >= 0 ? "+ " : "- ") + Math.abs(num);
}

// Evaluate formula after replacing variables
function evaluateFormula(formula, vars) {
  let expr = formula;
  for (let key in vars) {
    expr = expr.replaceAll(`{${key}}`, vars[key]);
  }
  try {
    return eval(expr);
  } catch (e) {
    console.error("Error evaluating formula:", expr);
    return null;
  }
}

// Render current question
function renderQuestion() {
  const problem = problems[currentIndex];
  const inputArea = document.getElementById("inputArea");
  inputArea.innerHTML = "";

  // Generate variable values
  currentVars = {};
  for (let key in problem.variables) {
    currentVars[key] = generateValue(problem.variables[key]);
  }

  // Display the question with signed values
  let questionText = problem.problem;
  for (let key in currentVars) {
    const signed = formatSigned(currentVars[key]);
    questionText = questionText.replace(`{${key}}`, signed);
  }
  document.getElementById("question").textContent = questionText;

  // Input field
  if (problem.answer_type === "number") {
    inputArea.innerHTML = `<label>Answer: <input type="number" id="numAnswer" step="any" /></label>`;
    currentAnswer = evaluateFormula(problem.formula, currentVars);
  }

  document.getElementById("feedback").textContent = "";
  document.getElementById("submitBtn").disabled = false;
  document.getElementById("nextBtn").style.display = "none";
}

// Check user answer
function checkAnswer() {
  const problem = problems[currentIndex];
  const feedbackEl = document.getElementById("feedback");

  let userAns = parseFloat(document.getElementById("numAnswer").value);
  const decimals = problem.decimals || 2;
  const accuracy = problem.accuracy || 0.01;
  const correct = Number(currentAnswer.toFixed(decimals));

  if (isNaN(userAns)) {
    feedbackEl.textContent = "❗ Please enter a valid number.";
    return;
  }

  if (Math.abs(userAns - correct) <= accuracy) {
    feedbackEl.textContent = "✅ Correct!";
    feedbackEl.style.color = "green";
  } else {
    feedbackEl.textContent = `❌ Incorrect. Correct answer: ${correct}`;
    feedbackEl.style.color = "red";
  }

  document.getElementById("submitBtn").disabled = true;
  document.getElementById("nextBtn").style.display = "inline";
}

// Load JSON and initialize
async function startQuiz() {
  const { file, title } = getQueryParams();
  document.getElementById("title").textContent = decodeURIComponent(title);

  try {
    const response = await fetch(file);
    problems = await response.json();
    renderQuestion();
  } catch (e) {
    document.getElementById("question").textContent = "❌ Failed to load problems.";
    console.error(e);
  }
}

// Next question
function nextQuestion() {
  currentIndex = (currentIndex + 1) % problems.length;
  renderQuestion();
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
  startQuiz();
  document.getElementById("submitBtn").addEventListener("click", checkAnswer);
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
});
