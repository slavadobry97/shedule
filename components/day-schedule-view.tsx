"use client";

import { useMemo } from "react";
import { ScheduleItem } from "@/types/schedule";
import { format } from "date-fns";
import { DayAgenda } from "./day-agenda";
import { useHorizontalSwipe } from "@/lib/use-swipe-navigation";

interface DayScheduleViewProps {
    date: Date;
    filteredData: ScheduleItem[];
    selectedGroup: string;
    onLessonClick: (lesson: ScheduleItem) => void;
    /** Свайп вправо — предыдущий день (навигация как у стрелок шапки) */
    onPrevDate: () => void;
    /** Свайп влево — следующий день */
    onNextDate: () => void;
}

/**
 * Вкладка «День»: отбор занятий выбранной даты + общий список дня
 * DayAgenda (№117) с подсветкой «Сейчас» и приглушением прошедшего.
 * Горизонтальный свайп листает дни (№120).
 */
export function DayScheduleView({
    date,
    filteredData,
    selectedGroup,
    onLessonClick,
    onPrevDate,
    onNextDate,
}: DayScheduleViewProps) {
    const dayLessons = useMemo(() => {
        const key = format(date, "dd.MM.yyyy");
        return filteredData.filter((item) => item.date === key);
    }, [filteredData, date]);

    // Свайп влево = следующий день, вправо = предыдущий
    const swipe = useHorizontalSwipe(onNextDate, onPrevDate);

    return (
        <div {...swipe}>
            <DayAgenda
                date={date}
                lessons={dayLessons}
                selectedGroup={selectedGroup}
                onLessonClick={onLessonClick}
            />
        </div>
    );
}
