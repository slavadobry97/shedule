"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Kbd } from "@/components/ui/kbd";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { CheckIcon, SearchIcon } from "@/components/icons";

export function ComponentShowcase() {
    const [switchOn, setSwitchOn] = useState(true);
    const [sliderValue, setSliderValue] = useState([40]);

    return (
        <div className="space-y-10">
            {/* Кнопки */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Block title="Кнопки" hint="Варианты, размеры, состояния">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button>Основная</Button>
                        <Button variant="secondary">Вторичная</Button>
                        <Button variant="outline">Контурная</Button>
                        <Button variant="ghost">Призрачная</Button>
                        <Button variant="link">Ссылка</Button>
                        <Button variant="destructive">Опасная</Button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button size="sm">Маленькая</Button>
                        <Button size="default">Обычная</Button>
                        <Button size="lg">Большая</Button>
                        <Button size="icon" variant="outline" aria-label="Настройки">
                            <SearchIcon className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Готово">
                            <CheckIcon className="h-4 w-4" />
                        </Button>
                        <Button disabled>Недоступна</Button>
                        <Button variant="outline" aria-label="Загрузка">
                            <Spinner className="size-4" />
                        </Button>
                    </div>
                </Block>

                {/* Бейджи, kbd, аватар */}
                <Block title="Метки и служебные элементы">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge>По умолчанию</Badge>
                        <Badge variant="secondary">Вторичный</Badge>
                        <Badge variant="outline">Контурный</Badge>
                        <Badge variant="destructive">Ошибка</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Kbd>Ctrl</Kbd>
                        <Kbd>⌘</Kbd>
                        <Kbd>K</Kbd>
                        <Avatar>
                            <AvatarFallback className="font-mono text-xs">РГ</AvatarFallback>
                        </Avatar>
                    </div>
                    <Separator className="my-4" />
                    <p className="text-xs text-muted-foreground">
                        Разделитель — hairline, цвет токена границы.
                    </p>
                </Block>
            </div>

            {/* Формы */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Block title="Поля ввода">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="showcase-input">Группа</Label>
                            <Input id="showcase-input" placeholder="ЮСТ-Б-2-Д-2025-1" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="showcase-textarea">Комментарий</Label>
                            <Textarea id="showcase-textarea" placeholder="Заметка…" rows={3} />
                        </div>
                        <div className="space-y-2">
                            <Label>Переключатель</Label>
                            <div className="flex items-center gap-3">
                                <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
                                <span className="text-sm text-muted-foreground">
                                    {switchOn ? "Включено" : "Выключено"}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-baseline justify-between">
                                <Label>Ползунок</Label>
                                <span className="font-mono text-tiny tabular-nums text-muted-foreground">
                                    {sliderValue[0]}%
                                </span>
                            </div>
                            <Slider value={sliderValue} onValueChange={setSliderValue} />
                        </div>
                    </div>
                </Block>

                <Block title="Списки и команды">
                    <Command className="rounded-lg border border-border/70">
                        <CommandInput placeholder="Найти группу…" />
                        <CommandList>
                            <CommandEmpty>Ничего не найдено.</CommandEmpty>
                            <CommandGroup heading="Группы">
                                <CommandItem>ЮСТ-Б-2-Д-2025-1</CommandItem>
                                <CommandItem>ЮСТ-Б-3-Д-2025-1</CommandItem>
                            </CommandGroup>
                            <CommandGroup heading="Преподаватели">
                                <CommandItem>Иванова А. П.</CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>

                    <ScrollArea className="mt-4 h-32 rounded-md border border-border/70">
                        <div className="p-3 text-sm text-muted-foreground">
                            Прокручиваемая область — нативный скролл, без кастомных
                            полос. Lorem ipsum dolor sit amet, consectetur
                            adipiscing elit, sed do eiusmod tempor.
                        </div>
                    </ScrollArea>
                </Block>
            </div>

            {/* Оповещения и карточки */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Block title="Оповещения">
                    <div className="space-y-3">
                        <Alert>
                            <AlertTitle>Расписание обновлено</AlertTitle>
                            <AlertDescription>
                                Пара перенесена на четверг, аудитория 214.
                            </AlertDescription>
                        </Alert>
                        <Alert variant="destructive">
                            <AlertTitle>Ошибка загрузки</AlertTitle>
                            <AlertDescription>
                                Сервер недоступен. Повторите попытку чуть позже.
                            </AlertDescription>
                        </Alert>
                    </div>
                </Block>

                <Block title="Карточка">
                    <Card>
                        <CardHeader>
                            <CardTitle>Пятница, 25 октября</CardTitle>
                            <CardDescription>6 пар · 3 аудитории</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Карточка использует те же токены, что и страницы
                            приложения: border, card, muted-foreground.
                        </CardContent>
                        <CardFooter className="gap-2">
                            <Button size="sm">Открыть</Button>
                            <Button size="sm" variant="ghost">
                                Подробнее
                            </Button>
                        </CardFooter>
                    </Card>
                </Block>
            </div>

            {/* Табы, аккордеон, оверлеи */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Block title="Вкладки и аккордеон">
                    <Tabs defaultValue="calendar">
                        <TabsList>
                            <TabsTrigger value="calendar">Календарь</TabsTrigger>
                            <TabsTrigger value="table">Таблица</TabsTrigger>
                        </TabsList>
                        <TabsContent value="calendar" className="text-sm text-muted-foreground">
                            Содержимое вкладки «Календарь».
                        </TabsContent>
                        <TabsContent value="table" className="text-sm text-muted-foreground">
                            Содержимое вкладки «Таблица».
                        </TabsContent>
                    </Tabs>

                    <Accordion type="single" collapsible className="mt-4">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Что внутри?</AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                                Аккордеон с hairline-разделителями и анимацией
                                высоты 0.2 с.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>И ещё?</AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                                Второй пункт.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Block>

                <Block title="Наложения и подсказки">
                    <div className="flex flex-wrap items-center gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline">Диалог</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Подтверждение</DialogTitle>
                                    <DialogDescription>
                                        Описание под заголовком.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="ghost">Отмена</Button>
                                    <Button>Ок</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline">Шторка</Button>
                            </SheetTrigger>
                            <SheetContent side="right">
                                <SheetHeader>
                                    <SheetTitle>Боковая панель</SheetTitle>
                                    <SheetDescription>
                                        На десктопе выезжает сбоку, на мобильном —
                                        снизу.
                                    </SheetDescription>
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost">Подсказка</Button>
                                </TooltipTrigger>
                                <TooltipContent>Пояснение под кнопкой</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </Block>
            </div>

            {/* Таблица */}
            <Block title="Таблица">
                <div className="rounded-lg border border-border/70">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Время</TableHead>
                                <TableHead>Дисциплина</TableHead>
                                <TableHead>Аудитория</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-mono tabular-nums">08.30</TableCell>
                                <TableCell className="font-medium">Физика</TableCell>
                                <TableCell className="font-mono tabular-nums">214</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono tabular-nums">10.10</TableCell>
                                <TableCell className="font-medium">Математика</TableCell>
                                <TableCell className="font-mono tabular-nums">301</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </Block>
        </div>
    );
}

function Block({
    title,
    hint,
    children,
}: {
    title: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-border/70 bg-card p-5">
            <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-sm font-semibold tracking-[-0.01em]">{title}</h3>
                {hint && (
                    <span className="text-right font-mono text-xxs uppercase tracking-[0.16em] text-muted-foreground">
                        {hint}
                    </span>
                )}
            </div>
            <div className="mt-4">{children}</div>
        </section>
    );
}
