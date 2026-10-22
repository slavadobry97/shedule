"use client";

/**
 * Таблица деканата. Данные читаются из диапазона A2:H, поэтому запись с
 * номером N в приложении лежит на строке N+1 листа «shedule».
 * Человек, который правит расписание, открывает таблицу по этим номерам —
 * значит показывать надо настоящий номер строки и давать на него ссылку.
 */
const SPREADSHEET_ID = "11yZuQH7QFKQ7KZARLXaShu8U9DlhS1Usubn2hKqjn78";
const SPREADSHEET_GID = "558950841";

export function sheetRowUrl(appIndex: number) {
    const row = appIndex + 1;
    return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=${SPREADSHEET_GID}&range=A${row}:H${row}`;
}

/** Номер строки листа как ссылка в таблицу деканата */
export function SheetRowLink({ index, prefix = "" }: { index: number; prefix?: string }) {
    const row = index + 1;

    return (
        <a
            href={sheetRowUrl(index)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Открыть строку ${row} в таблице деканата`}
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
            {prefix}
            {row}
        </a>
    );
}
