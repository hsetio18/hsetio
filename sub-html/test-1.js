const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'problems.json';
const title = params.get('title') || 'Quiz';

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("quiz-title").textContent = decodeURIComponent(title);

  try {
    const response = await fetch(file);
    const problems = await response.json();
    showProblems(problems);
  } catch (err) {
    document.getElementById("quiz-container").innerHTML = `<p>Error loading questions: ${err.message}</p>`;
  }
});

function showProblems(problems) {
  const container = document.createElement("div");
  container.id = "quiz-list";

  problems.forEach((q, index) => {
    const values = {};
    let problemText = q.problem;

    // Generate random values for each variable
    for (const [key, spec] of Object.entries(q.variables)) {
      const rand = (spec.mean + (Math.random() * 2 - 1) * spec.range);
      const rounded = parseFloat(rand.toFixed(spec.decimals));
      values[key] = rounded;
      // Display nicely: handle sign
      const displayVal = rounded >= 0 ? `+ ${rounded}` : `− ${Math.abs(rounded)}`;
      problemText = problemText.replaceAll(`{${key}}`, displayVal);
    }

    // Create question block
    const qDiv = document.createElement("div");
    qDiv.className = "question";
    qDiv.innerHTML = `
      <p><strong>Q${index + 1}:</strong> ${problemText}</p>
      <input type="number" step="any" id="answer-${index}" placeholder="Your answer">
      <div id="feedback-${index}"></div>
    `;

    // Save data for checking
    q.__values = values;
    q.__expression = substituteVariables(q.formula, values);

    container.appendChild(qDiv);
  });

  // Add Check button
  const checkBtn = document.createElement("button");
  checkBtn.textContent = "Check";
  checkBtn.onclick = () => checkAnswers(problems);
  container.appendChild(document.createElement("br"));
  container.appendChild(checkBtn);

  // Inject to page
  const quizContainer = document.getElementById("quiz-container") || document.body;
  quizContainer.innerHTML = ""; // Clear loading
  quizContainer.appendChild(container);
}

// Replace {x} with (value) to ensure safe evaluation
function substituteVariables(expr, values) {
  for (const [key, value] of Object.entries(values)) {
    expr = expr.replaceAll(`{${key}}`, `(${value})`);
  }
  // Allow 'sqrt' instead of Math.sqrt
  expr = expr.replace(/\bsqrt\(/g, "Math.sqrt(");
  return expr;
}

function checkAnswers(problems) {
  problems.forEach((q, index) => {
    const input = document.getElementById(`answer-${index}`);
    const feedback = document.getElementById(`feedback-${index}`);
    const userVal = parseFloat(input.value);
    let correct = false;
    let computed = NaN;

    try {
      computed = eval(q.__expression);
      computed = parseFloat(computed.toFixed(q.decimals));
      correct = Math.abs(computed - userVal) <= q.accuracy;
    } catch (err) {
      feedback.innerHTML = `<p style="color:red">Error evaluating expression.</p>`;
      return;
    }

    if (!isFinite(computed)) {
      feedback.innerHTML = `<p style="color:red">Result is invalid: ${computed}</p>`;
      return;
    }

    feedback.innerHTML = `
      ${correct ? "✅ Correct!" : "❌ Incorrect"}
      <br>Correct Answer: ${computed}
      <br>${q.explanation || ""}
    `;
  });
}
