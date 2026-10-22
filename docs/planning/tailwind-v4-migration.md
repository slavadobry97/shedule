# План миграции на Tailwind CSS v4

**Статус:** выполнено
**Дата:** 21.10.2026
**Версия Tailwind:** 3.4.19 → 4.3.3

---

## Зачем

- v3 больше не получает обновлений; v4 — CSS-first, быстрее собирается, новая
  система токенов `@theme` вместо `tailwind.config.js`.
- Уже сделана миграция на `cn` (shadcn-ui/cn) — его таблицы классов ориентированы
  именно на **Tailwind v4**, так что теперь они работают «по-родному».
- В проекте уже был `@tailwindcss/upgrade`-совместимый стек (Next 16, React 19).

## Риски, которые закрывались заранее

| Риск | Что делали |
|------|-----------|
| `cn` и `twMerge` дают разные результаты на v3-классах | До миграции измерили: 147 вызовов `cn()` + 21 170 пар реальных классов проекта → **0 расхождений** |
| Палитра «поплывёт» при переводе HSL → OKLCH | Оставили **HSL** (официальный неломающий путь shadcn): значения обёрнуты в `hsl()`, в `@theme` — `var(--x)` |
| Переименованные в v4 утилиты тихо сломают стили | Скомпилировали реальный `globals.css` под v4 и сверили **все 766 классов** проекта с получившимися правилами |
| Тёмная тема перестанет работать | `@custom-variant dark (&:where(.dark, .dark *))` + проверка вычисленных стилей |

## Шаги

### 1. Зависимости

```bash
npm i -D tailwindcss@^4 @tailwindcss/postcss@^4 tw-animate-css
npm un tailwindcss-animate
```

`tailwindcss-animate` заменён на `tw-animate-css` (официальная замена shadcn).

### 2. Конфигурация → CSS

- `tailwind.config.ts` — **удалён**. Всё перенесено в `app/globals.css`:
  - `:root` / `.dark` — токены, обёрнутые в `hsl()`
  - `@theme inline` — `--color-*`, `--radius-*`, `--text-xxs/tiny`, `--font-sans/mono/evolventa`, `--animate-accordion-*`
  - `@keyframes accordion-down/up` — перенесены из конфига
  - `@custom-variant dark` — режим по классу `.dark` (next-themes)
- `postcss.config.mjs` → `{ "@tailwindcss/postcss": {} }`
- `components.json` → `"tailwind": { "config": "" }`

### 3. Переименования утилит v3 → v4

| v3 | v4 | Где |
|----|----|-----|
| `flex-shrink-0` | `shrink-0` | 9 мест |
| `shadow-sm` | `shadow-xs` | 18 мест |
| `backdrop-blur-sm` | `backdrop-blur-xs` | 2 места |
| `outline-none` | `outline-hidden` | 16 мест |
| `transform` | убран (в v4 transform по умолчанию) | 3 места |
| `animate-fade-in` | убран (был из tailwindcss-animate) | 1 место |

### 4. Переменные в коде

`hsl(var(--border))` → `var(--border)`, `hsl(var(--destructive)/0.07)` →
`color-mix(in oklab, var(--destructive) 7%, transparent)`
(`components/landing/hero.tsx`, `components/schedule-error.tsx`).

В `globals.css` то же: `pulse-ring` переведён на `color-mix`.

### 5. Проверка

1. `tsc --noEmit` — чисто
2. `next build` — собирается, CSS 96,5 КБ
3. **Сверка словаря классов**: реальный `globals.css` компилируется под v4,
   для каждого из 766 классов проекта проверяется наличие правила → 8 неопознанных,
   из них 5 — заведомо мёртвые классы (см. ниже), 1 — маркер `group/calendar`
4. **Сверка вычисленных стилей** до/после: цвета, радиусы, тени, шрифты, трекинг —
   совпадают
5. Тёмная тема — переменные переопределяются в `.dark` ✓
6. Service worker в dev отключён (см. ниже) — консоль чистая

## Что осталось мёртвым (было мёртвым и в v3)

- `prose`, `prose-sm`, `prose-p:*`, `prose-pre:*`, `dark:prose-invert` — плагин
  `@tailwindcss/typography` не установлен, эти классы никогда не работали
  (используются в debug-чате). Если нужен типографичный вид — добавить плагин.
- `xs:order-2` — брейкпоинта `xs` не существует ни в v3, ни в v4, класс не
  действует. В v4 можно добавить `--breakpoint-xs: 30rem` в `@theme`, если
  поведение нужно изменить (не меняли, чтобы не менять вёрстку мимо задачи).
- `group/calendar` — маркер именованной группы, правил не имеет сам по себе
  (ложное срабатывание проверки).

## Побочный эффект: service worker в dev

Во время проверок всплыл баг, не связанный с Tailwind: в браузере остался
service worker от production-сборки. Он кэширует страницы и отдаёт устаревшие
бандлы → ломается гидратация, React роняет обновления состояния
(«Can't perform a React state update on a component that hasn't mounted yet»),
страница «залипает» на старой версии.

Исправлено:

- `next.config.mjs`: `disable: process.env.NODE_ENV === "development"`
- `components/pwa-dev-cleanup.tsx`: в dev снимает регистрацию SW и чистит кэши
  (в production не трогает ничего)

## Чек-лист для будущих обновлений

- [ ] Новые shadcn-компоненты добавлять через CLI — он подставляет `import { cn } from "cn"`
- [ ] Токены править только в `app/globals.css` (`@theme inline`), не в JS
- [ ] После изменения палитры проверять `bg-*/50` и прочие opacity-модификаторы
- [ ] При обновлении `tw-animate-css` проверять `animate-in`/`fade-in-0`/`zoom-in-95`
