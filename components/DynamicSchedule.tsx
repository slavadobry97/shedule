"use client";

import useSWR from "swr";
import { useEffect, useRef, useState } from "react";
import { ScheduleItem } from "@/types/schedule";
import { ScheduleTabs } from "@/components/schedule-tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { showScheduleToast, showToast } from "@/components/ui/sonner";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS, REFRESH_INTERVAL, STORAGE_KEYS } from "@/lib/constants";
import { compareScheduleData, ChangeDetails } from "@/lib/schedule-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/logo/brand-logo";

const fetcher = (url: string) => fetch(url).then((res) => res.json());



// Показываем уведомления об изменениях
const showChangeNotifications = (changes: ChangeDetails, onViewDetails: (changes: ChangeDetails) => void): void => {
  const maxToasts = 3;
  let count = 0;

  // Добавленные
  for (const item of changes.added) {
    if (count >= maxToasts) break;
    showScheduleToast({
      group: item.group,
      date: item.date,
      time: item.time,
      subject: item.subject,
      classroom: item.classroom,
      variant: 'success',
    });
    count++;
  }

  // Удалённые  
  for (const item of changes.removed) {
    if (count >= maxToasts) break;
    showScheduleToast({
      group: item.group,
      date: item.date,
      time: item.time,
      subject: item.subject,
      classroom: item.classroom,
      variant: 'error',
    });
    count++;
  }

  // Изменённые
  for (const { old, new: cur } of changes.modified) {
    if (count >= maxToasts) break;
    showScheduleToast({
      group: cur.group,
      date: cur.date,
      time: cur.time,
      subject: cur.subject,
      classroom: cur.classroom,
      teacher: cur.teacher,
      lessonType: cur.lessonType,
      variant: 'warning',
      // Передаём старые значения для отображения изменений
      oldSubject: old.subject !== cur.subject ? old.subject : undefined,
      oldClassroom: old.classroom !== cur.classroom ? old.classroom : undefined,
      oldTeacher: old.teacher !== cur.teacher ? old.teacher : undefined,
      oldLessonType: old.lessonType !== cur.lessonType ? old.lessonType : undefined,
    });
    count++;
  }

  // Если есть ещё изменения
  const total = changes.added.length + changes.removed.length + changes.modified.length;
  if (total > maxToasts) {
    showToast({
      title: 'Расписание обновлено',
      message: `Всего ${total} изменений. Нажмите, чтобы посмотреть подробности.`,
      variant: 'info',
      actionLabel: 'Посмотреть',
      onAction: () => onViewDetails(changes),
    });
  }
};

interface DynamicScheduleProps {
  initialGroup?: string;
  initialTeacher?: string;
}

