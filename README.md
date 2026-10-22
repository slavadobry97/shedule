# 📅 Расписание РГСУ

> Современное веб-приложение для просмотра расписания занятий Российского государственного социального университета

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7)](https://shedule-rgsu.netlify.app)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

🔗 **[Открыть приложение](https://shedule-rgsu.netlify.app)**

---

## ✨ Возможности

### 📱 Для Студентов
- **Быстрый поиск** расписания по группе или преподавателю
- **Календарный вид** с удобной навигацией по неделям
- **Подсветка текущего занятия** в реальном времени
- **Push-уведомления** 📲 об изменениях в расписании
- **Экспорт в PDF** для печати или сохранения
- **PWA поддержка** - работает офлайн и устанавливается как приложение

### 👨‍🏫 Для Преподавателей
- Просмотр расписания по ФИО
- Подписка на персональный календарь (iCal)
- Отслеживание нагрузки и "окон"

### 🤖 ИИ-Помощник "Игорь 2.0"
- Анализ расписания с помощью **Gemini 2.5 Flash**
- Поиск "окон" у групп
- Расчет нагрузки преподавателей
- Ответы на вопросы о расписании

---

## 🚀 Технологии

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React фреймворк с App Router
- **[TypeScript](https://www.typescriptlang.org/)** - типизация
- **[Tailwind CSS](https://tailwindcss.com/)** - стилизация
- **[shadcn/ui](https://ui.shadcn.com/)** - компоненты UI
- **[Framer Motion](https://www.framer.com/motion/)** - анимации

### Backend & Data
- **[Google Sheets API](https://developers.google.com/sheets/api)** - источник данных
- **[Upstash Redis](https://upstash.com/)** - кеширование и хранилище подписок
- **[Web Push](https://web.dev/push-notifications/)** - push-уведомления
- **[Gemini AI](https://ai.google.dev/)** - ИИ-помощник

### Инфраструктура
- **[Netlify](https://www.netlify.com/)** - хостинг и деплой
- **[PWA](https://web.dev/progressive-web-apps/)** - прогрессивное веб-приложение

---

## 📦 Установка и Запуск

### Требования
- Node.js 20+ (рекомендуется 20.x или 22.x)
- npm 10+

### Локальная разработка

1. **Клонировать репозиторий:**
```bash
git clone https://github.com/dab97/shedule.git
cd shedule
```

2. **Установить зависимости:**
```bash
npm install
```

3. **Настроить переменные окружения:**

Создайте файл `.env` в корне проекта:

```env
# URL сайта
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Upstash Redis (для push-уведомлений)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Google Service Account (для доступа к Google Sheets)
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# VAPID ключи (для push-уведомлений)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key

# Gemini AI (для ИИ-помощника)
GEMINI_API_KEY=your_gemini_api_key
```

4. **Запустить dev-сервер:**
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---

## 🌐 Деплой на Netlify

Подробная инструкция в [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md).

**Быстрый старт:**

1. Создайте проект на [Netlify](https://app.netlify.com)
2. Подключите GitHub репозиторий
3. Добавьте переменные окружения
4. Деплой запустится автоматически!

---

## 📋 Основные Команды

```bash
# Разработка
npm run dev          # Запуск dev-сервера

# Production
npm run build        # Сборка для production
npm run start        # Запуск production сервера

# Линтинг
npm run lint         # Проверка кода ESLint
```

---

## 🔔 Push-Уведомления

Приложение поддерживает push-уведомления об изменениях в расписании:

1. Откройте приложение
2. Разрешите уведомления в браузере
3. Выберите группу или преподавателя для отслеживания
4. Получайте уведомления при изменениях!

**Как это работает:**
- Автоматическая проверка изменений каждые 2 часа через cron-job.org
- Фильтрация по группам и преподавателям
- Работает даже при закрытом приложении (PWA)

Подробнее: [docs/deployment/CRON_JOB_SETUP.md](docs/deployment/CRON_JOB_SETUP.md)

---

## 📱 PWA (Progressive Web App)

Приложение можно установить на устройство:

### iOS (Safari)
1. Откройте сайт в Safari
2. Нажмите кнопку "Поделиться"
3. Выберите "На экран Домой"

### Android (Chrome)
1. Откройте сайт в Chrome
2. Нажмите меню (три точки)
3. Выберите "Установить приложение"

### Desktop (Chrome/Edge)
1. Откройте сайт
2. Нажмите иконку установки в адресной строке
3. Подтвердите установку

---

## 🗂️ Структура Проекта

```
shedule/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── push/         # Push-уведомления
│   │   └── schedule/     # Загрузка расписания
│   ├── debug/            # Страница отладки
│   └── page.tsx          # Главная страница
├── components/            # React компоненты
│   ├── ui/               # shadcn/ui компоненты
│   └── ...               # Кастомные компоненты
├── lib/                   # Утилиты и хелперы
│   ├── push-utils.ts     # Push-уведомления
│   ├── schedule-utils.ts # Работа с расписанием
│   └── debug-analysis.ts # Разбор данных расписания для /debug
├── public/               # Статические файлы
│   ├── manifest.json     # PWA манифест
│   └── sw.js            # Service Worker
├── utils/                # Вспомогательные функции
│   └── loadSchedule.ts   # Загрузка из Google Sheets
├── netlify.toml          # Конфигурация Netlify
└── package.json          # Зависимости
```

---

## 📝 История Изменений

См. [PUBLIC_CHANGELOG.md](PUBLIC_CHANGELOG.md) для полной истории обновлений.

**Последняя версия: 0.1.4** (04.02.2026)
- Миграция на Netlify (100 GB bandwidth)
- Исправление уязвимостей безопасности
- Обновление зависимостей

---

## 🤝 Вклад в Проект

Приветствуются pull requests! Для крупных изменений сначала откройте issue для обсуждения.

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменений (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

---

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

---

## 👨‍💻 Автор

**Dobrinetcvv** - [GitHub](https://github.com/dab97)

---

## 🙏 Благодарности

- [Next.js](https://nextjs.org/) - за отличный фреймворк
- [shadcn/ui](https://ui.shadcn.com/) - за красивые компоненты
- [Netlify](https://www.netlify.com/) - за надежный хостинг
- [Google](https://developers.google.com/) - за Sheets API и Gemini AI

---

<div align="center">

**[⬆ Вернуться к началу](#-расписание-ргсу)**

Сделано с ❤️ для студентов и преподавателей РГСУ

</div>
