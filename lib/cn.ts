import { createCn } from "cn/config";

/**
 * cn с зарегистрированными кастомными кеглями проекта.
 *
 * Пакет «cn» в дефолтном конфиге не знает токены из globals.css
 * (--text-xxs/--text-tiny): рядом с text-цветом он классифицирует их как
 * «цвет» и удаляет — пилюля «ОШИБКА» рендерилась в 16px вместо 10px.
 * Здесь кегли зарегистрированы в группе font-size (каноничный путь из
 * README shadcn-ui/cn, раздел Custom themes), конфликт исчезает.
 *
 * Разрешение «cn» → этот файл — через paths в tsconfig.json: весь код
 * продолжает импортировать from "cn".
 *
 * Новый кастомный text-токен? Добавь его сюда же в "font-size".
 * Регрессионный тест: scripts/cn-tokens.test.mjs (npm run test:cn).
 */
export const cn = createCn({
    extend: {
        classGroups: {
            "font-size": [{ text: ["xxs", "tiny"] }],
        },
    },
});
