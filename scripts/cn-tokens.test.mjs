import { test } from "node:test";
import assert from "node:assert/strict";
import { cn } from "../lib/cn.ts";

/**
 * Регрессионный тест кастомных кеглей в cn: text-xxs/text-tiny должны
 * ВЫЖИВАТЬ рядом с text-цветами (дефолтный tw-merge пакета «cn» считал их
 * цветами и удалял — пилюля «ОШИБКА» рендерилась в 16px).
 */
test("text-xxs выживает рядом с text-цветом", () => {
    const out = cn("font-mono text-xxs uppercase tracking-[0.14em]", "border-destructive/30 bg-destructive/10 text-destructive");
    assert.match(out, /text-xxs/);
    assert.match(out, /text-destructive/);
});

test("text-tiny выживает рядом с text-цветом", () => {
    const out = cn("text-tiny", "text-muted-foreground");
    assert.match(out, /text-tiny/);
    assert.match(out, /text-muted-foreground/);
});

test("настоящие цвета по-прежнему конфликтуют правильно (последний побеждает)", () => {
    const out = cn("text-destructive", "text-success");
    assert.ok(!/text-destructive/.test(out));
    assert.match(out, /text-success/);
});

test("clsx-синтаксис работает (строки, условия, объекты, массивы)", () => {
    const out = cn("px-2", false && "hidden", { "font-bold": true }, ["text-xxs"]);
    assert.match(out, /px-2/);
    assert.ok(!/hidden/.test(out));
    assert.match(out, /font-bold/);
    assert.match(out, /text-xxs/);
});
