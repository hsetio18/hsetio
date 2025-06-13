document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const file = params.get("file") || "problems.json";
  const title = params.get("title") || "Math Quiz";

  // Set the title
  const titleElement = document.getElementById("quiz-title");
  if (titleElement) titleElement.textContent = decodeURIComponent(title);

  // Load the questions
  fetch(file)
    .then((res) => res.json())
    .then((questions) => {
      const container = document.getElementById("quiz-container");

      questions.forEach((q, index) => {
        // Generate variable values
        const vars = {};
        for (let key in q.variables) {
          const { mean, range, decimals } = q.variables[key];
          const value =
            +(mean + (Math.random() * 2 - 1) * range).toFixed(decimals || 0);
          vars[key] = value;
        }

        // Prepare problem text with formatted variables
        let problemText = q.problem;
        for (let key in vars) {
          const val = vars[key];
          const displayVal = val < 0 ? `− ${Math.abs(val)}` : `+ ${val}`;
          problemText = problemText.replaceAll(`{${key}}`, displayVal);
        }

        // Display question and input
        const div = document.createElement("div");
        div.className = "question-block";
        div.innerHTML = `
          <p><strong>Q${index + 1}:</strong> ${problemText}</p>
          <input type="number" step="any" id="answer-${index}" />
        `;
        container.appendChild(div);

        // Save variable values for later
        q.vars = vars;
      });

      // Add check button
      const btn = document.createElement("button");
      btn.textContent = "Check";
      btn.addEventListener("click", () => {
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";
        let score = 0;

        questions.forEach((q, index) => {
          let expr = q.formula;
          const vars = q.vars;

          // Replace placeholders with parenthesized values
          for (let key in vars) {
            expr = expr.replaceAll(`{${key}}`, `(${vars[key]})`);
          }

          let correct = NaN;
          try {
            const sqrt = Math.sqrt; // allow using sqrt() instead of Math.sqrt()
            correct = eval(expr);
          } catch (err) {
            console.error("Error evaluating formula:", expr, err);
          }

          const input = document.getElementById(`answer-${index}`);
          const userAnswer = parseFloat(input.value);
          const isCorrect =
            Math.abs(userAnswer - correct) <= (q.accuracy || 0.01);
          if (isCorrect) score++;

          const explanation = q.explanation
            ? `<p>${q.explanation}</p>`
            : "";

          resultsDiv.innerHTML += `
            <div class="result">
              <p><strong>Q${index + 1}:</strong> ${
            isCorrect ? "✅ Correct" : "❌ Incorrect"
          }</p>
              <p>Correct Answer: ${
                isNaN(correct) ? "NaN" : correct.toFixed(q.decimals || 2)
              }</p>
              <p><code>${expr}</code></p>
              ${explanation}
            </div>
          `;
        });

        resultsDiv.innerHTML =
          `<h3>Score: ${score} / ${questions.length}</h3>` +
          resultsDiv.innerHTML;
      });

      container.appendChild(btn);
    })
    .catch((err) => {
      document.getElementById("quiz-container").innerHTML =
        "Error loading questions.";
      console.error("Fetch error:", err);
    });
});
