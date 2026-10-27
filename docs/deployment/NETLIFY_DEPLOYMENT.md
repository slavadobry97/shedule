# Деплой на Netlify (резервный вариант)

> **Статус: резерв.** Прод работает на cPanel (`https://shedule.rgsu.by`).
> Инструкция сохранена на случай переезда или аварии хостинга.

## Предварительно

- Аккаунт [Netlify](https://app.netlify.com) (бесплатный план).
- Репозиторий на GitHub/GitLab/Bitbucket, все изменения запушены.
- Локально проходит `npm run build`.

## Настройка

1. **Add new site → Import an existing project** → выберите репозиторий.
2. Параметры сборки подхватятся из `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Plugin**: `@netlify/plugin-nextjs`
3. **Site configuration → Environment variables** — добавьте те же
   переменные, что и на проде:

   ```env
   NEXT_PUBLIC_SITE_URL=https://<site>.netlify.app
   GOOGLE_CLIENT_EMAIL=...
   GOOGLE_PRIVATE_KEY=...
   VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=...
   AI_MODEL=dots-studio/dots-3-note-preview:free
   AI_ALLOWED_MODELS=...
   ```

4. **Deploy site**. После первого деплоя обновите `NEXT_PUBLIC_SITE_URL`
   и запустите **Retry deploy**.

## Ограничения

- `next-pwa` и service worker работают, но кэш CDN Netlify может задерживать
  обновление `sw.js` — после релиза проверьте версию.
- Push-уведомления требуют внешнего cron (см. `CRON_JOB_SETUP.md`):
  Netlify Scheduled Functions или cron-job.org.
- Serverless-функции не хранят состояние — серверный кэш расписания
  (`utils/scheduleCache.ts`) живёт только в пределах инстанса.

## Проверка

```bash
curl -I https://<site>.netlify.app
curl -s https://<site>.netlify.app/api/schedule/meta | head
```

Оба запроса должны вернуть `200` и JSON.
