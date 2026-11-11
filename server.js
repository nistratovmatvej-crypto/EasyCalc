const express = require('express');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const explainLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.post('/api/explain', explainLimiter, async (req, res) => {
  const expression = typeof req.body?.expression === 'string' ? req.body.expression.trim() : '';
  if (!expression || expression.length > 500) {
    return res.status(400).json({ error: 'Введите пример длиной до 500 символов.' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI-помощник пока не подключён. Добавьте OPENAI_API_KEY в настройках сервера.' });
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'Ты Calculate — дружелюбный помощник калькулятора EasyCalc. Объясняй математические примеры простым русским языком, пошагово и кратко. Если выражение неоднозначно, скажи об этом. Не выдумывай вычисления.' },
        { role: 'user', content: `Объясни решение этого примера: ${expression}` }
      ],
      max_tokens: 350
    });
    res.json({ explanation: response.choices[0]?.message?.content || 'Не удалось получить объяснение.' });
  } catch (error) {
    console.error('AI request failed:', error.message);
    res.status(502).json({ error: 'Не удалось получить ответ от AI. Попробуйте ещё раз.' });
  }
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`EasyCalc is running on port ${PORT}`));
