"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ResponsiveComboBox } from "./responsive-combobox";
import {
    CalendarSync,
    Copy,
    Plus,
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";
import { showToast } from "@/components/ui/sonner";

interface ScheduleFiltersProps {
    groups: string[];
    teachers: string[];
    selectedGroup: string;
    selectedTeacher: string;
    onGroupChange: (val: string) => void;
    onTeacherChange: (val: string) => void;
    onSaveGroup: () => void;
    onSaveTeacher: () => void;
}

export function ScheduleFilters({
    groups,
    teachers,
    selectedGroup,
    selectedTeacher,
    onGroupChange,
    onTeacherChange,
    onSaveGroup,
    onSaveTeacher
}: ScheduleFiltersProps) {

    const copyToClipboard = (text: string) => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(text);
            showToast({ title: "Готово!", message: "Ссылка скопирована в буфер обмена", variant: "success" });
        }
    };

    const getCalendarUrl = (encodedValue: string, isTeacher: boolean = false) => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}${API_ENDPOINTS.CALENDAR}${encodedValue}${isTeacher ? '?type=teacher' : ''}`;
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 items-start">
            <div className="w-full sm:w-56 flex flex-col gap-2">
                <label htmlFor="group-select" className="text-sm font-medium hidden sm:block">Группа</label>
                <ResponsiveComboBox
                    id="group-select"
                    items={[
                        { value: "all", label: "Все группы" },
                        ...groups.sort((a, b) => a.localeCompare(b)).map(g => ({ value: g, label: g }))
                    ]}
                    value={selectedGroup}
                    onValueChange={(val: string) => onGroupChange(val === "" ? "all" : val)}
                    placeholder="Выберите группу"
                    searchPlaceholder="Поиск группы..."
                    emptyText="Группа не найдена"
                />
                {selectedGroup !== "all" && selectedTeacher === "all" && (
                    <Button onClick={onSaveGroup} className="w-full">Моя группа</Button>
                )}
                {selectedGroup !== "all" && selectedTeacher === "all" && (
                    <Popover modal={false}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <CalendarSync className="h-4 w-4" />
                                Подписаться на календарь
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80" align="start">
                            <div className="space-y-3">
                                <p className="text-sm font-medium">Ссылка для подписки:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                                        {getCalendarUrl(encodeURIComponent(selectedGroup))}
                                    </code>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => copyToClipboard(getCalendarUrl(encodeURIComponent(selectedGroup)))}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div className="font-medium">iPhone (iOS):</div>
                                    <div>Настройки → Календарь → Учётные записи → Добавить → Другое → Подписка</div>
                                    <div className="font-medium mt-2">Google Calendar:</div>
                                    <div className="flex items-center gap-1 flex-wrap">Другие календари → <Badge variant="outline" className="h-4 w-4 p-0 inline-flex items-center justify-center rounded-full"><Plus className="h-2.5 w-2.5 text-muted-foreground" strokeWidth={3} /></Badge> → По URL</div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            <div className="w-full sm:w-80 flex flex-col gap-2">
                <label htmlFor="teacher-select" className="text-sm font-medium hidden sm:block">Преподаватель</label>
                <ResponsiveComboBox
                    id="teacher-select"
                    items={[
                        { value: "all", label: "Все преподаватели" },
                        ...teachers.sort((a, b) => a.localeCompare(b)).map(t => ({ value: t, label: t }))
                    ]}
                    value={selectedTeacher}
                    onValueChange={(val: string) => onTeacherChange(val === "" ? "all" : val)}
                    placeholder="Выберите преподавателя"
                    searchPlaceholder="Поиск преподавателя..."
                    emptyText="Преподаватель не найден"
                />
                {selectedTeacher !== "all" && selectedGroup === "all" && (
                    <>
                        <Button onClick={onSaveTeacher} className="w-full">Это я</Button>
                        <Popover modal={false}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <CalendarSync className="h-4 w-4" />
                                    Подписаться на календарь
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80" align="start">
                                <div className="space-y-3">
                                    <p className="text-sm font-medium">Ссылка для подписки (преподаватель):</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                                            {getCalendarUrl(encodeURIComponent(selectedTeacher), true)}
                                        </code>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => copyToClipboard(getCalendarUrl(encodeURIComponent(selectedTeacher), true))}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="font-medium">iPhone (iOS):</div>
                                        <div>Настройки → Календарь → Учётные записи → Добавить → Другое → Подписка</div>
                                        <div className="font-medium mt-2">Google Calendar:</div>
                                        <div className="flex items-center gap-1 flex-wrap">Другие календари → <Badge variant="outline" className="h-4 w-4 p-0 inline-flex items-center justify-center rounded-full"><Plus className="h-2.5 w-2.5 text-muted-foreground" strokeWidth={3} /></Badge> → По URL</div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </>
                )}
            </div>
        </div>
    );
}
