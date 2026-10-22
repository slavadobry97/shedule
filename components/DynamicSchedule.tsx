"use client";

import useSWR from "swr";
import { useEffect, useRef, useState } from "react";
import { ScheduleItem, ScheduleMeta } from "@/types/schedule";
import { ScheduleTabs } from "@/components/schedule-tabs";
import { ScheduleError } from "@/components/schedule-error";
import { motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, motionTransition } from "@/lib/motion";
import { showScheduleToast, showToast } from "@/components/ui/sonner";
import { API_ENDPOINTS, REFRESH_INTERVAL, STORAGE_KEYS } from "@/lib/constants";
import { metaFetcher, scheduleFetcher } from "@/lib/api";
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

const fetcher = scheduleFetcher;



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

/**
 * Выбор группы или преподавателя живёт здесь, а не внутри ScheduleView:
 * от него зависит ключ SWR — расписание фильтруется на сервере, и клиенту
 * нужны только строки своей группы.
 */
export default function Home({ initialGroup, initialTeacher }: DynamicScheduleProps) {
  const reduceMotion = useReducedMotion();
  const [changesDialogOpen, setChangesDialogOpen] = useState(false);
  const [changesList, setChangesList] = useState<ChangeDetails | null>(null);

  // Начальное значение берём только из адреса: localStorage читаем после
  // монтирования, иначе сервер и клиент отрисовали бы разное.
  const [selectedGroup, setSelectedGroup] = useState<string>(initialGroup ?? "all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>(initialTeacher ?? "all");
  const [isMounted, setIsMounted] = useState(false);

  const handleViewDetails = (changes: ChangeDetails) => {
    setChangesList(changes);
    setChangesDialogOpen(true);
  };

  // Сохранённый выбор подхватываем после монтирования: на сервере
  // localStorage недоступен, и иначе разметка сервера и клиента разошлась бы.
  // Значения из адреса запоминаем при первом рендере — дальше они меняются
  // вместе с историей браузера, и восстановление из памяти началось бы заново.
  const initialSelectionRef = useRef({ group: initialGroup, teacher: initialTeacher });

  useEffect(() => {
    setIsMounted(true);

    const { group, teacher } = initialSelectionRef.current;

    if (!group || group === "all") {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_GROUP);
      if (saved && saved !== "all") setSelectedGroup(saved);
    }

    if (!teacher || teacher === "all") {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_TEACHER);
      if (saved && saved !== "all") setSelectedTeacher(saved);
    }
  }, []);

  // Ключ зависит от выбранной группы/преподавателя: сервер отдаёт только
  // нужные строки. Без фильтра — всё расписание (3,9 МБ).
  //
  // Если не выбрано ни то, ни другое, показывается приветственный экран —
  // расписание в этом состоянии не нужно вовсе, поэтому и не качаем его:
  // хватает списка групп и преподавателей из мета-ручки.
  const scheduleKey = (() => {
    const params = new URLSearchParams();
    if (selectedGroup && selectedGroup !== "all") params.set("group", selectedGroup);
    if (selectedTeacher && selectedTeacher !== "all") params.set("teacher", selectedTeacher);
    const query = params.toString();
    return query ? `${API_ENDPOINTS.SCHEDULE}?${query}` : null;
  })();

  const {
    data: schedule,
    error,
    isLoading,
 isValidating,
    mutate,
  } = useSWR<ScheduleItem[]>(scheduleKey, fetcher, {
    refreshInterval: REFRESH_INTERVAL, // Обновляем каждую минуту
  });

  // Списки групп и преподавателей — отдельная лёгкая ручка: расписание уже
  // отфильтровано, а списки нужны всегда (приветственный экран, меню).
  const { data: meta, error: metaError, mutate: mutateMeta } = useSWR<ScheduleMeta>(
    API_ENDPOINTS.SCHEDULE_META,
    metaFetcher,
    {
      refreshInterval: REFRESH_INTERVAL,
    }
  );

  const previousDataRef = useRef<ScheduleItem[] | null>(null);
  const isFirstLoadRef = useRef(true);
  // Хоть раз получили расписание: после этого смена группы показывается
  // скелетонами, а не заставкой на весь экран.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (schedule) hasLoadedRef.current = true;
  }, [schedule]);

  // Сменился фильтр — набор строк другой, сравнивать его с предыдущим
  // бессмысленно: получили бы «изменения» из-за смены группы.
  useEffect(() => {
    previousDataRef.current = null;
    isFirstLoadRef.current = true;
  }, [scheduleKey]);

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

          // Расписание приходит уже отфильтрованным по выбранной группе
          // или преподавателю, поэтому все пришедшие изменения относятся к
          // тому, что пользователь сейчас смотрит. Если фильтр не выбран,
          // данные — весь вуз, и оповещать о каждой правке не нужно.
          const isRelevant = (item: ScheduleItem) => {
            if (selectedGroup !== "all" && item.group === selectedGroup) return true;
            if (selectedTeacher !== "all" && item.teacher === selectedTeacher) return true;
            return false;
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
  if (error || metaError || (schedule && !Array.isArray(schedule))) {
    return (
      <ScheduleError
        error={error ?? metaError ?? new Error((schedule as any)?.error || "Некорректный ответ сервера")}
        onRetry={() => {
          if (metaError) void mutateMeta();
          else void mutate();
        }}
        isRetrying={isValidating}
      />
    );
  }

  // Состояние загрузки с анимацией и информативными сообщениями.
  // Пока не смонтировались — заставка: иначе приветственный экран мелькнул бы
  // перед восстановлением группы из памяти. Дальше заставка только на первой
  // загрузке расписания: смена группы показывается скелетонами.
  const showSplash = !isMounted
    ? true
    : !meta
      ? true
      : scheduleKey !== null && !hasLoadedRef.current && (isLoading || !schedule);

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-brand-gradient">
        {/* Мягкий свет сверху — объём фона */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(255,255,255,0.16),transparent_60%)]"
        />
        {/* Виньетка — композиция собирается к центру */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_70%_at_50%_45%,transparent_45%,rgba(2,6,20,0.32)_100%)]"
        />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={motionTransition(reduceMotion, { duration: MOTION_DURATION.slow })}
          className="relative z-10"
        >
          <BrandLogo
            className="h-40 w-auto sm:h-56 text-white"
            // Одна мягкая тень: знак парит над градиентом, но не пачкает его
            style={{ filter: "drop-shadow(0 20px 36px rgba(2, 6, 20, 0.32))" }}
          />
        </motion.div>

      </div>
    );
  }

  return (
    <div>
      {/* Отображаем расписание с вкладками и таблицей */}
      <ScheduleTabs
        scheduleData={Array.isArray(schedule) ? schedule : []}
        isLoading={isLoading}
        initialGroup={initialGroup}
        initialTeacher={initialTeacher}
        meta={meta}
        selectedGroup={selectedGroup}
        selectedTeacher={selectedTeacher}
        onGroupChange={setSelectedGroup}
        onTeacherChange={setSelectedTeacher}
      />

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
                      <h3 className="font-medium flex items-center gap-2 text-success">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        Добавлено ({changesList.added.length})
                      </h3>
                      <div className="grid gap-2">
                        {changesList.added.map((item, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs text-sm">
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
                      <h3 className="font-medium flex items-center gap-2 text-warning">
                        <div className="h-2 w-2 rounded-full bg-warning" />
                        Изменено ({changesList.modified.length})
                      </h3>
                      <div className="grid gap-2">
                        {changesList.modified.map(({ old, new: cur }, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs text-sm">
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
                                  <span className="line-through text-destructive opacity-70">{old.teacher}</span>{" "}
                                  <span>→</span>{" "}
                                  <span className="font-bold text-success">{cur.teacher}</span>
                      </div>
                              )}
                              {old.classroom !== cur.classroom && (
                                <div>
                                  <span className="text-muted-foreground">Аудитория:</span>{" "}
                                  <span className="line-through text-destructive opacity-70">{old.classroom}</span>{" "}
                                  <span>→</span>{" "}
                                  <span className="font-bold text-success">{cur.classroom}</span>
                    </div>
                              )}
                              {old.lessonType !== cur.lessonType && (
                                <div>
                                  <span className="text-muted-foreground">Тип:</span>{" "}
                                  <span className="line-through text-destructive opacity-70">{old.lessonType}</span>{" "}
                                  <span>→</span>{" "}
                                  <span className="font-bold text-success">{cur.lessonType}</span>
                            </div>
                              )}
                              {old.subject !== cur.subject && (
                                <div>
                                  <span className="text-muted-foreground">Дисциплина:</span>{" "}
                                  <span className="line-through text-destructive opacity-70">{old.subject}</span>{" "}
                                  <span>→</span>{" "}
                                  <span className="font-bold text-success">{cur.subject}</span>
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
                      <h3 className="font-medium flex items-center gap-2 text-destructive">
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                        Удалено ({changesList.removed.length})
                      </h3>
                      <div className="grid gap-2">
                        {changesList.removed.map((item, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs text-sm opacity-80 decoration-slate-500">
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
