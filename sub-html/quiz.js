// quiz.js utk check json https://jsonlint.com/
const params = new URLSearchParams(window.location.search);
const file = params.get("file") || "quiz-01.json";
const title = params.get("title") || "Quiz";
document.getElementById("quiz-title").textContent = decodeURIComponent(title);

let problems = [], selected = [], current = 0, score = 0, startTime = 0, endTime = 0, totalTime = 0, timePerQuestion = [];

function formatNumber(n) {
  return n.toLocaleString("en-US");
}

fetch(file)
  .then(res => res.json())
  .then(data => {
    problems = data;
    document.getElementById("question-count").textContent = problems.length;
    document.getElementById("end-num").value = problems.length;
  });

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

document.getElementById("start-btn").onclick = () => {
  const from = parseInt(document.getElementById("start-num").value);
  const to = parseInt(document.getElementById("end-num").value);
  const shuffleOpt = document.getElementById("shuffle-toggle").checked;
  const randomizeVars = document.getElementById("randomize-vars").checked;

  if (isNaN(from) || isNaN(to) || from < 1 || to > problems.length || from > to) {
    alert("Invalid selection range.");
    return;
  }
  selected = problems.slice(from - 1, to);
  if (shuffleOpt) selected = shuffle(selected);

  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "block";
  startTime = Date.now();
  current = 0;
  score = 0;
  timePerQuestion = [];
  showQuestion(randomizeVars);
};

