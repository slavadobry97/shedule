# Деплой на своём nginx + оптимизация отдачи расписания

Схема: nginx (домен `shedule.rgsu.by`) → Next.js на `127.0.0.1:3000`.

Расписание — самый тяжёлый ответ приложения: **3,89 МБ** в JSON (12 149 занятий).
Ниже — что с этим делается, чтобы студент не ждал.

## Что уже сделано в коде

| Слой | Как | Эффект |
|---|---|---|
| Кэш на сервере | `utils/scheduleCache.ts` — TTL 60 с, общий запрос к Google Sheets | повторный запрос 89 мс вместо 1,9–3 с; таблицу дёргаем один раз на 60 с, а не на каждого клиента |
| ETag + 304 | `app/api/schedule/route.ts` | клиент, у которого эта версия уже есть, получает `304 Not Modified` **без тела** — 3,9 МБ не идут по сети вообще |
| Кэш браузера | `Cache-Control: public, max-age=60, stale-while-revalidate=300` | повторное открытие в течение минуты — из кэша браузера |
| Service worker | `next.config.mjs` → `StaleWhileRevalidate` для `/api/schedule` (5 минут) | приложение открывается мгновенно, копия обновляется в фоне |

Осталось то, что решается на сервере: **сжатие** и **общий кэш на nginx**.

## 1. Сжатие (самое дешёвое, эффект — 17 раз)

```nginx
server {
    server_name shedule.rgsu.by;

    # Передавать уже сжатое
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;

    gzip_types
        application/json
        application/javascript
        text/css
        text/html
        text/plain
        text/xml
        application/xml
        image/svg+xml;

    # Brotli — если модуль установлен (nginx -V | grep brotli)
    # brotli on;
    # brotli_types application/json text/css application/javascript text/html;
    # brotli_comp_level 5;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Что это даёт на расписании (проверено на реальном ответе):

```
без сжатия   3,89 МБ
gzip -9        232 КБ   (5,8% от исходного)
brotli          85 КБ   (2,1%)
```

Проверить, что сжатие действительно работает:

```bash
curl -s -H 'Accept-Encoding: gzip' -o /dev/null -D - http://127.0.0.1:3000/api/schedule | grep -i content-encoding
```

В ответе должен быть `content-encoding: gzip`. Если его нет — nginx отдаёт несжатым: проверьте, что `gzip_types` включает `application/json` (по умолчанию JSON не сжимается ✗).

## 2. Общий кэш на nginx

Сейчас каждый браузер спрашивает origin заново. `proxy_cache` кэширует ответ на диске и
обновляет его **один раз на всех**, а не по одному ревалидашну на каждого клиента.

```nginx
proxy_cache_path /var/cache/nginx/schedule
                 levels=1:2
                 keys_zone=schedule:32m
                 max_size=2g
                 inactive=10m
                 use_temp_path=off;

server {
    server_name shedule.rgsu.by;

    location /api/schedule {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;

        proxy_cache schedule;
        proxy_cache_key $scheme$request_method$host$request_uri;
        proxy_cache_valid 200 60s;          # храним минуту
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_revalidate on;          # фоном обновляем, когда истекло
        proxy_cache_background_update on;
        proxy_cache_lock on;                 # один ревалидашн на всех, не по одному на клиента
        add_header X-Cache-Status $upstream_cache_status always;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`proxy_cache_lock on` — важно: без него «сталая» запись обновлялась бы отдельным
запросом на каждого клиента (тот самый шум, о котором писалось в карточке #4).

Проверить, что кэш работает:

```bash
curl -s -o /dev/null -D - http://127.0.0.1:3000/api/schedule | grep -i x-cache
# второй запрос: X-Cache-Status: HIT
```

## 3. Порядок проверки после настройки

1. `nginx -t` — конфиг без ошибок ✗
2. `systemctl reload nginx` ✗
3. Проверить сжатие и кэш (команды выше) ✗
4. Открыть приложение во вкладке Network: `/api/schedule` → у первого запроса `(from disk cache)` или `200`, у повторного `304` ✗

## Чего делать не надо

- **`proxy_cache` для `/debug`** ✗ — там состояние по авторизации, отдавать его из
  общего кэша нельзя. Service worker для `/debug` уже выключен через `NetworkOnly` ✗
- **Кэшировать `/api/schedule` дольше минуты** ✗ — расписание меняют за день до
  занятий, и задержка в 5 минут тут не страшна, но вот получасовой TTL ✗ уже
  приводит к «устаревшим» данным в приложении ✗
- **Отдавать `no-store`** ✗ — так и было раньше: ни браузер, ни CDN ничего не кэшировали,
  и каждый заход тянул 3,9 МБ ✗
