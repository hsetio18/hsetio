function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
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

  if (problem.answer_type === "2roots") {
    inputArea.innerHTML += `<label>x₁: <input type="number" id="x1" /></label><br>`;
    inputArea.innerHTML += `<label>x₂: <input type="number" id="x2" /></label>`;
    currentAnswer = solveQuadratic(currentVars.a, currentVars.b, currentVars.c);
  } else if (problem.answer_type === "number") {
    inputArea.innerHTML += `<label>Answer: <input type="number" id="numAnswer" /></label>`;

    if (problem.formula === "cube_volume") {
      currentAnswer = solveCubeVolume(currentVars.s);
    } else if (problem.formula === "circle_area") {
      currentAnswer = solveCircleArea(currentVars.r);
    } else if (problem.formula === "simple_interest") {
      currentAnswer = solveSimpleInterest(currentVars.p, currentVars.r, currentVars.t);
    }
  }

  document.getElementById("feedbackText").innerText = "";
}

function solveQuadratic(a, b, c) {
  const d = b * b - 4 * a * c;
  if (d < 0) return { x1: null, x2: null };
  const sqrtD = Math.sqrt(d);
  const x1 = ((-b + sqrtD) / (2 * a)).toFixed(2);
  const x2 = ((-b - sqrtD) / (2 * a)).toFixed(2);
  return { x1: Number(x1), x2: Number(x2) };
}

function solveCubeVolume(s) {
  return Number((s ** 3).toFixed(2));
}

function solveCircleArea(r) {
  return Number((3.14 * r * r).toFixed(2));
}

function solveSimpleInterest(p, r, t) {
  return Number((p * r * t / 100).toFixed(2));
}

function checkAnswer() {
  const problem = problems[currentIndex];
  let feedback = "";

  if (problem.answer_type === "2roots") {
    const userX1 = parseFloat(document.getElementById("x1").value);
    const userX2 = parseFloat(document.getElementById("x2").value);
    const correct = [currentAnswer.x1, currentAnswer.x2];
    const user = [userX1, userX2];

    const match = correct.every(c =>
      user.some(u => Math.abs(u - c) < 0.01)
    );

    feedback = match
      ? "✅ Correct!"
      : `❌ Incorrect. Correct roots: x₁ = ${correct[0]}, x₂ = ${correct[1]}`;
  } else if (problem.answer_type === "number") {
    const userAns = parseFloat(document.getElementById("numAnswer").value);
    const correct = currentAnswer;
    if (Math.abs(userAns - correct) < 0.01) {
      feedback = "✅ Correct!";
    } else {
      feedback = `❌ Incorrect. Correct answer: ${correct}`;
    }
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
