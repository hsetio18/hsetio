const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'problems.json';
const title = params.get('title') || 'Quiz';

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("quiz-title").textContent = decodeURIComponent(title);
  try {
    const response = await fetch(file);
    const problems = await response.json();
    renderQuestions(problems);
  } catch (error) {
    document.getElementById("quiz-container").textContent = "Error loading questions.";
    console.error(error);
  }
});

function generateVariables(varsSpec) {
  const result = {};
  for (const key in varsSpec) {
    const spec = varsSpec[key];
    const value =
      spec.mean +
      (Math.random() * 2 - 1) * spec.range;
    result[key] = parseFloat(value.toFixed(spec.decimals));
  }
  return result;
}

function formatQuestion(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = values[key];
    return val < 0 ? `− ${Math.abs(val)}` : `+ ${val}`;
  });
}

// function evaluateFormula(formula, values) {
//   const expr = formula.replace(/\{(\w+)\}/g, (_, key) => values[key]);
//   try {
//     return eval(expr);
//   } catch (err) {
//     console.error("Evaluation error:", expr, err);
//     return NaN;
//   }
// }
function evaluateFormula(formula, values) {
  const expr = formula.replace(/\{(\w+)\}/g, (_, key) => {
    if (!(key in values)) {
      console.warn(`Missing variable: ${key}`);
      return "0";
    }
    return values[key];
  });

  try {
    const result = eval(expr);
    if (isNaN(result)) {
      console.warn(`NaN result from expression: ${expr}`);
    }
    return result;
  } catch (err) {
    console.error("Evaluation error:", expr, err);
    return NaN;
  }
}

function renderQuestions(problems) {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";
  const state = [];

  problems.forEach((problem, idx) => {
    const vars = generateVariables(problem.variables);
    const displayed = formatQuestion(problem.problem, vars);
    const answer = evaluateFormula(problem.formula, vars);
    const div = document.createElement("div");
    div.className = "question-block";
    div.innerHTML = `
      <p><strong>Q${idx + 1}:</strong> ${displayed}</p>
      <input type="number" step="any" id="answer-${idx}" />
    `;
    container.appendChild(div);
    state.push({ problem, vars, answer, element: div });
  });

  const checkButton = document.createElement("button");
  checkButton.textContent = "Check";
  checkButton.onclick = () => checkAnswers(state);
  container.appendChild(checkButton);
}

function checkAnswers(state) {
  let score = 0;

  state.forEach((item, idx) => {
    const userInput = parseFloat(document.getElementById(`answer-${idx}`).value);
    const correct = parseFloat(item.answer.toFixed(item.problem.decimals));
    const accuracy = item.problem.accuracy || 0.01;
    const explanation = item.problem.explanation || "";

    const feedback = document.createElement("div");

    if (Math.abs(userInput - correct) <= accuracy) {
      feedback.innerHTML = `<p style="color:green">Correct! ✅</p>`;
      score++;
    } else {
      feedback.innerHTML = `
        <p style="color:red">Incorrect ❌</p>
        <p>Correct Answer: ${correct}</p>
        ${explanation ? `<p><em>${explanation}</em></p>` : ""}
      `;
    }

    item.element.appendChild(feedback);
  });

  const summary = document.createElement("div");
  summary.innerHTML = `<h3>Your Score: ${score} / ${state.length}</h3>`;
  document.getElementById("quiz-container").appendChild(summary);
}
