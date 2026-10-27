"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "@/components/icons";

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Item {
    value: string;
    label: string;
}

interface ResponsiveComboBoxProps {
    items: Item[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    renderItem?: (item: Item, isSelected: boolean) => React.ReactNode;
    id?: string;
    className?: string;
    /** Иконка перед значением — заменяет подпись над полем в компактной шапке. */
    leadingIcon?: React.ReactNode;
}

export function ResponsiveComboBox({
    items,
    value,
    onValueChange,
    placeholder = "Выберите...",
    searchPlaceholder = "Поиск...",
    emptyText = "Ничего не найдено",
    renderItem,
    id,
    className,
    leadingIcon,
}: ResponsiveComboBoxProps) {
    const [open, setOpen] = React.useState(false);
    const [isDesktop, setIsDesktop] = React.useState(true);

    React.useEffect(() => {
        // Простая проверка ширины экрана (sm breakpoint = 640px)
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 640);
        checkDesktop();
        window.addEventListener("resize", checkDesktop);
        return () => window.removeEventListener("resize", checkDesktop);
    }, []);

    const selectedItem = items.find((item) => item.value === value);

    const Content = (
        <Command>
            {/* На мобильном input внутри Command может глючить с фокусом в Drawer, 
            но в shadcn Drawer обычно это обработано. 
            Если нет - можно вынести input наружу. Пока оставим стандартно. */}
            {/* autoFocus: фокус сразу уходит из триггера в Drawer — иначе он
                остаётся внутри aria-hidden подложки (warning React 19) и на
                iOS не открывается клавиатура для поиска. */}
            <CommandInput
                placeholder={searchPlaceholder}
                autoFocus
                className={cn(!isDesktop && "text-base")}
            />
            <CommandList>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                    {items.map((item) => (
                        <CommandItem
                            key={item.value}
                            value={item.value}
                            onSelect={(currentValue) => {
                                onValueChange(currentValue === value ? "" : currentValue);
                                setOpen(false);
                            }}
                            className={cn(isDesktop ? "" : "py-3 text-base")}
                        >
                                    {renderItem ? (
                                        renderItem(item, value === item.value)
                                    ) : (
                                        <>
                                            <CheckIcon
                                                className={cn(
                                                    "mr-2 h-4 w-4 shrink-0",
                                                    value === item.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="min-w-0 flex-1 truncate">
                                                {item.label}
                                            </span>
                                        </>
                                    )}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );

    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen} modal={false}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between font-normal px-2.5", className)}
                    >
                        <span className="flex min-w-0 items-center gap-1.5">
                            {leadingIcon && (
                                <span className="shrink-0 text-muted-foreground">{leadingIcon}</span>
                            )}
                            <span className="truncate">
                                {selectedItem ? selectedItem.label : placeholder}
                            </span>
                        </span>
                        <ChevronDownIcon className="ml-1.5 h-4 w-4 shrink-0 opacity-60" />
                    </Button>
                </PopoverTrigger>
                {/* Ширина — ровно по триггеру; радиус повторяет триггер (12) */}
                <PopoverContent className="w-(--radix-popover-trigger-width) rounded-3xl p-0" align="start">
                    {Content}
                </PopoverContent>
            </Popover>
        );
    }

    // №127: vaul не пробрасывает modal в Radix Dialog — тот всегда вешает
    // aria-hidden на фон (hideOthers). React 19 предупреждает, если в момент
    // установки атрибута фокус внутри скрытого поддерева: на iOS Safari
    // программный фокус в инпут шторки может не сработать, и фокус остаётся
    // на триггере. Лечим синхронным blur триггера прямо в жесте клика —
    // до commit'а aria-hidden.
    const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur();
    };
    return (
        <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
            <DrawerTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    onClick={handleTriggerClick}
                    className={cn("w-full justify-between font-normal px-2.5", className)}
                >
                    <span className="flex min-w-0 items-center gap-1.5">
                        {leadingIcon && (
                            <span className="shrink-0 text-muted-foreground">{leadingIcon}</span>
                        )}
                        <span className="truncate">
                            {selectedItem ? selectedItem.label : placeholder}
                        </span>
                    </span>
                    <ChevronDownIcon className="ml-1.5 h-4 w-4 shrink-0 opacity-60" />
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left pb-0">
                    <DrawerTitle>{placeholder}</DrawerTitle>
                    <DrawerDescription>
                        Прокрутите список или воспользуйтесь поиском
                    </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 pt-2 pb-8">
                    {Content}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
