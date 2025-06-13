const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'problems.json';
const title = params.get('title') || 'My Quiz';
document.getElementById("quiz-title").textContent = decodeURIComponent(title);

let problemsData = [];

function generateRandomValue(spec) {
  const { mean, range, decimals } = spec;
  const value = mean + (Math.random() * 2 - 1) * range;
  return Number(value.toFixed(decimals));
}

function replaceVariables(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key]);
}

function evaluateFormula(formula, values) {
  try {
    const expr = replaceVariables(formula, values);
    return eval(expr);
  } catch (e) {
    console.error("Error evaluating formula:", formula, e);
    return NaN;
  }
}

fetch(file)
  .then(response => {
    if (!response.ok) throw new Error("File not found");
    return response.json();
  })
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
        <input type="number" id="answer-${index}" step="any"><br><br>
      `;
      container.appendChild(div);

      const correct = evaluateFormula(problem.formula, variables);
      return {
        ...problem,
        variables,
        correctAnswer: Number(correct.toFixed(problem.decimals))
      };
    });
  })
  .catch(error => {
    document.getElementById("questions").innerHTML = "❌ Error loading questions.";
    console.error("Load error:", error);
  });

document.getElementById("check-button").addEventListener("click", () => {
  const resultBox = document.getElementById("result");
  let score = 0;
  const output = [];

  problemsData.forEach((p, i) => {
    const input = document.getElementById(`answer-${i}`);
    const userVal = Number(input.value);
    const correct = p.correctAnswer;
    const accuracy = p.accuracy || 0.01;

    const isCorrect = Math.abs(userVal - correct) <= accuracy;
    if (isCorrect) score++;

    output.push(`<p>Q${i + 1}: ${isCorrect ? "✅ Correct" : `❌ Incorrect (you answered ${userVal})`}<br>
      Correct answer: ${correct} (from formula: ${p.formula})</p>`);
  });

  resultBox.innerHTML = `<h3>Your Score: ${score} / ${problemsData.length}</h3>` + output.join("");
});
