"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/sonner";
import {
  format,
  startOfWeek,
  addDays,
  addMonths,
  subMonths,
  parse,
  isWithinInterval,
  isSameDay,
  isSameMonth,
  isSameWeek,
} from "date-fns";
import {
  DAYS_OF_WEEK,
  DATE_FORMATS,
  STORAGE_KEYS,
  BREAKPOINTS,
} from "@/lib/constants";
import { ru } from "date-fns/locale";
import { ScheduleItem, ScheduleMeta } from "@/types/schedule";
import { ScheduleFilters } from "./schedule-filters";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayScheduleView } from "./day-schedule-view";
import { DesktopScheduleView } from "./desktop-schedule-view";
import { MobileScheduleView } from "./mobile-schedule-view";
import { MonthScheduleView } from "./month-schedule-view";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { haptic } from "@/lib/haptics";
import { WelcomeScreen } from "./WelcomeScreen";

type ScheduleViewProps = {
  scheduleData: ScheduleItem[];
  initialGroup?: string;
  initialTeacher?: string;
  meta?: ScheduleMeta;
  selectedGroup: string;
  selectedTeacher: string;
  onGroupChange: (group: string) => void;
  onTeacherChange: (teacher: string) => void;
};

export function ScheduleView({
  scheduleData,
  initialGroup,
  initialTeacher,
  meta,
  selectedGroup,
  selectedTeacher,
  onGroupChange,
  onTeacherChange
}: ScheduleViewProps) {
  const router = useRouter();

  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [searchTerm] = useState<string>("");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedLesson, setSelectedLesson] = useState<ScheduleItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDesktop, setIsDesktop] = useState(false);

  // Sync state with URL using router.replace for Breadcrumbs
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      let changed = false;

      if (selectedGroup !== "all") {
        if (params.get("group") !== selectedGroup) {
          params.set("group", selectedGroup);
          params.delete("teacher");
          changed = true;
        }
      } else {
        if (params.has("group")) {
          params.delete("group");
          changed = true;
        }
      }

      if (selectedTeacher !== "all") {
        if (params.get("teacher") !== selectedTeacher) {
          params.set("teacher", selectedTeacher);
          params.delete("group");
          changed = true;
        }
      } else {
        if (params.has("teacher")) {
          params.delete("teacher");
          changed = true;
        }
      }

      if (changed) {
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        router.replace(newUrl, { scroll: false });
      }
    }
  }, [selectedGroup, selectedTeacher, router]);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    haptic(type);
  };

  const [, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= BREAKPOINTS.SM);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSaveGroup = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, selectedGroup);
      localStorage.setItem(STORAGE_KEYS.SELECTED_TEACHER, "all");
      onTeacherChange("all");
      haptic('success');
      showToast({
        title: `Группа "${selectedGroup}" сохранена`,
        message: "Теперь это ваша группа по умолчанию",
        variant: 'success',
      });
    }
  };

  const handleSaveTeacher = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SELECTED_TEACHER, selectedTeacher);
      localStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, "all");
      onGroupChange("all");
      haptic('success');
      showToast({
        title: `Преподаватель "${selectedTeacher}" сохранён`,
        message: "Теперь это ваш профиль по умолчанию",
        variant: 'success',
      });
    }
  };

  const getCurrentWeekDates = () => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    return { start, end };
  };

  // «Сегодня» — мёртвый клик, когда вид уже показывает сегодня (№126):
  // гасим кнопку, чтобы состояние перехода было читаемо.
  const atToday = view === "day"
    ? isSameDay(date, new Date())
    : view === "month"
        ? isSameMonth(date, new Date())
        : isSameWeek(date, new Date(), { weekStartsOn: 1 });

  const daysWithDates = useMemo(() => {
    const { start } = getCurrentWeekDates();
    return DAYS_OF_WEEK.map((day, index) => {
      const currentDay = addDays(start, index);
      return {
        ...day,
        date: format(currentDay, DATE_FORMATS.SHORT),
        fullDate: format(currentDay, DATE_FORMATS.FULL),
      };
    });
  }, [date]);

  const handleLessonClick = (lesson: ScheduleItem) => {
    setSelectedLesson(lesson);
  };

  const filteredData = useMemo(() => {
    const { start, end } = getCurrentWeekDates();
    return scheduleData.filter((item) => {
      const itemDate = parse(item.date, "dd.MM.yyyy", new Date());
      return (
        (selectedGroup === "all" || item.group === selectedGroup) &&
        (selectedTeacher === "all" || item.teacher === selectedTeacher) &&
        item.teacher.toLowerCase().includes(searchTerm.toLowerCase()) &&
        isWithinInterval(itemDate, { start, end })
      );
    });
  }, [scheduleData, selectedGroup, selectedTeacher, date, searchTerm]);

  const monthData = useMemo(() => {
    const { start, end } = { start: new Date(date.getFullYear(), date.getMonth(), 1), end: new Date(date.getFullYear(), date.getMonth() + 1, 0) };
    return scheduleData.filter((item) => {
      const itemDate = parse(item.date, "dd.MM.yyyy", new Date());
      return (
        (selectedGroup === "all" || item.group === selectedGroup) &&
        (selectedTeacher === "all" || item.teacher === selectedTeacher) &&
        item.teacher.toLowerCase().includes(searchTerm.toLowerCase()) &&
        itemDate >= start && itemDate <= end
      );
    });
  }, [scheduleData, selectedGroup, selectedTeacher, date, searchTerm]);

  // Списки приходят отдельной лёгкой ручкой: само расписание уже отфильтровано
  // по выбранной группе, и считать списки из него нельзя.
  const uniqueGroups = useMemo(() => meta?.groups ?? [], [meta]);
  const uniqueTeachers = useMemo(() => meta?.teachers ?? [], [meta]);

  // initialGroup/initialTeacher применяются ниже, через handleGroupChange/
  // handleTeacherChange, чтобы сбросить противоположный фильтр.

  const handleGroupChange = (newGroup: string) => {
    onGroupChange(newGroup);
    if (newGroup !== "all") {
      onTeacherChange("all");
    }
  };

  const handleTeacherChange = (newTeacher: string) => {
    onTeacherChange(newTeacher);
    if (newTeacher !== "all") {
      onGroupChange("all");
    }
  };

  // Применяем значения из адреса через обёртки, чтобы при смене фильтра
  // противоположный сбрасывался (иначе могут остаться оба выбранными).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (initialGroup && initialGroup !== "all") {
      handleGroupChange(initialGroup);
    } else if (initialTeacher && initialTeacher !== "all") {
      handleTeacherChange(initialTeacher);
    }
  }, [initialGroup, initialTeacher]);

  // Show Welcome Screen if no selection made. Важно: после всех хуков —
  // ранний return до последнего useEffect роняет компонент
  // («Rendered fewer hooks than expected») при сбросе фильтра в «Все группы».
  if (selectedGroup === "all" && selectedTeacher === "all") {
    return (
      <div className="fixed inset-0 z-50 bg-canvas">
        <WelcomeScreen
          groups={uniqueGroups}
          teachers={uniqueTeachers}
          onGroupSelect={(g) => {
            onGroupChange(g);
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, g);
              localStorage.setItem(STORAGE_KEYS.SELECTED_TEACHER, "all");
            }
          }}
          onTeacherSelect={(t) => {
            onTeacherChange(t);
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEYS.SELECTED_TEACHER, t);
              localStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, "all");
            }
          }}
        />
      </div>
    );
  }

  return (
    // pt-4: воздух под шапкой — раньше его давал блок табов (py-2 + высота
    // табов), убранный при переезде «Таблицы» в /debug.
    <div className="space-y-3 pt-4 pb-4">
      <div className="flex flex-wrap items-end gap-2">
        <ScheduleFilters
          groups={uniqueGroups}
          teachers={uniqueTeachers}
          selectedGroup={selectedGroup}
          selectedTeacher={selectedTeacher}
          onGroupChange={handleGroupChange}
          onTeacherChange={handleTeacherChange}
          onSaveGroup={handleSaveGroup}
          onSaveTeacher={handleSaveTeacher}
        />

        {/* Единая панель: заголовок над строкой [Неделя|Месяц] [‹] [Сегодня] [›] */}
        {/* w-full на всех ширинах: пилюли разнесены по краям строки
            (переключатель слева, навигация периодов справа — ml-auto). */}
        <div className="flex w-full flex-col items-end gap-0.5">
            {/* Заголовок */}
            <h2 className="whitespace-nowrap text-sm font-semibold tabular-nums tracking-tight">
                {view === "day"
                    ? format(date, "d MMMM yyyy", { locale: ru })
                    : view === "week"
                    ? `${format(getCurrentWeekDates().start, "dd.MM.yyyy")} – ${format(getCurrentWeekDates().end, "dd.MM.yyyy")}`
                    : format(date, "LLLL yyyy", { locale: ru })}
            </h2>

            {/* Ряд: переключатель + группа [стрелки + Сегодня].
                Переносимая строка: на узких экранах пилюли встают в две строки.
                Высота тач-цели 40px — компромисс ниже HIG-44 (см. аудит №88),
                но выше WCAG-AA 24px; выбрана, чтобы пара пилюль помещалась в 320px. */}
            <div className="flex w-full flex-wrap items-center gap-1.5">
                <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week" | "month")}>
                    <TabsList className="flex h-auto items-center gap-0.5 rounded-3xl border bg-muted p-0.5">
                        {([
                            { id: "day", label: "День" },
                            { id: "week", label: "Неделя" },
                            { id: "month", label: "Месяц" },
                        ] as const).map(({ id, label }) => (
                            <TabsTrigger
                                key={id}
                                value={id}
                                className="flex h-10 items-center rounded-3xl border border-transparent px-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:h-8 sm:px-3 data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
                            >
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* ml-auto: на одной строке прижимает пилюлю к правому краю,
                    при переносе — к правому краю своей строки (а не к левому,
                    как делал бы justify-between). */}
                <div className="ml-auto flex items-center gap-0.5 rounded-3xl border bg-muted p-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            triggerHaptic("medium");
                            setDate(prev =>
                                view === "month"
                                    ? subMonths(prev, 1)
                                    : addDays(prev, view === "day" ? -1 : -7)
                            );
                        }}
                        className="h-10 w-10 shrink-0 rounded-3xl transition-[color,background-color,box-shadow,transform] active:scale-[0.93] hover:bg-card sm:h-8 sm:w-8"
                        aria-label={view === "month" ? "Предыдущий месяц" : view === "day" ? "Предыдущий день" : "Предыдущая неделя"}
                        title={view === "month" ? "Предыдущий месяц" : view === "day" ? "Предыдущий день" : "Предыдущая неделя"}
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={atToday}
                        onClick={() => {
                            triggerHaptic("medium");
                            setDate(new Date());
                        }}
                        className={cn(
                            "h-10 shrink-0 rounded-3xl px-2.5 text-xs font-medium transition-[color,background-color,box-shadow,transform] active:scale-[0.95] hover:bg-card sm:h-8 sm:px-3 sm:text-sm",
                            atToday && "opacity-40"
                        )}
                    >
                        Сегодня
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            triggerHaptic("medium");
                            setDate(prev =>
                                view === "month"
                                    ? addMonths(prev, 1)
                                    : addDays(prev, view === "day" ? 1 : 7)
                            );
                        }}
                        className="h-10 w-10 shrink-0 rounded-3xl transition-[color,background-color,box-shadow,transform] active:scale-[0.93] hover:bg-card sm:h-8 sm:w-8"
                        aria-label={view === "month" ? "Следующий месяц" : view === "day" ? "Следующий день" : "Следующая неделя"}
                        title={view === "month" ? "Следующий месяц" : view === "day" ? "Следующий день" : "Следующая неделя"}
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {view === "day" && (
        <DayScheduleView
          date={date}
          filteredData={filteredData}
          selectedGroup={selectedGroup}
          onLessonClick={handleLessonClick}
          onPrevDate={() => {
            haptic("light");
            setDate(prev => addDays(prev, -1));
          }}
          onNextDate={() => {
            haptic("light");
            setDate(prev => addDays(prev, 1));
          }}
        />
      )}

      {view === "week" && (
        <>
          <MobileScheduleView
            date={date}
            setDate={setDate}
            filteredData={filteredData}
            selectedGroup={selectedGroup}
            selectedTeacher={selectedTeacher}
            onLessonClick={handleLessonClick}
            triggerHaptic={triggerHaptic}
          />
          <DesktopScheduleView
            daysWithDates={daysWithDates}
            filteredData={filteredData}
            weekStart={getCurrentWeekDates().start}
            weekEnd={getCurrentWeekDates().end}
            showGroup={selectedGroup === "all"}
            showTeacher={selectedTeacher === "all"}
            onLessonClick={handleLessonClick}
          />
        </>
      )}

      {view === "month" && (
        <MonthScheduleView
          date={date}
          setDate={setDate}
          filteredData={monthData}
          selectedGroup={selectedGroup}
          selectedTeacher={selectedTeacher}
          onLessonClick={handleLessonClick}
          triggerHaptic={triggerHaptic}
        />
      )}
    </div>
  );
}
