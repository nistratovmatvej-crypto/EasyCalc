# EasyCalc — начало работы

## Важно
- API-ключ OpenAI нельзя вставлять в `public/app.js`, HTML или отправлять в чат.
- Добавляйте `OPENAI_API_KEY` только в секретные Environment Variables на хостинге.
- Использование OpenAI API оплачивается отдельно от подписки ChatGPT.

## Запуск на Render
1. Загрузите папку проекта в новый GitHub-репозиторий.
2. На Render выберите New → Blueprint и подключите репозиторий.
3. Введите секрет `OPENAI_API_KEY` в поле, которое попросит Render.
4. Запустите Deploy.
5. Откройте адрес сайта Render. Проверка сервера: `/api/health`.

Если `aiConfigured` равно `false`, API-ключ ещё не добавлен.
