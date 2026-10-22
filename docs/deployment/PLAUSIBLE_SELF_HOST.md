# Аналитика Plausible

Проект использует [Plausible Analytics](https://github.com/plausible/analytics) —
privacy-first аналитику без cookie, без IP и без постоянных идентификаторов.
Это замена Vercel Analytics, который работает только на Vercel
(на Cloudflare Pages его endpoint `/_vercel/insights` отдаёт 404, и данные
не собираются вовсе).

Используется **облачный Plausible** (plausible.io). Свой инстанс для этого
проекта — лишняя инфраструктура: он тянет Docker, ≥2 ГБ RAM, CPU с SSE 4.2
(требование ClickHouse) и обновления раз в полгода. Вариант с инстансом
описан в самом конце — на случай, если решение поменяется.

## Что уже сделано в коде

| Файл | Что делает |
|------|-----------|
| `components/analytics.tsx` | Клиентский компонент, вызывает `init()` трекера |
| `app/layout.tsx` | `<PlausibleAnalytics />` в корневом layout |
| `lib/constants.ts` | `ANALYTICS.DOMAIN` / `ANALYTICS.ENDPOINT` из env |

Пакет: `@plausible-analytics/tracker` (MIT). Это и есть сам скрипт трекера
(он же ловит pageview'ы в SPA), подключать отдельный `<script>` не нужно.

### Переменные окружения

```env
# Домен сайта — ровно как он указан в настройках Plausible
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=shedule.rgsu.by

# Свой инстанс (не используется). Если задан — события идут на него
# вместо plausible.io:
# NEXT_PUBLIC_PLAUSIBLE_ENDPOINT=https://analytics.rgsu.by/api/event
```

**Без `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` счётчик не подключается вообще** —
ни одного запроса на сторонние сервера. Это удобно для локальной разработки:
`captureOnLocalhost` выключен, трекер игнорирует `localhost` и `127.0.0.1`.

## Подключение (актуально)

1. Зарегистрируйтесь на [plausible.io](https://plausible.io/register)
2. Добавьте сайт, укажите домен `shedule.rgsu.by`
3. Задайте `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=shedule.rgsu.by` в env окружения
   хостинга (тот, что отдаёт `shedule.rgsu.by`)
4. **Передеплойте** — `NEXT_PUBLIC_*` вшивается в бандл на сборке, без
   пересборки переменная не подхватится

Стоимость — от $9/мес за 10 000 просмотров. Данные обрабатываются
в европейских ЦОД, cookie не используются.

## Проверка, что всё работает

1. Откройте `https://shedule.rgsu.by` в браузере с DevTools → Network
2. Должен появиться `POST https://plausible.io/api/event` со статусом 200
3. В дашборде Plausible — событие `pageview` с доменом `shedule.rgsu.by`

## Свой инстанс (Plausible CE) — альтернатива

Полностью бесплатно, данные остаются на вашем сервере. Требования: Docker,
CPU с поддержкой **SSE 4.2** или **NEON** (требование ClickHouse), минимум
**2 ГБ RAM**, отдельный поддомен (например `analytics.rgsu.by`) с A-записью
на ваш сервер.

```bash
git clone -b v3.2.1 --single-branch https://github.com/plausible/community-edition plausible-ce
cd plausible-ce

cat > .env << EOF
BASE_URL=https://analytics.rgsu.by
SECRET_KEY_BASE=$(openssl rand -base64 48)
HTTP_PORT=8000
EOF

# Прокси на nginx: порты не публикуем наружу, слушаем только localhost
cat > compose.override.yml << EOF
services:
    plausible:
        ports:
            - "127.0.0.1:8000:8000"
EOF

docker compose up -d
```

nginx: реверс-прокси

```nginx
server {
    server_name analytics.rgsu.by;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Чтобы ad-blockеры не резали запросы, endpoint можно отдавать с собственного
домена приложения. В nginx для `shedule.rgsu.by`:

```nginx
location /api/event {
    proxy_pass http://127.0.0.1:8000/api/event;
    proxy_set_header Host analytics.rgsu.by;
}
```

Тогда `NEXT_PUBLIC_PLAUSIBLE_ENDPOINT=/api/event` (относительный путь).

> Внимание: `/api/event` на домене приложения должен обрабатываться nginx,
> а не Next.js — иначе запрос уйдёт в роут приложения и вернёт 404.
> Service Worker проекта перехватывает только GET-запросы `/api/*`,
> трекер шлёт POST, поэтому конфликта нет.

## Обновление своего инстанса

```bash
cd plausible-ce
git fetch --tags
git checkout v<новая-версия>
docker compose up -d
```

Plausible CE выходит **два раза в год** (long term release) — в отличие от
облачной версии, где обновления выходят несколько раз в неделю.

## Ограничения CE

- Нет премиум-функций: воронки, выручка, SSO, Sites API
- Базовая фильтрация ботов (облако — продвинутая, отсекает ~32 000 диапазонов IP дата-центров)
- Обновления — раз в полгода
- Поддержка только сообществом
