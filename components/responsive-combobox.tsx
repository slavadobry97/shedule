"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
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
            <CommandInput
                placeholder={searchPlaceholder}
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
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.label}
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
                        className={cn("w-full justify-between font-normal", className)}
                    >
                        <span className="truncate">
                            {selectedItem ? selectedItem.label : placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    {Content}
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
            <DrawerTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                >
                    <span className="truncate">
                        {selectedItem ? selectedItem.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
