const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'problems.json';
const title = params.get('title') || 'My Quiz';
document.getElementById("quiz-title").textContent = decodeURIComponent(title);

let problemsData = []; // Store problems with random values

function generateRandomValue(spec) {
  const { mean, range, decimals } = spec;
  const value = mean + (Math.random() * 2 - 1) * range;
  return Number(value.toFixed(decimals));
}

function replaceVariables(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key]);
}

function evaluateFormula(formula, values) {
  const expression = replaceVariables(formula, values);
  try {
    return eval(expression);
  } catch (e) {
    console.error("Formula error:", expression);
    return null;
  }
}

fetch(file)
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById("questions");
    problemsData = data.map((problem, index) => {
      const variables = {};
      for (const key in problem.variables) {
        variables[key] = generateRandomValue(problem.variables[key]);
      }

      const questionText = replaceVariables(problem.problem, variables);

      const div = document.createElement("div");
      div.className = "question-block";
      div.innerHTML = `
        <strong>Q${index + 1}:</strong> ${questionText}<br>
        <input type="number" id="answer-${index}" step="any">
      `;
      container.appendChild(div);

      const correct = evaluateFormula(problem.formula, variables);
      return {
        ...problem,
        variables,
        userAnswer: null,
        correctAnswer: Number(correct.toFixed(problem.decimals))
      };
    });
  })
  .catch(error => {
    document.getElementById("questions").innerHTML = "Error loading questions.";
    console.error("Error:", error);
  });

document.getElementById("check-button").addEventListener("click", () => {
  let score = 0;
  const results = [];

  problemsData.forEach((p, i) => {
    const input = document.getElementById(`answer-${i}`);
    const userVal = Number(input.value);
    const correct = p.correctAnswer;
    const accuracy = p.accuracy || 0.01;

    const correctText = `Correct answer: ${correct} (from formula: ${p.formula})`;

    if (Math.abs(userVal - correct) <= accuracy) {
      score++;
      results.push(`<p>Q${i + 1}: ✅ Correct<br>${correctText}</p>`);
    } else {
      results.push(`<p>Q${i + 1}: ❌ Incorrect. You answered ${userVal}<br>${correctText}</p>`);
    }
  });

  const resultBox = document.getElementById("result");
  resultBox.innerHTML = `<h3>Your Score: ${score} / ${problemsData.length}</h3>` + results.join("");
});
