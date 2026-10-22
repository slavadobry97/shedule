# Руководство по Деплою на Cloudflare Pages

Это руководство поможет вам развернуть приложение расписания РГСУ на Cloudflare Pages через веб-интерфейс.

## Почему Cloudflare Pages?

- ✅ **Неограниченный bandwidth** на бесплатном плане
- ✅ **500 сборок в месяц**
- ✅ Глобальная CDN сеть Cloudflare
- ✅ Встроенная защита от DDoS
- ✅ Бесплатный SSL сертификат
- ✅ Автоматические деплои через Git

## Предварительные Требования

- ✅ Аккаунт Cloudflare (бесплатный план подходит)
- ✅ Git репозиторий на GitHub или GitLab
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
git commit -m "Подготовка к деплою на Cloudflare Pages"
git push
```

### Шаг 2: Создание Проекта на Cloudflare Pages

1. **Войдите в Cloudflare Dashboard**
   - Перейдите на [dash.cloudflare.com](https://dash.cloudflare.com)
   - Войдите или создайте бесплатный аккаунт

2. **Создайте новый проект**
   - В левом меню выберите **Workers & Pages**
   - Нажмите **Create application**
   - Выберите вкладку **Pages**
   - Нажмите **Connect to Git**

3. **Подключите репозиторий**
   - Выберите **GitHub** (или GitLab)
   - Авторизуйте Cloudflare для доступа к репозиториям
   - Выберите ваш репозиторий `shedule`

### Шаг 3: Настройка Сборки

На странице настройки проекта укажите:

#### Build Settings:

- **Project name**: `rgsu-schedule` (или любое другое имя)
- **Production branch**: `main` (или ваша основная ветка)
- **Framework preset**: `Next.js`
- **Build command**: `npm run build`
- **Build output directory**: `.next`

> **Важно**: Cloudflare Pages автоматически определит Next.js и настроит правильные параметры.

Нажмите **Save and Deploy**

### Шаг 4: Настройка Переменных Окружения

После создания проекта:

1. Перейдите в **Settings** → **Environment variables**
2. Нажмите **Add variable**
3. Добавьте все переменные из вашего `.env` файла:

#### Обязательные переменные:

```env
# URL сайта (обновите после первого деплоя)
NEXT_PUBLIC_SITE_URL=https://rgsu-schedule.pages.dev

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

# Аналитика Plausible (домен — как он указан в настройках Plausible)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=shedule.rgsu.by
# Свой инстанс (Plausible CE) — если не задан, идёт в облако plausible.io:
# NEXT_PUBLIC_PLAUSIBLE_ENDPOINT=https://analytics.rgsu.by/api/event
```

> **Важно**: Для многострочных значений (например, `GOOGLE_PRIVATE_KEY`) вставьте значение с переносами строк как есть.

#### Выбор окружения:

Для каждой переменной выберите:
- ✅ **Production** - для production деплоев
- ⚪ **Preview** - опционально для preview деплоев

### Шаг 5: Обновление URL и Редеплой

После первого успешного деплоя:

1. Cloudflare даст вам URL вида `https://rgsu-schedule.pages.dev`
2. Обновите переменную `NEXT_PUBLIC_SITE_URL` на этот URL
3. Перейдите в **Deployments**
4. Нажмите **Retry deployment** для применения изменений

### Шаг 6: Проверка Деплоя

После успешной сборки (обычно 2-5 минут):

1. Перейдите по URL вашего проекта
2. Проверьте основные функции:
   - ✅ Загрузка расписания
   - ✅ Выбор даты
   - ✅ Экспорт в PDF
   - ✅ Переключение темы
   - ✅ PWA установка
   - ✅ API routes работают

---

## ⚙️ Дополнительные Настройки

### Настройка Cron Job для Уведомлений

Cloudflare Pages не поддерживает cron jobs напрямую. Используйте внешний сервис:

#### Вариант 1: cron-job.org (Рекомендуется)

