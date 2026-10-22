# 🚀 Быстрый старт: Деплой на Cloudflare Pages

## Выбор платформы

Этот проект поддерживает развертывание на двух платформах:

### ☁️ Cloudflare Pages (Рекомендуется)
- **Неограниченный bandwidth**
- Глобальная CDN сеть
- Встроенная DDoS защита
- 500 сборок в месяц
- Деплой через веб-интерфейс

📖 **[Полное руководство по Cloudflare](./CLOUDFLARE_DEPLOYMENT.md)**

### 🌐 Netlify (Альтернатива)
- 100 GB bandwidth
- 300 минут сборки в месяц
- Простая настройка

📖 **[Полное руководство по Netlify](./old-netlify-config/NETLIFY_DEPLOYMENT.md)**

---

## ⚡ Быстрый деплой на Cloudflare Pages

### 1️⃣ Подготовка

```bash
# Установка зависимостей
npm install

# Проверка сборки
npm run build

# Коммит и пуш
git add .
git commit -m "Подготовка к деплою"
git push
```

### 2️⃣ Создание проекта на Cloudflare

1. Перейдите на [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Выберите репозиторий
4. Настройте сборку:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`

### 3️⃣ Настройка переменных окружения

В **Settings** → **Environment variables** добавьте:

```env
NEXT_PUBLIC_SITE_URL=https://your-project.pages.dev
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=...
AI_MODEL=dots-studio/dots-3-note-preview:free
AI_ALLOWED_MODELS=openrouter/dots-studio/dots-3-note-preview:free,openrouter/nvidia/nemotron-3.5-lightning:free
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.pages.dev
```

> **Про ИИ-чат отладки.** Провайдер выбирается через `AI_PROVIDER` (`openrouter` |
> `groq` | `opencode` | `custom`) — используется OpenAI-совместимый API, поэтому
> подходит любой сервис с таким форматом. Gemini намеренно не используется:
> Google AI Studio и Gemini API недоступны в Беларуси, и ключ из этой страны
> работать не будет.
>
> `AI_ALLOWED_MODELS` — белый список моделей для переключателя в чате, формат
> `провайдер/модель` через запятую. Пусто — переключателя нет, работает только
> `AI_MODEL`. Клиент присылает лишь идентификаторы: адреса и ключи остаются
> на сервере, а модель вне списка отклоняется.

### 4️⃣ Деплой!

Нажмите **Save and Deploy** - готово! 🎉

После первого деплоя обновите `NEXT_PUBLIC_SITE_URL` и сделайте **Retry deployment**.

---

## 📚 Дополнительная документация

- [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) - Полное руководство по Cloudflare
- [NGINX_DEPLOYMENT.md](./NGINX_DEPLOYMENT.md) - Свой nginx: проксирование, gzip и общий кэш расписания
- [PLAUSIBLE_SELF_HOST.md](./PLAUSIBLE_SELF_HOST.md) - Аналитика Plausible: облако или свой инстанс
- [old-netlify-config/NETLIFY_DEPLOYMENT.md](./old-netlify-config/NETLIFY_DEPLOYMENT.md) - Полное руководство по Netlify
- [README.md](./README.md) - Основная документация проекта
- [CHANGELOG.md](./CHANGELOG.md) - История изменений

---

## 🆘 Помощь

Если возникли проблемы:

1. Проверьте логи сборки в Cloudflare Dashboard
2. Убедитесь, что все переменные окружения добавлены
3. Попробуйте **Retry deployment**
4. Обратитесь к [полному руководству](./CLOUDFLARE_DEPLOYMENT.md)

---

## ⚙️ Структура проекта

```
.
├── app/                    # Next.js App Router
├── components/             # React компоненты
├── lib/                    # Утилиты и хелперы
├── public/                 # Статические файлы
├── worker/                 # Service Worker для PWA
├── old-netlify-config/     # Настройки Netlify (архив)
│   ├── netlify.toml
│   └── NETLIFY_DEPLOYMENT.md
├── wrangler.toml          # Конфигурация Cloudflare
├── .cfignore              # Игнорируемые файлы для Cloudflare
└── CLOUDFLARE_DEPLOYMENT.md  # Руководство по Cloudflare
```

---

**Удачного деплоя! 🚀**
