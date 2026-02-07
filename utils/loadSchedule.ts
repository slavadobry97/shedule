import { google } from "googleapis";
import { ScheduleItem } from "@/types/schedule";

export const loadSchedule = async (): Promise<ScheduleItem[]> => {
  try {
    console.log("Начало загрузки расписания");

    // Проверка наличия переменных окружения
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("Отсутствуют необходимые переменные окружения");
    }

    console.log("Переменные окружения проверены");

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

    console.log("Аутентификация Google создана");

    const sheets = google.sheets({ version: "v4", auth });

    console.log("Начало запроса к Google Sheets");

    // Получить данные таблицы
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: "11yZuQH7QFKQ7KZARLXaShu8U9DlhS1Usubn2hKqjn78",
      range: "A2:H",
    });

    console.log("Данные получены из Google Sheets");

    const rows = response.data.values || [];

    if (!rows || rows.length === 0) {
      console.log("Данные не найдены в таблице");
      return [];
    }

    console.log(`Получено ${rows.length} строк данных`);

    return rows.map((row, index) => ({
      id: `${index + 1}`,
      group: row[0] || "",
      dayOfWeek: row[1] || "",
      date: row[2] || "",
      time: row[3] || "",
      subject: row[4] || "",
      lessonType: row[5] || "",
      teacher: row[6] || "",
      classroom: row[7] || "",
    }));
  } catch (error) {
    console.error("Ошибка загрузки данных из Google Sheets:", error);
    throw error;
  }
};
