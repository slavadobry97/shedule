import { createCn } from "cn/config";

/**
 * cn с кеглями проекта: без регистрации text-xxs/text-tiny в font-size
 * tw-merge удаляет их рядом с text-цветом. Новый кастомный text-токен
 * добавляй сюда же. Резолв "cn" → этот файл в paths tsconfig.json.
 */
export const cn = createCn({
    extend: {
        classGroups: {
            "font-size": [{ text: ["xxs", "tiny"] }],
        },
    },
});
