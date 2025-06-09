function checkAnswers() {
  const answers = {
    q1: 'C',
    q2: 'B',
    q3: 'C',
    q4: 'C'
  };

  const explanations = {
    q1: 'Paris is the capital of France.',
    q2: '2 + 2 equals 4.',
    q3: 'Mars is called the Red Planet due to its reddish appearance.',
    q4: 'William Shakespeare wrote "Romeo and Juliet".'
  };

  let score = 0;
  let total = Object.keys(answers).length;

  for (let q in answers) {
    const selected = document.querySelector(`input[name="${q}"]:checked`);
    const feedback = document.getElementById(`feedback-${q}`);
    feedback.innerHTML = "";

    if (selected) {
      if (selected.value === answers[q]) {
        score++;
        feedback.textContent = "Correct!";
        feedback.className = "feedback correct";
      } else {
        feedback.textContent = `Incorrect. ${explanations[q]}`;
        feedback.className = "feedback incorrect";
      }
    } else {
      feedback.textContent = "You did not answer this question.";
      feedback.className = "feedback incorrect";
    }
  }

  const result = document.getElementById('result');
  result.innerHTML = `You scored ${score} out of ${total}.`;
  result.className = 'score-box';
}