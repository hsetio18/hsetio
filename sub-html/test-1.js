// test-1.js
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
      const rand = spec.mean + (Math.random() * 2 - 1) * spec.range;
      const rounded = parseFloat(rand.toFixed(spec.decimals));
      values[key] = rounded;

      // Use nice formatting for signs
      const raw = rounded;
      const displayVal = raw < 0 ? `− ${Math.abs(raw)}` : `${raw}`;
      problemText = problemText.replaceAll(`{${key}}`, displayVal);
    }

    q.__values = values;

    // Create question block
    const qDiv = document.createElement("div");
    qDiv.className = "question";
    qDiv.innerHTML = `<p><strong>Q${index + 1}:</strong> ${problemText}</p>`;

    // If subquestions
    if (q.subquestions) {
      q.__subq = [];
      const context = { ...values };

      q.subquestions.forEach((subq, subIndex) => {
        const expr = substituteVariables(subq.formula, context);
        subq.__expression = expr;

        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.id = `answer-${index}-${subIndex}`;
        input.placeholder = subq.label;

        const label = document.createElement("label");
        label.innerHTML = `<strong>${subq.label}</strong>`;

        const feedback = document.createElement("div");
        feedback.id = `feedback-${index}-${subIndex}`;

        qDiv.appendChild(label);
        qDiv.appendChild(input);
        qDiv.appendChild(feedback);

        q.__subq.push(subq);
      });
    } else {
      // Single-question format
      const expr = substituteVariables(q.formula, values);
      q.__expression = expr;

      const input = document.createElement("input");
      input.type = "number";
      input.step = "any";
      input.id = `answer-${index}`;
      input.placeholder = "Your answer";

      const feedback = document.createElement("div");
      feedback.id = `feedback-${index}`;

      qDiv.appendChild(input);
      qDiv.appendChild(feedback);
    }

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
  problems.forEach((q, index) => {
    if (q.subquestions) {
      const context = { ...q.__values };

      q.__subq.forEach((subq, subIndex) => {
        const input = document.getElementById(`answer-${index}-${subIndex}`);
        const feedback = document.getElementById(`feedback-${index}-${subIndex}`);
        const userVal = parseFloat(input.value);
        let correct = false;
        let computed = NaN;

        try {
          computed = eval(subq.__expression);
          computed = parseFloat(computed.toFixed(subq.decimals));
          correct = Math.abs(computed - userVal) <= subq.accuracy;
          if (subq.id) {
            context[subq.id] = computed; // Store for later subquestions
          }
        } catch (err) {
          feedback.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
          return;
        }

        if (!isFinite(computed)) {
          feedback.innerHTML = `<p style="color:red">Invalid result: ${computed}</p>`;
          return;
        }

        feedback.innerHTML = `
          ${correct ? "✅ Correct!" : "❌ Incorrect"}<br>
          Correct Answer: ${computed}<br>
          ${subq.explanation || ""}
        `;
      });
    } else {
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
        ${correct ? "✅ Correct!" : "❌ Incorrect"}<br>
        Correct Answer: ${computed}<br>
        ${q.explanation || ""}
      `;
    }
  });
}
