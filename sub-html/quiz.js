// quiz.js
const params = new URLSearchParams(window.location.search);
const file = params.get("file") || "quiz-01.json";
const title = params.get("title") || "Quiz";
document.getElementById("quiz-title").textContent = decodeURIComponent(title);

let problems = [], selected = [], current = 0, score = 0, startTime = 0, endTime = 0;

fetch(file)
  .then(res => res.json())
  .then(data => {
    problems = data;
    document.getElementById("question-count").textContent = problems.length;
  });

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

document.getElementById("start-btn").onclick = () => {
  const n = parseInt(document.getElementById("num-questions").value);
  if (isNaN(n) || n < 1 || n > problems.length) return alert("Invalid input.");
  selected = shuffle([...problems]).slice(0, n);
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "block";
  startTime = Date.now();
  current = 0;
  score = 0;
  showQuestion();
};

function substitute(expr, vars) {
  for (const [k, v] of Object.entries(vars)) expr = expr.replaceAll(`{${k}}`, `(${v})`);
  return expr
    .replace(/\bsqrt\(/g, "Math.sqrt(")
    .replace(/\bpower\(/g, "Math.pow(")
    .replace(/\bln\(/g, "Math.log(")
    .replace(/\blog\(/g, "Math.log10(")
    .replace(/Math\.Math\./g, "Math.");
}

function generateValues(specs) {
  const vals = {};
  for (const [k, s] of Object.entries(specs)) {
    const r = s.mean + (Math.random() * 2 - 1) * s.range;
    vals[k] = parseFloat(r.toFixed(s.decimals));
  }
  return vals;
}

function showQuestion() {
  const q = selected[current];
  q.__start = Date.now();
  const box = document.getElementById("question-box");
  box.innerHTML = "";
  q.__values = generateValues(q.variables);
  let text = q.problem;
  for (const [k, v] of Object.entries(q.__values)) {
    const display = v < 0 ? `− ${Math.abs(v)}` : `${v}`;
    text = text.replaceAll(`{${k}}`, display);
  }
  box.innerHTML += `<p><strong>Q${current + 1}:</strong> ${text}</p>`;

  if (q.answer_type === "number") {
    q.__expr = substitute(q.formula, q.__values);
    box.innerHTML += `<input type="number" id="ans" step="any">`;
  } else if (q.answer_type === "mc") {
    q.__expr = substitute(q.formula, q.__values);
    const correct = eval(q.__expr);
    const options = shuffle([correct, ...q.distractors]).slice(0, 4);
    options.forEach((opt, i) => {
      box.innerHTML += `<label><input type="radio" name="ans" value="${opt}"> ${opt}</label><br>`;
    });
  } else if (q.answer_type === "subquestions") {
    q.__context = { ...q.__values };
    q.__subq = q.subquestions.map((s, i) => {
      const expr = substitute(s.formula, q.__context);
      const label = s.label || `Part ${i + 1}`;
      return { ...s, label, __expr: expr };
    });
    q.__subq.forEach((s, i) => {
      box.innerHTML += `<label>${s.label}</label><br><input type="number" id="sub-${i}" step="any"><br>`;
    });
  }
}

document.getElementById("next-btn").onclick = () => {
  const q = selected[current];
  q.__end = Date.now();
  let correct = 0, total = 1;
  if (q.answer_type === "number") {
    let val = parseFloat(document.getElementById("ans").value);
    try {
      const actual = parseFloat(eval(q.__expr).toFixed(q.decimals));
      q.__correct = actual;
      q.__user = val;
      q.__explain = q.explanation;
      if (Math.abs(val - actual) <= q.accuracy) correct = 1;
    } catch {
      q.__correct = "Invalid expression: " + q.__expr;
    }
  } else if (q.answer_type === "mc") {
    const choice = document.querySelector("input[name=ans]:checked");
    if (choice) {
      const user = parseFloat(choice.value);
      const actual = parseFloat(eval(q.__expr).toFixed(q.decimals));
      q.__correct = actual;
      q.__user = user;
      q.__explain = q.explanation;
      if (user === actual) correct = 1;
    }
  } else if (q.answer_type === "subquestions") {
    correct = 0;
    total = q.__subq.length;
    q.__results = [];
    const ctx = { ...q.__values };
    q.__subq.forEach((s, i) => {
      const input = parseFloat(document.getElementById(`sub-${i}`).value);
      try {
        const answer = parseFloat(eval(substitute(s.formula, ctx)).toFixed(s.decimals));
        if (s.id) ctx[s.id] = answer;
        const ok = Math.abs(answer - input) <= s.accuracy;
        if (ok) correct++;
        q.__results.push({ label: s.label, correct: answer, user: input, ok, explanation: s.explanation });
      } catch {
        q.__results.push({ label: s.label, correct: NaN, user: input, ok: false, explanation: s.explanation });
      }
    });
  }
  score += correct / total;
  current++;
  if (current >= selected.length) finishQuiz();
  else showQuestion();
};

function finishQuiz() {
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "block";
  endTime = Date.now();
  const totalSeconds = Math.floor((endTime - startTime) / 1000);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  document.getElementById("summary").innerHTML =
    `<p>Total Score: ${score.toFixed(2)} / ${selected.length}</p>
     <p>Total Time: ${min} minutes ${sec} seconds</p>`;
}

document.getElementById("review-btn").onclick = () => {
  document.getElementById("result-screen").style.display = "none";
  document.getElementById("review-screen").style.display = "block";
  const list = document.getElementById("review-list");
  list.innerHTML = "";
  const totalSeconds = Math.floor((endTime - startTime) / 1000);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  list.innerHTML += `<p><strong>Total Score:</strong> ${score.toFixed(2)} / ${selected.length}</p>
                     <p><strong>Total Time:</strong> ${min} minutes ${sec} seconds</p><hr>`;

  selected.forEach((q, idx) => {
    const block = document.createElement("div");
    let text = q.problem;
    if (q.__values) {
      for (const [k, v] of Object.entries(q.__values)) {
        const display = v < 0 ? `− ${Math.abs(v)}` : `${v}`;
        text = text.replaceAll(`{${k}}`, display);
      }
    }
    const timeTaken = q.__end && q.__start ? ((q.__end - q.__start) / 1000).toFixed(1) : "N/A";
    block.innerHTML = `<strong>Q${idx + 1}:</strong> ${text}<br><small>Time: ${timeTaken} sec</small><br>`;

    if (q.answer_type === "subquestions") {
      q.__results.forEach(r => {
        block.innerHTML += `${r.label}<br>
          Your answer: ${r.user}<br>
          Correct answer: ${isNaN(r.correct) ? "NaN" : r.correct}<br>
          ${r.ok ? "✅ Correct" : "❌ Incorrect"}<br>
          ${r.explanation || ""}<br><br>`;
      });
    } else {
      const user = q.__user !== undefined ? q.__user : "N/A";
      const correct = q.__correct !== undefined ? q.__correct : "N/A";
      const isCorrect = typeof user === "number" && typeof correct === "number"
        ? Math.abs(user - correct) <= (q.accuracy || 0.01)
        : false;
      block.innerHTML += `Your answer: ${user}<br>
        Correct answer: ${correct}<br>
        ${isCorrect ? "✅ Correct" : "❌ Incorrect"}<br>
        ${q.__explain || ""}`;
    }
    list.appendChild(block);
  });
};
