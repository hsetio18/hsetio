// quiz.js
const params = new URLSearchParams(window.location.search);
const file = params.get("file") || "quiz-01.json";
const title = params.get("title") || "Quiz";
document.getElementById("quiz-title").textContent = decodeURIComponent(title);

let problems = [], selected = [], current = 0, score = 0, startTime = 0, endTime = 0, totalTime = 0, timePerQuestion = [];

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
    .replace(/\bpower\(/g, "Math.pow(")
    .replace(/\bln\(/g, "Math.log(")
    .replace(/\blog\(/g, "Math.log10(")
    .replace(/Math\\.Math\\./g, "Math.");
}

function generateValues(specs, randomize = true) {
  const vals = {};
  for (const [k, s] of Object.entries(specs)) {
    const r = randomize ? s.mean + (Math.random() * 2 - 1) * s.range : s.mean;
    vals[k] = parseFloat(r.toFixed(s.decimals));
  }
  return vals;
}

function showQuestion(randomizeVars = true) {
  const q = selected[current];
  q.__start = Date.now();
  const box = document.getElementById("question-box");
  box.innerHTML = "";
  q.__values = generateValues(q.variables, randomizeVars);
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
      document.getElementById("question-box").innerHTML += `<label>${s.label}</label><br><input type="number" id="sub-${i}" step="any"><br>`;
    });
  }
}

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
      const userAns = parseFloat(selectedRadio.value);
      const correctAns = eval(q.__expr);
      if (userAns === correctAns) correctCount = 1;
      q.__user = userAns;
      q.__correct = correctAns;
    }
  } else if (q.answer_type === "subquestions") {
    let totalSub = q.__subq.length;
    let correctSub = 0;
    q.__subq.forEach((s, i) => {
      const userVal = parseFloat(document.getElementById(`sub-${i}`).value);
      try {
        const val = eval(substitute(s.__expr, q.__context));
        const rounded = parseFloat(val.toFixed(s.decimals));
        if (Math.abs(userVal - rounded) <= s.accuracy) correctSub++;
        if (s.id) q.__context[s.id] = rounded;
        s.__user = userVal;
        s.__correct = rounded;
      } catch (e) {
        s.__user = userVal;
        s.__correct = "Invalid expression: " + s.__expr;
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
    document.getElementById("summary").innerHTML = `Total Score: ${score.toFixed(2)} / ${selected.length}<br>Total Time: ${totalTime.toFixed(1)} sec`;
    const review = document.getElementById("review-content");
    review.innerHTML = "";

    selected.forEach((q, idx) => {
      review.innerHTML += `<hr><p><strong>Q${idx + 1}:</strong> ${q.problem}</p>`;
      if (q.answer_type === "subquestions") {
        q.__subq.forEach((s, i) => {
          review.innerHTML += `<p>${s.label}<br>Your answer: ${s.__user}<br>Correct answer: ${s.__correct}<br>${s.explanation || ""}<br>${Math.abs(s.__user - s.__correct) <= s.accuracy ? "✅ Correct" : "❌ Incorrect"}</p>`;
        });
      } else {
        review.innerHTML += `<p>Your answer: ${q.__user}<br>Correct answer: ${q.__correct}<br>${q.explanation || ""}<br>${Math.abs(q.__user - q.__correct) <= q.accuracy ? "✅ Correct" : "❌ Incorrect"}</p>`;
      }
      review.innerHTML += `<p>Time: ${timePerQuestion[idx].toFixed(1)} sec</p>`;
    });
  }
};
