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

  problems.forEach((q, qIndex) => {
    const values = {};
    let problemText = q.problem;

    // Generate random values
    for (const [key, spec] of Object.entries(q.variables)) {
      const rand = spec.mean + (Math.random() * 2 - 1) * spec.range;
      const rounded = parseFloat(rand.toFixed(spec.decimals));
      values[key] = rounded;
      const displayVal = rounded >= 0 ? `+ ${rounded}` : `− ${Math.abs(rounded)}`;
      problemText = problemText.replaceAll(`{${key}}`, displayVal);
    }

    const qDiv = document.createElement("div");
    qDiv.className = "question";
    qDiv.innerHTML = `<p><strong>Q${qIndex + 1}:</strong> ${problemText}</p>`;

    // Support for subquestions or a single question
    const subqs = q.subquestions || [q];
    q.__results = {}; // store intermediate results
    q.__subs = []; // keep reference to subquestions

    subqs.forEach((subq, i) => {
      const inputId = `answer-${qIndex}-${i}`;

      const subDiv = document.createElement("div");
      subDiv.innerHTML = `
        <p>${subq.label || ""}</p>
        <input type="number" step="any" id="${inputId}" placeholder="Your answer">
        <div id="feedback-${qIndex}-${i}"></div>
      `;

      qDiv.appendChild(subDiv);
      q.__subs.push({ ...subq, inputId, feedbackId: `feedback-${qIndex}-${i}` });
    });

    q.__values = values;
    container.appendChild(qDiv);
  });

  const checkBtn = document.createElement("button");
  checkBtn.textContent = "Check";
  checkBtn.onclick = () => checkAnswers(problems);
  container.appendChild(document.createElement("br"));
  container.appendChild(checkBtn);

  const quizContainer = document.getElementById("quiz-container") || document.body;
  quizContainer.innerHTML = "";
  quizContainer.appendChild(container);
}

function substituteVariables(expr, values) {
  for (const [key, value] of Object.entries(values)) {
    expr = expr.replaceAll(`{${key}}`, `(${value})`);
  }
  expr = expr.replace(/\bsqrt\(/g, "Math.sqrt(");
  return expr;
}

function checkAnswers(problems) {
  problems.forEach((q, qIndex) => {
    const values = { ...q.__values }; // make a copy to store intermediate results

    q.__subs.forEach((subq, i) => {
      const input = document.getElementById(subq.inputId);
      const feedback = document.getElementById(subq.feedbackId);
      const userVal = parseFloat(input.value);
      let correct = false;
      let computed = NaN;

      try {
        let expr = substituteVariables(subq.formula, values);
        computed = eval(expr);
        values[subq.id || `res${i}`] = computed; // store result for later subquestions
        computed = parseFloat(computed.toFixed(subq.decimals));
        correct = Math.abs(computed - userVal) <= subq.accuracy;
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
        <br>${subq.explanation || ""}
      `;
    });
  });
}
