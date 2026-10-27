"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface NotificationsPanelProps {
    isSubscribed: boolean;
    isLoading: boolean;
    permission: NotificationPermission;
    selectedGroup: string;
    selectedTeacher: string;
    groups: string[];
    teachers: string[];
    onGroupChange: (value: string) => void;
    onTeacherChange: (value: string) => void;
    onToggle: (checked: boolean) => void;
}

/** Сентинел пустого выбора: Radix Select запрещает пустой value у Item. */
const NONE = "none";

/**
 * Содержимое панели уведомлений. Общее для мобильного bottom-drawer и
 * десктопного бокового sheet.
 *
 * Выбор — Radix Select, а не ResponsiveComboBox: панель живёт в модальном
 * Sheet, и вложенный портал комбобокса (popover/drawer) оказывается вне
 * scroll-шарда шторки — клики в нём блокируются (№131). Select с modal
 * создаёт собственный верхний слой блокировки и кликается корректно.
 */
export function NotificationsPanel({
    isSubscribed,
    isLoading,
    permission,
    selectedGroup,
    selectedTeacher,
    groups,
    teachers,
    onGroupChange,
    onTeacherChange,
    onToggle,
}: NotificationsPanelProps) {
    const isAppleDevice =
        typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

    return (
        <div className="px-4 py-2 space-y-6">
            {/* Переключатель уведомлений */}
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <Label htmlFor="notifications-switch" className="text-base font-medium">
                        Push-уведомления
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        {isSubscribed
                            ? "Уведомления включены"
                            : permission === "denied"
                                ? "Заблокированы в  браузере"
                                : "Выберите группу/преподавателя"}
                    </p>
                </div>
                <Switch
                    id="notifications-switch"
                    checked={isSubscribed}
                    onCheckedChange={onToggle}
                    disabled={
                        isLoading ||
                        permission === "denied" ||
                        (!isSubscribed && !selectedGroup && !selectedTeacher)
                    }
                />
            </div>

            {/* iOS Notice */}
            {isAppleDevice && !isSubscribed && (
                <div className="p-3 rounded-3xl bg-info/10 border border-info/20 text-sm">
                    <p className="font-medium text-info">
                        Для iOS: добавьте приложение на главный экран
                    </p>
                    <p className="text-muted-foreground mt-1">
                        Safari → Поделиться → На экран «Домой»
                    </p>
                </div>
            )}

            {/* Выбор фильтра — одна группа ИЛИ один преподаватель */}
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Выберите <strong>группу</strong> или <strong>преподавателя</strong> для
                    отслеживания:
                </p>

                {/* Выбор группы */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Группа</Label>
                    <Select
                        modal
                        value={selectedGroup || NONE}
                        onValueChange={(value: string) => onGroupChange(value === NONE ? "" : value)}
                    >
                        <SelectTrigger id="notifications-group" className="w-full">
                            <SelectValue placeholder="Выберите группу…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                            <SelectItem value={NONE}>Выберите группу…</SelectItem>
                            {groups.map((group: string) => (
                                <SelectItem key={group} value={group}>
                                    {group}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Разделитель ИЛИ */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground uppercase">или</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Выбор преподавателя */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Преподаватель</Label>
                    <Select
                        modal
                        value={selectedTeacher || NONE}
                        onValueChange={(value: string) => onTeacherChange(value === NONE ? "" : value)}
                    >
                        <SelectTrigger id="notifications-teacher" className="w-full">
                            <SelectValue placeholder="Выберите преподавателя…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                            <SelectItem value={NONE}>Выберите преподавателя…</SelectItem>
                            {teachers.map((teacher: string) => (
                                <SelectItem key={teacher} value={teacher}>
                                    {teacher}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Подсказка */}
                {!selectedGroup && !selectedTeacher && !isSubscribed && (
                    <p className="text-xs text-info">
                        Выберите группу или преподавателя для включения уведомлений
                    </p>
                )}
            </div>
        </div>
    );
}
