const params = new URLSearchParams(window.location.search);
const file = params.get('file') || 'problems.json';
const title = params.get('title') || 'My Quiz';
document.getElementById("quiz-title").textContent = decodeURIComponent(title);

// Generate a random number given mean, range, and decimals
function generateRandomValue(spec) {
  const { mean, range, decimals } = spec;
  const value = mean + (Math.random() * 2 - 1) * range;
  return Number(value.toFixed(decimals));
}

// Replace placeholders in the text
function replaceVariables(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key]);
}

// Load JSON and render questions
fetch(file)
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById("questions");
    data.forEach((problem, index) => {
      const variables = {};
      for (const key in problem.variables) {
        variables[key] = generateRandomValue(problem.variables[key]);
      }

      const questionText = replaceVariables(problem.problem, variables);

      const div = document.createElement("div");
      div.className = "question-block";
      div.innerHTML = `<strong>Q${index + 1}:</strong> ${questionText}`;
      container.appendChild(div);
    });
  })
  .catch(error => {
    document.getElementById("questions").innerHTML = "Error loading questions.";
    console.error("Error:", error);
  });
