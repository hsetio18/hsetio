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

function showQuestion(randomizeVars = true) {
  const q = selected[current];
  q.__start = Date.now();
  const box = document.getElementById("question-box");
  box.innerHTML = "";
  q.__values = generateValues(q.variables || {}, randomizeVars);
  let text = q.problem;
  for (const [k, v] of Object.entries(q.__values)) {
    const display = v < 0 ? `− ${Math.abs(v)}` : `${v}`;
    text = text.replaceAll(`{${k}}`, display);
  }
  box.innerHTML += `<p><strong>Q${current + 1}:</strong> ${text}</p>`;

  if (q.answer_type === "number") {
    q.__expr = substitute(q.formula, q.__values);
    const unit = q.unit ? ` ${q.unit}` : "";
    box.innerHTML += `<label>The answer = <input type="number" id="ans" step="any">${unit}</label>`;
  } else if (q.answer_type === "mc") {
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
      box.innerHTML += `<label><input type="radio" name="ans" value="${opt}"> ${opt}</label><br>`;
    });
  } else if (q.answer_type === "subquestions") {
    q.__context = { ...q.__values };
    q.__subq = [];
    q.subquestions.forEach((s, i) => {
      const label = s.label || `Part ${i + 1}`;
      const expr = substitute(s.formula, q.__context);
      const sub = { ...s, label, __expr: expr };
      if (s.id) q.__context[s.id] = null;
      q.__subq.push(sub);
    });
    q.__subq.forEach((s, i) => {
      box.innerHTML += `<label>${s.label}</label><br><input type="number" id="sub-${i}" step="any"><br>`;
    });
  }
}

// You can now add this sample to your quiz-01.json:
// {
//   "id": "q9",
//   "problem": "Calculate the area of a rectangle with length {l} m and width {w} m.",
//   "answer_type": "number",
//   "variables": {
//     "l": { "mean": 10, "range": 4, "decimals": 1 },
//     "w": { "mean": 5, "range": 2, "decimals": 1 }
//   },
//   "formula": "{l} * {w}",
//   "decimals": 2,
//   "accuracy": 0.05,
//   "unit": "m²",
//   "explanation": "Area of a rectangle = length × width."
// }
