/** Списки групп и преподавателей — отдельная лёгкая ручка. */
export interface ScheduleMeta {
    groups: string[];
    teachers: string[];
}

export interface ScheduleItem {
  id?: string;
  group: string;
  dayOfWeek: string;
  date: string;
  time: string;
  subject: string;
  teacher: string;
  classroom: string;
  lessonType: string;
}
