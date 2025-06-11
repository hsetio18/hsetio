let problems = [];
let currentIndex = 0;
let currentVars = {};
let currentAnswer = {};

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
  const d = b * b - 4 *
