import { google } from "googleapis";
import { ScheduleItem } from "@/types/schedule";
import { stripEmoji } from "@/lib/sanitize";

export const loadSchedule = async (): Promise<ScheduleItem[]> => {
  try {

    // Проверка наличия переменных окружения
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("Отсутствуют необходимые переменные окружения");
    }


    // Инициализация API таблиц
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/^"|"$/g, "")
      : undefined;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });


    const sheets = google.sheets({ version: "v4", auth });


    // Получить данные таблицы
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: "11yZuQH7QFKQ7KZARLXaShu8U9DlhS1Usubn2hKqjn78",
      range: "A2:H",
    });


    const rows = response.data.values || [];

    if (!rows || rows.length === 0) {
      return [];
    }


    // Эмодзи в текстовых полях ломают поиск и сортировку — вычищаем на входе
    return rows.map((row, index) => ({
      id: `${index + 1}`,
      group: stripEmoji(row[0] || ""),
      dayOfWeek: stripEmoji(row[1] || ""),
      date: stripEmoji(row[2] || ""),
      time: stripEmoji(row[3] || ""),
      subject: stripEmoji(row[4] || ""),
      lessonType: stripEmoji(row[5] || ""),
      teacher: stripEmoji(row[6] || ""),
      classroom: stripEmoji(row[7] || ""),
    }));
  } catch (error) {
    console.error("Ошибка загрузки данных из Google Sheets:", error);
    throw error;
  }
};
