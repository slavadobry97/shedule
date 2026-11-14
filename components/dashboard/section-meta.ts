import type { DebugTab } from "@/components/debug/ai-chat";

/**
 * Реестр разделов служебной зоны /dashboard — единый источник названий
 * и описаний (паттерн PageHeader из journal-rgsu): из него питаются и
 * пункты сайдбара, и заголовки разделов в контенте, поэтому они не могут
 * разойтись. Тексты — для не-ИТ человека (методиста), без жаргона.
 */
export const SECTION_META: Record<DebugTab, { title: string; description: string }> = {
    summary: {
        title: "Сводка",
        description: "Что происходит с расписанием прямо сейчас",
    },
    checks: {
        title: "Проверки",
        description: "Что мешает расписанию показываться правильно",
    },
    overview: {
        title: "Обзор",
        description: "Цифры: нагрузка, промежутки, аудитории",
    },
    records: {
        title: "Записи",
        description: "Каждая строка таблицы деканата; номер — ссылка в Google Таблицу",
    },
    table: {
        title: "Рассылка",
        description: "Собрать расписание по преподавателю или группе и скачать PDF",
    },
    journal: {
        title: "Журнал",
        description: "Что менялось, пока открыта страница",
    },
    history: {
        title: "История",
        description: "Что нового в приложении",
    },
    chat: {
        title: "ИИ-помощник",
        description: "Вопросы по данным расписания",
    },
    design: {
        title: "Дизайн-система",
        description: "Живая витрина токенов и компонентов проекта",
    },
};
