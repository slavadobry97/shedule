import { createCn } from "cn/config";

/**
 * cn с кеглями и тонированными подложками проекта: без регистрации
 * text-xxs/text-tiny в font-size tw-merge удаляет их рядом с text-цветом;
 * без группы bg-tone утилиты bg-tone-* (globals.css) считаются bg-цветом
 * и удаляют рядом с собой bg-card — карточка становится прозрачной.
 * Новый кастомный text-токен или tone добавляй сюда же. Резолв "cn" →
 * этот файл в paths tsconfig.json.
 */
export const cn = createCn({
    extend: {
        classGroups: {
            "font-size": [{ text: ["xxs", "tiny"] }],
            "bg-tone": [
                "bg-tone-info",
                "bg-tone-success",
                "bg-tone-warning",
                "bg-tone-destructive",
            ],
        },
    },
});
