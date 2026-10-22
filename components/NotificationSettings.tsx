"use client";

import { useState, useEffect } from "react";
import { BellIcon, BellOffIcon, CheckIcon, LoadingIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { NotificationsPanel } from "@/components/notifications-panel";
import { useIsMobile } from "@/hooks/use-mobile";
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
    const isMobile = useIsMobile();

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

    const panel = (
        <NotificationsPanel
            isSubscribed={isSubscribed}
            isLoading={isLoading}
            permission={permission}
            selectedGroup={selectedGroup}
            selectedTeacher={selectedTeacher}
            groups={groups}
            teachers={teachers}
            onGroupChange={(value) => {
                setSelectedGroup(value);
                if (value) {
                    setSelectedTeacher(""); // сбрасываем преподавателя
                                    }
                            }}
            onTeacherChange={(value) => {
                setSelectedTeacher(value);
                if (value) {
                    setSelectedGroup(""); // сбрасываем группу
                                }
                                }}
            onToggle={(checked) => {
                                if (checked) {
                                    if (selectedGroup || selectedTeacher) {
                                        handleSubscribe();
                                    }
                                } else {
                                    handleUnsubscribe();
                                    }
                                }}
                        />
    );

    const saveButton = isSubscribed && (
                <Button
                            onClick={handleUpdateFilters}
                            disabled={isLoading || (!selectedGroup && !selectedTeacher)}
                            className="w-full"
                >
                            {isLoading ? (
                <LoadingIcon className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                <CheckIcon className="h-4 w-4 mr-2" />
                    )}
                            Сохранить изменения
                </Button>
    );

    return (
        <>
                        <Button
                onClick={() => setIsOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                    variant="outline"
                    size="icon"
                    className="relative rounded-xl"
                    title="Настройки уведомлений"
                            >
                    {isSubscribed ? (
                    <BellIcon className="h-5 w-5" />
                            ) : (
                    <BellOffIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                    {isSubscribed && (
                        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-xl bg-green-500" />
                    )}
                        </Button>

            {/* Мобильные: выезжает снизу свайпом. Десктоп: боковая панель. */}
            {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Уведомления об изменениях</DrawerTitle>
                    <DrawerDescription>
                        Получайте push-уведомления когда расписание изменяется
                    </DrawerDescription>
                </DrawerHeader>

                        {panel}

                <DrawerFooter>
                            {saveButton}
                    <DrawerClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
            ) : (
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetContent
                        side="right"
                        className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-md"
                            >
                        <SheetHeader className="p-6 pb-2 text-left">
                            <SheetTitle>Уведомления об изменениях</SheetTitle>
                            <SheetDescription>
                                Получайте push-уведомления когда расписание изменяется
                            </SheetDescription>
                        </SheetHeader>

                        {panel}

                        <SheetFooter className="mt-auto flex flex-col gap-2 p-6 pt-2 sm:flex-col">
                            {saveButton}
                            <SheetClose asChild>
                                <Button variant="outline">Закрыть</Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
                        )}
        </>
    );
}
