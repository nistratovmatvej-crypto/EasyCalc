(() => {
  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  const questionEl = document.getElementById('question');
  const answerEl = document.getElementById('answer');
  const explainButton = document.getElementById('explain');
  let expression = '';
  let justCalculated = false;

  function render() {
    expressionEl.textContent = expression || '0';
    try {
      const value = calculate(expression);
      resultEl.textContent = expression && Number.isFinite(value) ? `= ${format(value)}` : '\u00a0';
    } catch { resultEl.textContent = '\u00a0'; }
  }

  // A small recursive-descent parser; avoids eval() and arbitrary code execution.
  function calculate(source) {
    if (!source.trim()) throw new Error('empty');
    const s = source.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').replace(/%/g, '/100');
    let i = 0;
    function spaces() { while (/\s/.test(s[i] || '') && i < s.length) i++; }
    function factor() {
      spaces();
      if (s[i] === '+') { i++; return factor(); }
      if (s[i] === '-') { i++; return -factor(); }
      if (s[i] === '(') { i++; const v = sum(); spaces(); if (s[i++] !== ')') throw new Error('paren'); return v; }
      const m = s.slice(i).match(/^(?:\d+\.?\d*|\.\d+)/);
      if (!m) throw new Error('number');
      i += m[0].length; return Number(m[0]);
    }
    function term() { let v = factor(); while (true) { spaces(); const op = s[i]; if (op !== '*' && op !== '/') break; i++; const r = factor(); v = op === '*' ? v * r : v / r; } return v; }
    function sum() { let v = term(); while (true) { spaces(); const op = s[i]; if (op !== '+' && op !== '-') break; i++; const r = term(); v = op === '+' ? v + r : v - r; } return v; }
    const value = sum(); spaces(); if (i !== s.length || !Number.isFinite(value)) throw new Error('invalid'); return value;
  }
  function format(value) { return Number(value.toPrecision(10)).toString(); }

  document.querySelector('.keypad').addEventListener('click', event => {
    const key = event.target.closest('button'); if (!key) return;
    const action = key.dataset.action; const value = key.dataset.value;
    if (action === 'clear') { expression = ''; justCalculated = false; }
    else if (action === 'backspace') { expression = expression.slice(0, -1); justCalculated = false; }
    else if (action === 'equals') {
      try { const answer = calculate(expression); expression = format(answer); justCalculated = true; }
      catch { resultEl.textContent = 'Проверь пример'; return; }
    } else if (value === '±') {
      if (expression) expression = expression.startsWith('-') ? expression.slice(1) : `-${expression}`;
    } else if (value) {
      if (justCalculated && /[0-9.]/.test(value)) expression = '';
      justCalculated = false;
      expression += value;
    }
    render();
  });

  explainButton.addEventListener('click', async () => {
    const prompt = (questionEl.value.trim() || expression).trim();
    if (!prompt) { answerEl.textContent = 'Сначала введи пример.'; return; }
    explainButton.disabled = true; explainButton.textContent = 'Думаю…'; answerEl.textContent = 'Готовлю объяснение…';
    try {
      const response = await fetch('/api/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expression: prompt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось получить ответ.');
      answerEl.textContent = data.explanation;
    } catch (error) { answerEl.textContent = error.message || 'Ошибка соединения с сервером.'; }
    finally { explainButton.disabled = false; explainButton.innerHTML = 'Объяснить пример <span>→</span>'; }
  });
  render();
})();
