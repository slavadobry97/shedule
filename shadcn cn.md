<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# shadcn cn

`cn` — это утилита shadcn/ui для объединения и разрешения конфликтов Tailwind-классов. С сентября 2026 года shadcn/ui использует отдельный пакет `cn` вместо связки `clsx` + `tailwind-merge`.[^1_1][^1_2]

## Что делает `cn`

```tsx
import { cn } from "cn";

<div className={cn("flex items-center px-2", isActive && "bg-blue-500 text-white", className)} />
```

Она:

- соединяет классы, включая условия и объекты, как `clsx`;
- удаляет конфликтующие Tailwind-классы, оставляя последний, как `tailwind-merge`;
- не имеет зависимостей и работает с React, Vue, Svelte, Astro и обычными шаблонами.[^1_2]

Например, `cn("px-2", "px-4")` вернёт `px-4`, а не оба класса.

## Установка

```bash
npm i cn
# или
pnpm add cn
```

Для нового проекта shadcn:

```bash
npx shadcn@latest init
```

CLI сам установит `cn` и создаст `lib/utils.ts`.[^1_1]

## Миграция существующего проекта

Если у вас уже есть shadcn/ui со старым вариантом:

```ts
// lib/utils.ts — старый вариант
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

запустите:

```bash
npx shadcn@latest migrate cn
```

Команда перепишет импорты, заменит `twMerge(clsx(...))` на `cn`, а затем удалит `clsx` и `tailwind-merge`, если они больше нигде не используются.[^1_3][^1_1]

## Совместимость

Старый `lib/utils.ts` продолжает работать: shadcn сохраняет реэкспорт:

```ts
export { cn } from "cn";
```

Поэтому существующие импорты `import { cn } from "@/lib/utils"` не ломаются; новые компоненты из реестра импортируют `cn` напрямую из пакета.[^1_1]

Для вашего React/Next.js проекта практичный вариант — установить `cn` и постепенно заменить старый helper, либо сразу выполнить миграционную команду shadcn.[^1_2][^1_3]

<span style="display:none">[^1_10][^1_11][^1_4][^1_5][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://ui.shadcn.com/docs/changelog/2026-09-cn

[^1_2]: https://github.com/shadcn-ui/cn/

[^1_3]: https://github.com/shadcn-ui/cn/blob/main/README.md

[^1_4]: https://ui.shadcn.com/

[^1_5]: https://ui.shadcn.com/docs/changelog

[^1_6]: https://www.shadcn-ui.cn/

[^1_7]: https://shadcnstudio.com/

[^1_8]: https://github.com/shadcn-ui/ui

[^1_9]: https://www.shadcn.io/

[^1_10]: https://www.shadcndesign.com/

[^1_11]: https://t.co/lktIXMg7VD

