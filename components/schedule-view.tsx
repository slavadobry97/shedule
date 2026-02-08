"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/sonner";
import {
  format,
  startOfWeek,
  addDays,
  parse,
  isWithinInterval,
} from "date-fns";
import {
  DAYS_OF_WEEK,
  DATE_FORMATS,
  STORAGE_KEYS,
  BREAKPOINTS,
} from "@/lib/constants";
import { ScheduleItem } from "@/types/schedule";
import { ScheduleFilters } from "./schedule-filters";
import { DesktopScheduleView } from "./desktop-schedule-view";
import { MobileScheduleView } from "./mobile-schedule-view";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WelcomeScreen } from "./WelcomeScreen";

type ScheduleViewProps = {
  scheduleData: ScheduleItem[];
  initialGroup?: string;
  initialTeacher?: string;
};

export function ScheduleView({ scheduleData, initialGroup, initialTeacher }: ScheduleViewProps) {
  const router = useRouter();

  const getInitialState = (key: string, propValue?: string) => {
    if (propValue && propValue !== "all") return propValue;
    if (typeof window !== "undefined") {
      return localStorage.getItem(key) || "all";
    }
    return "all";
  };

  const [date, setDate] = useState<Date>(new Date());
  const [selectedGroup, setSelectedGroup] = useState<string>(() => getInitialState(STORAGE_KEYS.SELECTED_GROUP, initialGroup));
  const [selectedTeacher, setSelectedTeacher] = useState<string>(() => getInitialState(STORAGE_KEYS.SELECTED_TEACHER, initialTeacher));
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
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30;
      navigator.vibrate(duration);
    }
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
      setSelectedTeacher("all");
      showToast({
        title: `Группа "${selectedGroup}" сохранена!`,
        message: "Теперь это ваша группа по умолчанию",
        variant: 'success',
      });
    }
  };

  const handleSaveTeacher = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SELECTED_TEACHER, selectedTeacher);
      localStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, "all");
      setSelectedGroup("all");
      showToast({
        title: `Преподаватель "${selectedTeacher}" сохранён!`,
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

  const uniqueGroups = useMemo(() => Array.from(
    new Set(scheduleData.map((item) => item.group))
  ).sort((a, b) => a.localeCompare(b, "ru", { numeric: true })), [scheduleData]);

  const uniqueTeachers = useMemo(() => Array.from(
    new Set(scheduleData.map((item) => item.teacher))
  ).sort((a, b) => a.localeCompare(b, "ru", { numeric: true })), [scheduleData]);

  useEffect(() => {
    if (initialGroup && initialGroup !== "all") setSelectedGroup(initialGroup);
    if (initialTeacher && initialTeacher !== "all") setSelectedTeacher(initialTeacher);
  }, [initialGroup, initialTeacher]);

  // Show Welcome Screen if no selection made
  if (selectedGroup === "all" && selectedTeacher === "all") {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <WelcomeScreen
          groups={uniqueGroups}
          teachers={uniqueTeachers}
          onGroupSelect={(g) => {
            setSelectedGroup(g);
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, g);
              localStorage.setItem(STORAGE_KEYS.SELECTED_TEACHER, "all");
            }
          }}
          onTeacherSelect={(t) => {
            setSelectedTeacher(t);
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
    <div className="container mx-auto p-2 sm:p-4 space-y-3 sm:space-y-6 overflow-x-auto">
      <ScheduleFilters
        groups={uniqueGroups}
        teachers={uniqueTeachers}
        selectedGroup={selectedGroup}
        selectedTeacher={selectedTeacher}
        onGroupChange={setSelectedGroup}
        onTeacherChange={setSelectedTeacher}
        onSaveGroup={handleSaveGroup}
        onSaveTeacher={handleSaveTeacher}
      />

      <div className="hidden sm:flex flex-col md:flex-row items-center justify-between mb-6 gap-4 px-2">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
          <Button
            variant="outline"
            onClick={() => {
              triggerHaptic('medium');
              setDate(prev => addDays(prev, -7));
            }}
            className="h-9 px-3 rounded-full flex items-center gap-1 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Пред. неделя</span>
            <span className="inline sm:hidden text-xs font-medium">Пред.</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              triggerHaptic('medium');
              setDate(new Date());
            }}
            className="h-9 px-4 rounded-full font-medium text-xs sm:text-sm shrink-0"
          >
            Сегодня
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              triggerHaptic('medium');
              setDate(prev => addDays(prev, 7));
            }}
            className="h-9 px-3 rounded-full flex items-center gap-1 shrink-0"
          >
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">След. неделя</span>
            <span className="inline sm:hidden text-xs font-medium">След.</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-lg md:text-xl font-bold tabular-nums tracking-tight">
          {format(getCurrentWeekDates().start, "dd.MM.yyyy")} -{" "}
          {format(getCurrentWeekDates().end, "dd.MM.yyyy")}
        </h2>
      </div>

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
        onLessonClick={handleLessonClick}
      />
    </div>
  );
}
