# Руководство по Деплою на Vercel

Это руководство поможет вам развернуть приложение расписания РГСУ на Vercel.

## Почему Vercel?

- ✅ **100 GB bandwidth** бесплатно
- ✅ Создатели Next.js - полная поддержка всех функций
- ✅ Поддержка Next.js 16 из коробки
- ✅ Автоматические деплои через Git
- ✅ Глобальная Edge Network
- ✅ Serverless Functions: 100 GB-Hrs
- ✅ Нулевая конфигурация

## Предварительные Требования

- ✅ Аккаунт Vercel (бесплатный план подходит)
- ✅ Git репозиторий на GitHub, GitLab или Bitbucket
- ✅ Все изменения закоммичены и запушены

---

## 🚀 Пошаговая Инструкция

### Шаг 1: Подготовка Проекта

Убедитесь, что проект собирается локально:

```bash
npm install
npm run build
```

Закоммитьте и запушьте все изменения:

```bash
git add .
git commit -m "Подготовка к деплою на Vercel"
git push
```

### Шаг 2: Создание Проекта на Vercel

1. **Войдите в Vercel**
   - Перейдите на [vercel.com](https://vercel.com)
   - Нажмите **Sign Up** или **Log In**
   - Войдите через GitHub (рекомендуется)

2. **Создайте новый проект**
   - Нажмите **Add New...** → **Project**
   - Выберите ваш репозиторий `shedule`
   - Нажмите **Import**

3. **Настройка проекта**
   
   Vercel автоматически определит Next.js. Проверьте настройки:
   
   - **Framework Preset**: Next.js (автоматически)
   - **Root Directory**: `./` (по умолчанию)
   - **Build Command**: `npm run build` (автоматически)
   - **Output Directory**: `.next` (автоматически)
   - **Install Command**: `npm install` (автоматически)

### Шаг 3: Настройка Переменных Окружения

Перед деплоем добавьте переменные окружения:

1. Раскройте секцию **Environment Variables**
2. Добавьте все переменные из вашего `.env` файла:

```env
# URL сайта (обновите после первого деплоя)
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Google Service Account
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key

# VAPID ключи (для push-уведомлений)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key

# ИИ-чат отладки (OpenAI-совместимый API)
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key
AI_MODEL=dots-studio/dots-3-note-preview:free
# Белый список для переключателя моделей в чате: provider/model через запятую.
# Пусто — переключателя нет, работает только AI_MODEL.
AI_ALLOWED_MODELS=openrouter/dots-studio/dots-3-note-preview:free,openrouter/nvidia/nemotron-3.5-lightning:free
```

> **Важно**: Для многострочных значений (например, `GOOGLE_PRIVATE_KEY`) вставьте значение с переносами строк как есть.

3. Выберите окружения для каждой переменной:
   - ✅ **Production**
   - ✅ **Preview** (опционально)
   - ✅ **Development** (опционально)

### Шаг 4: Деплой!

Нажмите **Deploy** и ждите завершения сборки (обычно 1-3 минуты).

### Шаг 5: Обновление URL

После первого успешного деплоя:

1. Vercel даст вам URL вида `https://your-project.vercel.app`
2. Перейдите в **Settings** → **Environment Variables**
3. Обновите `NEXT_PUBLIC_SITE_URL` на актуальный URL
4. Сделайте **Redeploy** для применения изменений:
   - **Deployments** → последний деплой → **⋯** → **Redeploy**

### Шаг 6: Проверка

Откройте ваш сайт и проверьте:
- ✅ Загрузка расписания
- ✅ Выбор даты
- ✅ Экспорт в PDF
- ✅ Переключение темы
- ✅ PWA установка
- ✅ API routes работают
- ✅ Push-уведомления

---

## ⚙️ Дополнительные Настройки

### Настройка Cron Job для Уведомлений

Vercel поддерживает Cron Jobs через Vercel Cron:

1. Создайте файл `vercel.json` в корне проекта (уже создан)
2. Добавьте конфигурацию cron:

```json
{
  "crons": [{
    "path": "/api/push/check",
    "schedule": "0 8 * * *"
  }]
}
```

3. Закоммитьте и запушьте изменения

> **Примечание**: Vercel Cron доступен только на платных планах. Для бесплатного плана используйте внешний сервис:

#### Альтернатива: cron-job.org

1. Зарегистрируйтесь на [cron-job.org](https://cron-job.org)
2. Создайте новый cron job
3. **URL**: `https://your-project.vercel.app/api/push/check`
4. **Расписание**: `0 8 * * *` (каждый день в 8:00)

### Настройка Кастомного Домена

1. Перейдите в **Settings** → **Domains**
2. Нажмите **Add**
3. Введите ваш домен
4. Следуйте инструкциям по настройке DNS

Vercel автоматически настроит SSL сертификат.

### Аналитика Plausible

Vercel Analytics работает только на Vercel — на Cloudflare Pages и Netlify
его endpoint `/_vercel/insights` отдаёт 404, и данные не собираются.
Поэтому в проекте используется Plausible: без cookie, без IP, работает на
любом хостинге.

1. Создайте сайт в Plausible (облако) или поднимите свой инстанс —
   см. [PLAUSIBLE_SELF_HOST.md](./PLAUSIBLE_SELF_HOST.md)
2. Задайте переменные окружения:

```env
# Домен сайта — ровно как он указан в настройках Plausible
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com

# Свой инстанс (необязательно, по умолчанию идёт в облако plausible.io)
NEXT_PUBLIC_PLAUSIBLE_ENDPOINT=https://analytics.your-domain.com/api/event
```

3. Пакет `@plausible-analytics/tracker` и компонент `components/analytics.tsx`
   уже подключены в `app/layout.tsx` — дополнительных действий не нужно.
   Без `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` счётчик не подключается вовсе.

---

## 🔄 Автоматические Деплои

Vercel автоматически деплоит изменения:

- **Production**: при push в `main` ветку
- **Preview**: при создании pull request или push в другие ветки

Каждый preview деплой получает уникальный URL для тестирования.

---

## 🐛 Troubleshooting

### Ошибка сборки: "Module not found"

```bash
# Локально проверьте сборку
npm install
npm run build
```

Если локально работает, проверьте логи сборки в Vercel Dashboard.

### Переменные окружения не работают

- ✅ Проверьте, что все переменные добавлены в Vercel Dashboard
- ✅ Убедитесь, что выбрано окружение **Production**
- ✅ Сделайте **Redeploy** после добавления переменных
- ✅ Переменные с префиксом `NEXT_PUBLIC_` доступны на клиенте

### API Routes возвращают 404

- Проверьте, что файлы находятся в `app/api/`
- Убедитесь, что используете App Router
- Проверьте логи функций в **Deployments** → **Functions**

### Сайт работает медленно

- Проверьте размер бандла в логах сборки
- Обратите внимание на консоль браузера
- Оптимизируйте изображения и компоненты

---

## 📊 Мониторинг и Аналитика

### Build Logs

- Доступны в разделе **Deployments**
- Нажмите на деплой для просмотра подробных логов

### Function Logs

- Перейдите в **Deployments** → выберите деплой → **Functions**
- Просмотрите логи выполнения serverless функций

### Не приходят данные аналитики

- Проверьте, что задан `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` и он совпадает с доменом в настройках Plausible
- Без этой переменной счётчик не подключается вовсе — это нормальное поведение
- В DevTools → Network должен уходить `POST .../api/event`
- Подробности: [PLAUSIBLE_SELF_HOST.md](./PLAUSIBLE_SELF_HOST.md)

### Real-time Logs

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите
vercel login

# Просмотр логов в реальном времени
vercel logs
```

---

## 💰 Лимиты Бесплатного Плана (Hobby)

| Ресурс | Лимит |
|--------|-------|
| **Bandwidth** | 100 GB/месяц |
| **Builds** | Неограничено |
| **Serverless Function Execution** | 100 GB-Hrs/месяц |
| **Edge Functions Execution** | 500,000 запросов/месяц |
| **Serverless Function Duration** | 10 секунд |
| **Edge Function Duration** | 30 секунд |
| **Image Optimization** | 1,000 изображений |
| **Concurrent Builds** | 1 |

---

## 🔗 Полезные Ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)

---

## 📝 Следующие Шаги

После успешного деплоя:

1. ✅ Обновите `NEXT_PUBLIC_SITE_URL` на актуальный URL
2. ✅ Настройте cron job для `/api/push/check`
3. ✅ (Опционально) Подключите кастомный домен
4. ✅ (Опционально) Подключите аналитику Plausible
5. ✅ Проверьте все функции приложения

---

## 🎉 Готово!

Ваше приложение теперь работает на Vercel с:
- ✅ 100 GB bandwidth
- ✅ Глобальной Edge Network
- ✅ Автоматическими деплоями
- ✅ Бесплатным SSL
- ✅ Полной поддержкой Next.js 16

**Удачного использования! 🚀**