1. Зарегистрируйтесь на [cron-job.org](https://cron-job.org)
2. Создайте новый cron job
3. **URL**: `https://rgsu-schedule.pages.dev/api/push/check`
4. **Расписание**: `0 8 * * *` (каждый день в 8:00)
5. **Метод**: GET

#### Вариант 2: GitHub Actions

Создайте файл `.github/workflows/cron.yml`:

```yaml
name: Cron Job

on:
  schedule:
    - cron: '0 8 * * *'  # Каждый день в 8:00 UTC
  workflow_dispatch:

jobs:
  trigger-check:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger push check
        run: |
          curl -X GET https://rgsu-schedule.pages.dev/api/push/check
```

### Настройка Кастомного Домена

1. В настройках проекта перейдите в **Custom domains**
2. Нажмите **Set up a custom domain**
3. Введите ваш домен
4. Если домен на Cloudflare - настройка DNS произойдет автоматически
5. Если домен на другом регистраторе - следуйте инструкциям по настройке CNAME записи

### Использование Cloudflare KV (Опционально)

Cloudflare KV - альтернатива Upstash Redis:

1. В Dashboard перейдите в **Workers & Pages** → **KV**
2. Создайте новый namespace: `SCHEDULE_CACHE`
3. Привяжите к вашему Pages проекту:
   - **Settings** → **Functions** → **KV namespace bindings**
   - Variable name: `SCHEDULE_CACHE`
   - KV namespace: выберите созданный namespace

4. Обновите код для использования KV (совместим с Upstash Redis API)

---

## 🔄 Автоматические Деплои

Cloudflare Pages автоматически деплоит изменения:

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

Если локально работает, проверьте:
- Все ли зависимости в `package.json`
- Нет ли зависимостей только в `devDependencies`, которые нужны для сборки

### Переменные окружения не работают

- ✅ Проверьте, что все переменные добавлены в Cloudflare Dashboard
- ✅ Убедитесь, что выбрано окружение **Production**
- ✅ Сделайте **Retry deployment** после добавления переменных
- ✅ Переменные с префиксом `NEXT_PUBLIC_` доступны на клиенте

### API Routes возвращают 404

Cloudflare Pages поддерживает Next.js API routes через Functions:
- Проверьте логи в **Deployments** → **View details** → **Functions**
- API routes должны быть в папке `app/api/`
- Убедитесь, что используете App Router (не Pages Router)

### Сайт не открывается / 522 ошибка

- Подождите несколько минут после деплоя
- Очистите кеш браузера (Ctrl+Shift+R)
- Проверьте статус деплоя в Dashboard
- Проверьте логи сборки на наличие ошибок

### Проблемы с PWA / Service Worker

- Убедитесь, что `public/sw.js` создается при сборке
- Проверьте, что `manifest.json` доступен
- Очистите Service Workers в DevTools (Application → Service Workers → Unregister)

---

## 📊 Мониторинг и Аналитика

### Build Logs

- Доступны в разделе **Deployments**
- Нажмите на деплой для просмотра подробных логов
- Логи сохраняются для каждой сборки

### Analytics

1. Перейдите в **Analytics** в настройках проекта
2. Доступная информация:
   - **Requests** - количество запросов
   - **Bandwidth** - использованный трафик
   - **Unique visitors** - уникальные посетители
   - **Page views** - просмотры страниц
   - **Top pages** - популярные страницы

### Real-time Logs

Для просмотра логов в реальном времени:
1. Перейдите в **Functions**
2. Выберите функцию (API route)
3. Просмотрите логи выполнения

---

## 💰 Лимиты Бесплатного Плана

| Ресурс | Лимит |
|--------|-------|
| **Bandwidth** | ♾️ Неограниченный |
| **Builds** | 500 сборок/месяц |
| **Requests** | 100,000 запросов/день |
| **Functions** | 100,000 запросов/день |
| **Function CPU time** | 10ms на запрос |
| **KV Reads** | 100,000 операций/день |
| **KV Writes** | 1,000 операций/день |

> **Примечание**: Для большинства проектов бесплатного плана более чем достаточно.

---

## 🔗 Полезные Ссылки

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
- [Cloudflare Analytics](https://developers.cloudflare.com/analytics/)

---

## 📝 Следующие Шаги

После успешного деплоя:

1. ✅ Обновите `NEXT_PUBLIC_SITE_URL` на актуальный URL
2. ✅ Настройте cron job для `/api/push/check`
3. ✅ (Опционально) Подключите кастомный домен
4. ✅ (Опционально) Настройте Cloudflare Analytics
5. ✅ Проверьте все функции приложения

---

## 🎉 Готово!

Ваше приложение теперь работает на Cloudflare Pages с:
- ✅ Неограниченным bandwidth
- ✅ Глобальной CDN
- ✅ Автоматическими деплоями
- ✅ Бесплатным SSL
- ✅ Защитой от DDoS

**Удачного использования! 🚀**
