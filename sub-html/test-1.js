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

    // Generate and substitute random variables
    let isFirst = true;
    for (const [key, spec] of Object.entries(q.variables)) {
      const rand = (spec.mean + (Math.random() * 2 - 1) * spec.range);
      const rounded = parseFloat(rand.toFixed(spec.decimals));
      values[key] = rounded;

      // Format with proper math signs
      let displayVal;
      if (isFirst) {
        displayVal = (rounded < 0) ? `− ${Math.abs(rounded)}` : `${rounded}`;
        isFirst = false;
      } else {
        displayVal = (rounded < 0) ? `− ${Math.abs(rounded)}` : `+ ${rounded}`;
      }

      problemText = problemText.replaceAll(`{${key}}`, displayVal);
    }

    // Create question container
    const qDiv = document.createElement("div");
    qDiv.className = "question";
    qDiv.innerHTML = `<p><strong>Q${index + 1}:</strong> ${problemText}</p>`;

    const subqs = q.subquestions || [{ formula: q.formula, explanation: q.explanation }];

    subqs.forEach((subq, subindex) => {
      const inputId = `answer-${index}-${subindex}`;
      qDiv.innerHTML += `
        <label>Part ${subqs.length > 1 ? String.fromCharCode(97 + subindex) : ''}:</label>
        <input type="number" step="any" id="${inputId}" placeholder="Your answer">
        <div id="feedback-${index}-${subindex}"></div>
      `;
    });

    // Store expressions and values
    q.__values = values;
    q.__expressions = subqs.map(sq => substituteVariables(sq.formula, values));
    q.__explanations = subqs.map(sq => sq.explanation || "");

    container.appendChild(qDiv);
  });

  // Check button
  const checkBtn = document.createElement("button");
  checkBtn.textContent = "Check";
  checkBtn.onclick = () => checkAnswers(problems);
  container.appendChild(document.createElement("br"));
  container.appendChild(checkBtn);

  // Render on page
  const quizContainer = document.getElementById("quiz-container") || document.body;
  quizContainer.innerHTML = "";
  quizContainer.appendChild(container);
}

// Replace {x} with (value) and support sqrt
function substituteVariables(expr, values) {
  for (const [key, value] of Object.entries(values)) {
    // Wrap negative numbers for eval safety
    const safeVal = (value < 0) ? `(${value})` : value;
    expr = expr.replaceAll(`{${key}}`, safeVal);
  }
  // Allow 'sqrt' keyword
  expr = expr.replace(/\bsqrt\(/g, "Math.sqrt(");
  return expr;
}

function checkAnswers(problems) {
  problems.forEach((q, index) => {
    q.__expressions.forEach((expr, subindex) => {
      const input = document.getElementById(`answer-${index}-${subindex}`);
      const feedback = document.getElementById(`feedback-${index}-${subindex}`);
      const userVal = parseFloat(input.value);
      const decimals = q.decimals || 2;
      const accuracy = q.accuracy || 0.01;

      let computed = NaN;
      let correct = false;

      try {
        computed = eval(expr);
        computed = parseFloat(computed.toFixed(decimals));
        correct = Math.abs(computed - userVal) <= accuracy;
      } catch (err) {
        feedback.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
        return;
      }

      if (!isFinite(computed)) {
        feedback.innerHTML = `<p style="color:red">Invalid result: ${computed}</p>`;
        return;
      }

      feedback.innerHTML = `
        ${correct ? "✅ Correct!" : "❌ Incorrect"}
        <br>Correct Answer: ${computed}
        <br>${q.__explanations[subindex]}
      `;
    });
  });
}
