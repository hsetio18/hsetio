const params = new URLSearchParams(window.location.search);
const file = params.get("file") || "problems.json";
const title = params.get("title") || "Untitled Quiz";

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("quiz-title").textContent = decodeURIComponent(title);

  try {
    const response = await fetch(file);
    const quizData = await response.json();
    const container = document.createElement("div");
    const generatedValues = [];

    quizData.forEach((q, index) => {
      const values = {};
      for (const [key, config] of Object.entries(q.variables)) {
        const min = config.mean - config.range;
        const max = config.mean + config.range;
        const raw = Math.random() * (max - min) + min;
        values[key] = parseFloat(raw.toFixed(config.decimals));
      }
      generatedValues.push(values);

      let questionText = q.problem.replace(/\{(\w+)\}/g, (_, key) => {
        const val = values[key];
        return val < 0 ? `− ${Math.abs(val)}` : `+ ${val}`;
      });

      // Clean leading '+'
      questionText = questionText.replace(/^\+\s*/, "");

      const qDiv = document.createElement("div");
      qDiv.innerHTML = `
        <p><strong>Q${index + 1}:</strong> ${questionText}</p>
        <input type="number" id="input-${q.id}" step="any" placeholder="Your answer">
        <hr>
      `;
      container.appendChild(qDiv);
    });

    const checkBtn = document.createElement("button");
    checkBtn.id = "check-btn";
    checkBtn.textContent = "Check";
    container.appendChild(checkBtn);
    document.body.appendChild(container);

    document.getElementById("check-btn").addEventListener("click", () => {
      let score = 0;
      const resultsDiv = document.createElement("div");
      resultsDiv.innerHTML = "<h3>Results:</h3>";

      quizData.forEach((q, index) => {
        const userInput = document.getElementById(`input-${q.id}`);
        const userValue = parseFloat(userInput.value);
        const values = generatedValues[index];

        // Replace {var} with value to form expression
        const expr = q.formula.replace(/\{(\w+)\}/g, (_, key) => values[key]);

        let correct = NaN;
        try {
          correct = eval(expr);
        } catch (err) {
          console.error("Eval error for:", expr, err);
        }

        const isCorrect = Math.abs(userValue - correct) <= q.accuracy;
        if (isCorrect) score++;

        const explanation = `
          <p><strong>Q${index + 1}:</strong> ${isCorrect ? '✅ Correct' : '❌ Incorrect'}</p>
          <p>Correct Answer: ${isNaN(correct) ? 'NaN ❌' : correct.toFixed(q.decimals)}</p>
          <p><em>Using formula:</em><br><code>${expr}</code></p>
          ${q.explanation ? `<p><em>Explanation:</em> ${q.explanation}</p>` : ""}
          <hr>
        `;
        resultsDiv.innerHTML += explanation;
      });

      resultsDiv.innerHTML = `<h3>Your Score: ${score} / ${quizData.length}</h3>` + resultsDiv.innerHTML;
      document.body.appendChild(resultsDiv);
    });

  } catch (err) {
    document.getElementById("quiz-title").textContent = "❌ Error loading questions.";
    console.error("Failed to load or parse JSON:", err);
  }
});