function substitute(expr, vars) {
  for (const [k, v] of Object.entries(vars)) expr = expr.replaceAll(`{${k}}`, `(${v})`);
  return expr
    .replace(/\bsqrt\(/g, "Math.sqrt(")
    .replace(/\bpow\(/g, "Math.pow(")
    .replace(/\bln\(/g, "Math.log(")
    .replace(/\blog\(/g, "Math.log10(");
}

function generateValues(specs, randomize = true) {
  const vals = {};
  for (const [k, s] of Object.entries(specs)) {
    const r = randomize ? s.mean + (Math.random() * 2 - 1) * s.range : s.mean;
    vals[k] = parseFloat(r.toFixed(s.decimals));
  }
  return vals;
}
// showQuestion *****************
function showQuestion(randomizeVars = true) {
  const q = selected[current];
  q.__start = Date.now();
  const box = document.getElementById("question-box");
  box.innerHTML = "";

  // Generate values
  q.__values = generateValues(q.variables || {}, randomizeVars);
  const displayValues = q.__values;

  // Inject variable values into problem text
  let text = q.problem;
  for (const [k, v] of Object.entries(displayValues)) {
    text = text.replaceAll(`{${k}}`, formatNumber(v));
  }

  // Handle inline expressions like {=a * 100}
  text = text.replace(/\{=([^}]+)\}/g, (_, expr) => {
    try {
      const replaced = substitute(expr, displayValues);
      const result = eval(replaced);
      return formatNumber(result);
    } catch (e) {
      return `[Error: ${expr}]`;
    }
  });

  // Clean up awkward signs
  text = text.replaceAll("+-", "-").replaceAll("--", "+");

  box.innerHTML += `<p><strong>Q${current + 1}:</strong> ${text}</p>`;

  // === Answer input ===
  if (q.answer_type === "number") {
    q.__expr = substitute(q.formula, q.__values);
    const decimal = q.decimals ? ` (${q.decimals} digits of decimal)` : "";
    const unit = q.unit ? ` ${q.unit}` : "";
    box.innerHTML += `<label>The answer = <input type="number" id="ans" step="any">${unit}${decimal}</label>`;
  }

  else if (q.answer_type === "mc") {
    let choices = [];
    let correct = q.correct_choice;
    if (q.choices && q.correct_choice !== undefined) {
      choices = q.choices;
    } else if (q.formula) {
      q.__expr = substitute(q.formula, q.__values);
      correct = eval(q.__expr);
      choices = [correct, ...(q.distractors || [])];
    }
    q.__correct = correct;
    if (q.shuffle_choices !== false) choices = shuffle(choices);

    choices.forEach((opt, i) => {
      box.innerHTML += `<label><input type="radio" name="ans" value="${opt}"> ${opt}</label>`;
    });
  }

  else if (q.answer_type === "subquestions") {
    q.__context = { ...q.__values };
    q.__subq = q.subquestions.map((s, i) => {
      const expr = substitute(s.formula, q.__context);
      const label = s.label || `Part ${i + 1}`;
      return { ...s, label, __expr: expr };
    });
    q.__subq.forEach((s, i) => {
      s.label = s.label.replaceAll("+-", "-").replaceAll("--", "+");
      const decimal = s.decimals ? ` (${s.decimals} digits of decimal)` : "";
      const unit = s.unit ? ` ${s.unit}` : "";
      box.innerHTML += `<label>${s.label}</label><label><input type="number" id="sub-${i}" step="any">${unit}${decimal}</label>`;
    });
  }

  // Focus the first input box
  setTimeout(() => {
    const firstInput = box.querySelector("input");
    if (firstInput) firstInput.focus();
  }, 0);
}
// end of showQuestion *****************
document.getElementById("next-btn").onclick = () => {
  const q = selected[current];
  const now = Date.now();
  timePerQuestion.push((now - q.__start) / 1000);

  let correctCount = 0;
  if (q.answer_type === "number") {
    const userAns = parseFloat(document.getElementById("ans").value);
    try {
      const val = eval(q.__expr);
      const rounded = parseFloat(val.toFixed(q.decimals));
      if (Math.abs(userAns - rounded) <= q.accuracy) correctCount = 1;
      q.__user = userAns;
      q.__correct = rounded;
    } catch (e) {
      q.__user = userAns;
      q.__correct = "Invalid expression: " + q.__expr;
    }
  } else if (q.answer_type === "mc") {
    const selectedRadio = document.querySelector("input[name='ans']:checked");
    if (selectedRadio) {
      const userAns = selectedRadio.value;
      if (userAns == q.__correct) correctCount = 1;
      q.__user = userAns;
    }
  } else if (q.answer_type === "subquestions") {
    let totalSub = q.__subq.length;
    let correctSub = 0;
    q.__subq.forEach((s, i) => {
      const userVal = parseFloat(document.getElementById(`sub-${i}`).value);
      try {
        const expr = substitute(s.formula, q.__context);
        const val = eval(expr);
        // const rounded = parseFloat(val.toFixed(s.decimals));
        const rounded = val;  // Keep raw number; format only when displaying
        // JUST EDIT
        if (Math.abs(userVal - rounded) <= s.accuracy) correctSub++;
        if (s.id) q.__context[s.id] = rounded;
        s.__user = userVal;
        // s.__correct = rounded;
        s.__correct = val;  // Not rounded here
        // JUST EDIT 
      } catch (e) {
        s.__user = userVal;
        s.__correct = "Invalid expression: " + s.formula;
      }
    });
    correctCount = correctSub / totalSub;
  }

  score += correctCount;
  current++;
  if (current < selected.length) {
    showQuestion(document.getElementById("randomize-vars").checked);
  } else {
    endTime = Date.now();
    totalTime = (endTime - startTime) / 1000;
    document.getElementById("quiz-screen").style.display = "none";
    document.getElementById("review-screen").style.display = "block";
    document.getElementById("summary").innerHTML = `
      <p>Total Score: ${score.toFixed(2)} / ${selected.length}</p>
      <p>Total Time: ${totalTime.toFixed(1)} sec</p>
      <button onclick="showReview(); this.remove()">Review</button>
      <button onclick="location.href='quiz.html?file=${file}&title=${title}'">Repeat Quiz</button>
    `;
  }
};

// showReview ************
function showReview() {
  const review = document.getElementById("review-content");
  review.innerHTML = "";

  selected.forEach((q, idx) => {
    let questionText = q.problem;

    // Inject displayed variable values
    for (const [k, v] of Object.entries(q.__values)) {
      questionText = questionText.replaceAll(`{${k}}`, formatNumber(v));
    }

    // Handle inline expressions like {=...}
    questionText = questionText.replace(/\{=([^}]+)\}/g, (_, expr) => {
      try {
        const replaced = substitute(expr, q.__values);
        const result = eval(replaced);
        return formatNumber(result);
      } catch (e) {
        return `[Error: ${expr}]`;
      }
    });

    questionText = questionText.replaceAll("+-", "-").replaceAll("--", "+");

    review.innerHTML += `<hr><p><strong>Q${idx + 1}:</strong> ${questionText}</p>`;

    if (q.answer_type === "subquestions") {
      const ctx = { ...q.__values };
      q.__subq.forEach((s, i) => {
        let val, rounded;
        try {
          const expr = substitute(s.formula, ctx);
          val = eval(expr);
          rounded = parseFloat(val.toFixed(s.decimals));
          if (s.id) ctx[s.id] = rounded;
        } catch (e) {
          rounded = "Invalid expression: " + s.formula;
        }
        // const correct = typeof rounded === "number" ? formatNumber(+rounded.toFixed(s.decimals)) : rounded;
        const correct = typeof rounded === "number" ? formatNumber(rounded.toFixed(s.decimals)) : rounded;
        // JUST EDIT
        // const user = typeof s.__user === "number" ? formatNumber(+s.__user.toFixed(s.decimals)) : s.__user;
        const user = typeof s.__user === "number" ? formatNumber(s.__user.toFixed(s.decimals)) : s.__user;
        // JUST EDIT
        const isCorrect = typeof rounded === "number" && Math.abs(s.__user - rounded) <= s.accuracy;
        review.innerHTML += `<p>${s.label}<br>Your answer: ${user}<br>Correct answer: ${correct}<br>${s.explanation || ""}<br>${isCorrect ? "✅ Correct" : "❌ Incorrect"}</p>`;
      });

    } else {
      const correct = typeof q.__correct === "number" ? formatNumber(+q.__correct.toFixed(q.decimals || 2)) : q.__correct;
      const user = typeof q.__user === "number" ? formatNumber(+q.__user.toFixed(q.decimals || 2)) : q.__user;
      const isCorrect = q.answer_type === "mc"
        ? q.__user == q.__correct
        : typeof q.__correct === "number" && Math.abs(q.__user - q.__correct) <= q.accuracy;

      review.innerHTML += `<p>Your answer: ${user}<br>Correct answer: ${correct}<br>${q.explanation || ""}<br>${isCorrect ? "✅ Correct" : "❌ Incorrect"}</p>`;
    }

    review.innerHTML += `<p>Time: ${timePerQuestion[idx].toFixed(1)} sec</p>`;
  });
}
// end of showReview *******************