export default function Home({ initialGroup, initialTeacher }: DynamicScheduleProps) {
  const [changesDialogOpen, setChangesDialogOpen] = useState(false);
  const [changesList, setChangesList] = useState<ChangeDetails | null>(null);

  const handleViewDetails = (changes: ChangeDetails) => {
    setChangesList(changes);
    setChangesDialogOpen(true);
  };
  const {
    data: schedule,
    error,
    isLoading,
    mutate,
  } = useSWR<ScheduleItem[]>(API_ENDPOINTS.SCHEDULE, fetcher, {
    refreshInterval: REFRESH_INTERVAL, // Обновляем каждую минуту
  });

  const previousDataRef = useRef<ScheduleItem[] | null>(null);
  const isFirstLoadRef = useRef(true);

  // Отслеживаем изменения в расписании
  useEffect(() => {
    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      if (isFirstLoadRef.current) {
        // Первая загрузка — просто сохраняем данные
        previousDataRef.current = [...schedule];
        isFirstLoadRef.current = false;
      } else if (previousDataRef.current) {
        const changes = compareScheduleData(previousDataRef.current, schedule);

        // Фильтрация изменений на основе выбранной группы или преподавателя
        let filteredChanges = changes;
        if (typeof window !== 'undefined') {
          // ЛОГИРОВАНИЕ ДЛЯ DEBUG (все изменения до фильтрации)
          try {
            const hasAnyChanges = changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0;
            if (hasAnyChanges) {
              const logEntry = {
                timestamp: Date.now(),
                changes: changes
              };
              const existingLog = sessionStorage.getItem('schedule_changes_log');
              const log = existingLog ? JSON.parse(existingLog) : [];
              log.unshift(logEntry); // Новые сверху
              // Храним последние 50 записей
              if (log.length > 50) log.length = 50;
              sessionStorage.setItem('schedule_changes_log', JSON.stringify(log));
            }
          } catch (e) {
            console.error('Failed to log schedule changes', e);
          }

          const selectedGroup = localStorage.getItem(STORAGE_KEYS.SELECTED_GROUP);
          const selectedTeacher = localStorage.getItem(STORAGE_KEYS.SELECTED_TEACHER);

          const isRelevant = (item: ScheduleItem) => {
            const groupMatch = selectedGroup && selectedGroup !== 'all' && item.group === selectedGroup;
            const teacherMatch = selectedTeacher && selectedTeacher !== 'all' && item.teacher === selectedTeacher;
            // Если ничего не выбрано (или выбрано "все"), показываем всё. 
            // Иначе - только то, что совпадает.
            if ((!selectedGroup || selectedGroup === 'all') && (!selectedTeacher || selectedTeacher === 'all')) {
              return true;
            }
            return groupMatch || teacherMatch;
          };

          filteredChanges = {
            added: changes.added.filter(isRelevant),
            removed: changes.removed.filter(isRelevant),
            modified: changes.modified.filter(({ old, new: cur }) => isRelevant(old) || isRelevant(cur)),
          };
        }

        const hasChanges = filteredChanges.added.length > 0 || filteredChanges.removed.length > 0 || filteredChanges.modified.length > 0;

        if (hasChanges) {
          showChangeNotifications(filteredChanges, handleViewDetails);
        }

        previousDataRef.current = [...schedule];
      }
    }
  }, [schedule]);

  // Отображаем ошибку, если есть
  if (error || (schedule && !Array.isArray(schedule))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Alert variant="destructive" className="flex flex-col items-center text-center p-6 space-y-4 border-2">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <AlertTitle className="text-xl font-bold tracking-tight">
                Ошибка загрузки расписания
              </AlertTitle>
              <AlertDescription className="text-sm opacity-90 leading-relaxed">
                {(schedule as any)?.error || "Не удалось загрузить данные. Проверьте подключение к интернету или попробуйте позже."}
              </AlertDescription>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="mt-4 w-full sm:w-auto gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
              onClick={() => mutate()}
            >
              <RefreshCcw className="h-4 w-4" />
              Попробовать снова
            </Button>
          </Alert>
        </motion.div>
      </div>
    );
  }

  // Состояние загрузки с анимацией и информативными сообщениями
  if (isLoading || !schedule) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-transparent to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            filter: [
              "drop-shadow(0 0 0px rgba(34, 50, 96, 0))",
              "drop-shadow(0 0 40px rgba(34, 50, 96, 0.6))",
              "drop-shadow(0 0 0px rgba(34, 50, 96, 0))"
            ]
          }}
          transition={{
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 },
            filter: {
              duration: 2.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop"
            }
          }}
          className="relative z-10 flex items-center justify-center"
        >
          <BrandLogo className="w-64 h-64" />
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Отображаем расписание с вкладками и таблицей */}
      <ScheduleTabs scheduleData={Array.isArray(schedule) ? schedule : []} isLoading={isLoading} initialGroup={initialGroup} initialTeacher={initialTeacher} />

      {/* Диалог со списком изменений */}
      <Dialog open={changesDialogOpen} onOpenChange={setChangesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Изменения в расписании</DialogTitle>
            <DialogDescription>
              Список последних изменений, отфильтрованный по вашим настройкам.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {changesList && (
                <>
                  {changesList.added.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Добавлено ({changesList.added.length})
                      </h3>
                      <div className="grid gap-2">
                        {changesList.added.map((item, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm text-sm">
                            <div className="font-semibold">{item.subject}</div>
                            <div className="text-muted-foreground flex gap-2 mt-1">
                              <Badge variant="outline">{item.date}</Badge>
                              <Badge variant="outline">{item.time}</Badge>
                              <Badge variant="outline">{item.group}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {changesList.modified.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        Изменено ({changesList.modified.length})
                      </h3>
                      <div className="grid gap-2">
                        {changesList.modified.map(({ old, new: cur }, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm text-sm">
                            <div className="font-semibold">{cur.subject}</div>
                            <div className="text-muted-foreground flex gap-2 mt-1 mb-2">
                              <Badge variant="outline">{cur.date}</Badge>
                              <Badge variant="outline">{cur.time}</Badge>
                              <Badge variant="outline">{cur.group}</Badge>
                            </div>
                            <div className="text-xs space-y-1 bg-muted/50 p-2 rounded">
                              {old.teacher !== cur.teacher && (
                                <div>
                                  <span className="text-muted-foreground">Преподаватель:</span>{" "}
                                  <span className="line-through text-red-500 opacity-70">{old.teacher}</span>{" "}
                                  <span>→</span>{" "}
                                  <span className="font-bold text-green-600 dark:text-green-400">{cur.teacher}</span>
                                </div>
                              )}
                              {old.classroom !== cur.classroom && (
                                <div>
                                  <span className="text-muted-foreground">Аудитория:</span>{" "}
                                  <span className="line-through text-red-500 opacity-70">{old.classroom}</span>{" "}
                                  <span>→</span>{" "}
                                  <span className="font-bold text-green-600 dark:text-green-400">{cur.classroom}</span>
                                </div>
                              )}
                              {old.lessonType !== cur.lessonType && (
                                <div>
                                  <span className="text-muted-foreground">Тип:</span>{" "}
                                  <span className="line-through text-red-500 opacity-70">{old.lessonType}</span>{" "}
                                  <span>→</span>{" "}
                                  <span className="font-bold text-green-600 dark:text-green-400">{cur.lessonType}</span>
                                </div>
                              )}
                              {old.subject !== cur.subject && (
                                <div>
                                  <span className="text-muted-foreground">Дисциплина:</span>{" "}
                                  <span className="line-through text-red-500 opacity-70">{old.subject}</span>{" "}
                                  <span>→</span>{" "}
                                  <span className="font-bold text-green-600 dark:text-green-400">{cur.subject}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {changesList.removed.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        Удалено ({changesList.removed.length})
                      </h3>
                      <div className="grid gap-2">
                        {changesList.removed.map((item, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm text-sm opacity-80 decoration-slate-500">
                            <div className="font-semibold line-through">{item.subject}</div>
                            <div className="text-muted-foreground flex gap-2 mt-1">
                              <Badge variant="outline">{item.date}</Badge>
                              <Badge variant="outline">{item.time}</Badge>
                              <Badge variant="outline">{item.group}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
