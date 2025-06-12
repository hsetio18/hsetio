function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
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

let problems = [];
let currentIndex = 0;
let currentVars = {};
let currentAnswer = {};
let jsonFile = getQueryParam("file") || "problems.json";
let quizTitle = getQueryParam("title") || "Math Quiz";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("quizTitle").innerText = decodeURIComponent(quizTitle);
  loadProblems();
});

function getRandomValue(mean, range, decimals) {
  const min = mean - range;
  const max = mean + range;
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function generateVariables(variableSpec) {
  const values = {};
  for (let key in variableSpec) {
    const spec = variableSpec[key];
    values[key] = getRandomValue(spec.mean, spec.range, spec.decimals);
  }
  return values;
}

function renderQuestion() {
  const problem = problems[currentIndex];
  currentVars = generateVariables(problem.variables);

  let question = problem.problem;
  for (let key in currentVars) {
    question = question.replace(`{${key}}`, currentVars[key]);
  }

  document.getElementById("questionText").innerText = question;

  const inputArea = document.getElementById("inputArea");
  inputArea.innerHTML = "";
  if (problem.answer_type === "number") {
    inputArea.innerHTML += `<label>Answer: <input type="number" id="numAnswer" /></label>`;
    currentAnswer = evaluateFormula(problem.formula, currentVars);
  }  
  document.getElementById("feedbackText").innerText = "";
}

function checkAnswer() {
const problem = problems[currentIndex];
let feedback = "";

if (problem.answer_type === "number") {
  const userAns = parseFloat(document.getElementById("numAnswer").value);
  const accuracy = problem.accuracy || 0.01;
  const decimals = problem.decimals || 2;
  const correct = Number(currentAnswer.toFixed(decimals));

  if (Math.abs(userAns - correct) < accuracy) {
    feedback = "✅ Correct!";
  } else {
    feedback = `❌ Incorrect. Correct answer: ${correct}`;
  }
  document.getElementById("feedbackText").innerText = feedback;
}

function nextQuestion() {
  currentIndex = (currentIndex + 1) % problems.length;
  renderQuestion();
}

async function loadProblems() {
  try {
    const res = await fetch(jsonFile);
    problems = await res.json();
    renderQuestion();
  } catch (err) {
    document.getElementById("questionText").innerText = "❌ Failed to load questions.";
    console.error("Error loading JSON:", err);
  }
}
