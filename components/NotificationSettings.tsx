"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/sonner";
import { STORAGE_KEYS } from "@/lib/constants";

interface NotificationSettingsProps {
    groups: string[];
    teachers: string[];
}

// Ключ для публичного VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// Конвертация base64 URL-safe в Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function NotificationSettings({ groups, teachers }: NotificationSettingsProps) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);

    // Проверяем поддержку и текущее состояние подписки
    useEffect(() => {
        const checkSupport = async () => {
            const supported =
                'serviceWorker' in navigator &&
                'PushManager' in window &&
                'Notification' in window;

            setIsSupported(supported);

            if (supported) {
                setPermission(Notification.permission);

                // Проверяем существующую подписку
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);

                // Загружаем сохранённые фильтры
                const savedGroup = localStorage.getItem(STORAGE_KEYS.SELECTED_GROUP);
                const savedTeacher = localStorage.getItem(STORAGE_KEYS.SELECTED_TEACHER);

                if (savedGroup && savedGroup !== 'all') {
                    setSelectedGroup(savedGroup);
                } else if (savedTeacher && savedTeacher !== 'all') {
                    setSelectedTeacher(savedTeacher);
                }
            }
        };

        checkSupport();
    }, []);

    // Подписка на уведомления
    const handleSubscribe = async () => {
        if (!isSupported) return;

        setIsLoading(true);

        try {
            // Запрашиваем разрешение
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                showToast({
                    title: 'Уведомления отклонены',
                    message: 'Разрешите уведомления в настройках браузера',
                    variant: 'error',
                });
                return;
            }

            // Получаем service worker
            const registration = await navigator.serviceWorker.ready;

            // Подписываемся на push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
            });

            // Отправляем подписку на сервер
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    filters: {
                        groups: selectedGroup ? [selectedGroup] : [],
                        teachers: selectedTeacher ? [selectedTeacher] : [],
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription');
            }

            setIsSubscribed(true);
            showToast({
                title: 'Уведомления включены',
                message: 'Вы будете получать уведомления об изменениях расписания',
                variant: 'success',
            });

        } catch (error) {
            console.error('Subscribe error:', error);
            showToast({
                title: 'Ошибка',
                message: 'Не удалось включить уведомления',
                variant: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Отписка от уведомлений
    const handleUnsubscribe = async () => {
        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Отписываемся локально
                await subscription.unsubscribe();

                // Удаляем с сервера
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });
            }

            setIsSubscribed(false);
            showToast({
                title: 'Уведомления отключены',
                message: 'Вы больше не будете получать уведомления',
                variant: 'info',
            });

        } catch (error) {
            console.error('Unsubscribe error:', error);
            showToast({
                title: 'Ошибка',
                message: 'Не удалось отключить уведомления',
                variant: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Обновление фильтров
    const handleUpdateFilters = async () => {
        if (!isSubscribed) return;

        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subscription: subscription.toJSON(),
                        filters: {
                            groups: selectedGroup ? [selectedGroup] : [],
                            teachers: selectedTeacher ? [selectedTeacher] : [],
                        },
                    }),
                });

                showToast({
                    title: 'Настройки сохранены',
                    message: 'Фильтры уведомлений обновлены',
                    variant: 'success',
                });
            }
        } catch (error) {
            console.error('Update filters error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupported) {
        return null; // Скрываем кнопку если уведомления не поддерживаются
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative rounded-xl"
                    title="Настройки уведомлений"
                >
                    {isSubscribed ? (
                        <Bell className="h-5 w-5" />
                    ) : (
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    {isSubscribed && (
                        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-xl bg-green-500" />
                    )}
                </Button>
            </DrawerTrigger>

            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Уведомления об изменениях</DrawerTitle>
                    <DrawerDescription>
                        Получайте push-уведомления когда расписание изменяется
                    </DrawerDescription>
                </DrawerHeader>

                <div className="px-4 py-2 space-y-6">
                    {/* Переключатель уведомлений */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="notifications-switch" className="text-base font-medium">
                                Push-уведомления
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {isSubscribed
                                    ? 'Уведомления включены'
                                    : permission === 'denied'
                                        ? 'Заблокированы в браузере'
                                        : 'Выберите группу/преподавателя'}
                            </p>
                        </div>
                        <Switch
                            id="notifications-switch"
                            checked={isSubscribed}
                            onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                    if (selectedGroup || selectedTeacher) {
                                        handleSubscribe();
                                    }
                                } else {
                                    handleUnsubscribe();
                                }
                            }}
                            disabled={isLoading || permission === 'denied' || (!isSubscribed && !selectedGroup && !selectedTeacher)}
                        />
                    </div>

                    {/* iOS Notice */}
                    {/iPhone|iPad|iPod/.test(navigator.userAgent) && !isSubscribed && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                            <p className="font-medium text-amber-600 dark:text-amber-400">
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
                            Выберите <strong>группу</strong> или <strong>преподавателя</strong> для отслеживания:
                        </p>

                        {/* Выбор группы */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Группа</Label>
                            <select
                                className="w-full p-2 border rounded-md text-sm bg-background"
                                value={selectedGroup}
                                onChange={(e) => {
                                    setSelectedGroup(e.target.value);
                                    if (e.target.value) {
                                        setSelectedTeacher(''); // сбрасываем преподавателя
                                    }
                                }}
                            >
                                <option value="">Выберите группу...</option>
                                {groups.map((group: string) => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </select>
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
                            <select
                                className="w-full p-2 border rounded-md text-sm bg-background"
                                value={selectedTeacher}
                                onChange={(e) => {
                                    setSelectedTeacher(e.target.value);
                                    if (e.target.value) {
                                        setSelectedGroup(''); // сбрасываем группу
                                    }
                                }}
                            >
                                <option value="">Выберите преподавателя...</option>
                                {teachers.map((teacher: string) => (
                                    <option key={teacher} value={teacher}>{teacher}</option>
                                ))}
                            </select>
                        </div>

                        {/* Подсказка */}
                        {!selectedGroup && !selectedTeacher && !isSubscribed && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Выберите группу или преподавателя для включения уведомлений
                            </p>
                        )}
                    </div>
                </div>

                <DrawerFooter>
                    {/* Кнопка сохранения — если уже подписан и нужно изменить фильтр */}
                    {isSubscribed && (
                        <Button
                            onClick={handleUpdateFilters}
                            disabled={isLoading || (!selectedGroup && !selectedTeacher)}
                            className="w-full"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Check className="h-4 w-4 mr-2" />
                            )}
                            Сохранить изменения
                        </Button>
                    )}
                    <DrawerClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
