"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ScheduleItem } from "@/types/schedule";
import {
  DAYS_ORDER,
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  TABLE_COLUMNS
} from "@/lib/constants";
import { FileDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SearchX, Check, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ScheduleTableProps {
  scheduleData: ScheduleItem[];
  isLoading?: boolean;
}

type SortField = keyof ScheduleItem;
type SortDirection = "asc" | "desc" | null;

export default function ScheduleTable({ scheduleData, isLoading = false }: ScheduleTableProps) {
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [filterType, setFilterType] = useState("teacher");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Debounce filter input for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [filter]);

  // Получаем уникальные значения для выбранного типа фильтра
  const filterOptions = useMemo(() => {
    if (!scheduleData || filterType === "all") return [];

    const uniqueValues = new Set<string>();
    scheduleData.forEach((item) => {
      const value = item[filterType as keyof ScheduleItem];
      if (value) uniqueValues.add(String(value));
    });

    return Array.from(uniqueValues)
      .sort((a, b) => {
        if (filterType === "dayOfWeek") {
          const aLower = a.toLowerCase();
          const bLower = b.toLowerCase();
          return (DAYS_ORDER[aLower] || 99) - (DAYS_ORDER[bLower] || 99);
        }
        return a.localeCompare(b, "ru");
      })
      .map((value) => ({ value: value.toLowerCase(), label: value }));
  }, [scheduleData, filterType]);

  // Фильтрация данных с поддержкой поиска по всем полям
  const filteredData = useMemo(() => {
    if (!filter || !scheduleData) return scheduleData || [];

    const searchLower = debouncedFilter.toLowerCase();

    return scheduleData.filter((item) => {
      // Поиск по всем полям
      if (filterType === "all") {
        return TABLE_COLUMNS.some((col) => {
          const value = item[col.key];
          return value && String(value).toLowerCase().includes(searchLower);
        });
      }

      // Поиск по конкретному полю
      const value = item[filterType as keyof ScheduleItem];
      return value && String(value).toLowerCase().includes(searchLower);
    });
  }, [scheduleData, debouncedFilter, filterType]);

  // Сортировка данных
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField] ?? "";
      const bValue = b[sortField] ?? "";

      // Специальная сортировка для даты (dd.MM.yyyy)
      if (sortField === "date") {
        const parseDate = (dateStr: string) => {
          const [day, month, year] = dateStr.split(".");
          return new Date(+year, +month - 1, +day).getTime();
        };
        const aDate = parseDate(String(aValue));
        const bDate = parseDate(String(bValue));
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }

      // Специальная сортировка для времени
      if (sortField === "time") {
        const parseTime = (timeStr: string) => {
          const startTime = timeStr.split(" - ")[0];
          const [hour, minute] = startTime.split(".").map(Number);
          return hour * 60 + minute;
        };
        const aTime = parseTime(String(aValue));
        const bTime = parseTime(String(bValue));
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      // Специальная сортировка для дней недели
      if (sortField === "dayOfWeek") {
        const aOrder = DAYS_ORDER[String(aValue).toLowerCase()] || 99;
        const bOrder = DAYS_ORDER[String(bValue).toLowerCase()] || 99;
        return sortDirection === "asc" ? aOrder - bOrder : bOrder - aOrder;
      }

      // Строковая сортировка для остальных полей
      const comparison = String(aValue).localeCompare(String(bValue), "ru");
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  // Пагинация
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // Сброс страницы при изменении фильтров или сортировки
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, filterType, sortField, sortDirection, itemsPerPage]);

  // Мемоизированные обработчики
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Переключаем направление: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      // Новое поле — начинаем с asc
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50 shrink-0" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 ml-1 shrink-0" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1 shrink-0" />;
  }, [sortField, sortDirection]);

  const handleResetFilter = useCallback(() => {
    setFilter("");
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((value: string) => {
    setItemsPerPage(Number(value));
  }, []);

  const downloadPDF = useCallback(async () => {
    // Dynamic import to reduce initial bundle size
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    doc.addFont(
      "https://fonts.cdnfonts.com/s/12165/Roboto-Regular.ttf",
      "Roboto",
      "normal"
    );
    doc.addFont(
      "https://fonts.cdnfonts.com/s/12165/Roboto-Bold.ttf",
      "Roboto-Bold",
      "bold"
    );
    doc.setFont("Roboto-Bold", "bold");
    doc.setFont("Roboto", "normal");

    autoTable(doc, {
      margin: 8,
      head: [TABLE_COLUMNS.map((col) => col.label)],
      body: sortedData.map((item) =>
        TABLE_COLUMNS.map((col) => item[col.key] ?? "")
      ),
      rowPageBreak: "auto",
      styles: { font: "Roboto", fontSize: 8 },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 0,
        fontStyle: "normal",
        valign: "middle",
        halign: "center",
      },
      bodyStyles: {
        valign: "top",
        halign: "left",
      },
    });

    // Формирование динамического имени файла
    let fileName = "Расписание занятий";
    if (filter) {
      const activeOption = filterOptions.find(opt => opt.value === filter);
      const displayValue = activeOption ? activeOption.label : filter;

      if (filterType === "teacher") {
        // Форматируем ФИО: Фамилия Имя Отчество -> Фамилия И. И.
        const parts = displayValue.trim().split(/\s+/);
        if (parts.length >= 2) {
          const lastName = parts[0];
          const initials = parts.slice(1).map(p => `${p[0].toUpperCase()}.`).join(" ");
          fileName += ` ${lastName} ${initials}`;
        } else {
          fileName += ` ${displayValue}`;
        }
      } else if (filterType === "group") {
        fileName += ` группы ${displayValue}`;
      } else {
        fileName += ` ${displayValue}`;
      }
    }

    // Очистка от запрещенных символов
    fileName = fileName.replace(/[\\/:*?"<>|]/g, "").trim();
    doc.save(`${fileName}.pdf`);
  }, [sortedData, filter, filterType, filterOptions]);

  // Получить название фильтра для плейсхолдера
  const getFilterPlaceholder = useCallback(() => {
    const filterLabels: Record<string, string> = {
      teacher: "Преподавателю",
      dayOfWeek: "Дню недели",
      group: "Группе",
      subject: "Дисциплине",
      classroom: "Аудитории",
      all: "всем полям",
    };
    return filterLabels[filterType] || "Выбранному фильтру";
  }, [filterType]);

  return (
    <div className="p-2">
      {/* Фильтры и кнопки */}
      <div className="flex flex-wrap gap-4 mb-4">
        <Select
          value={filterType}
          onValueChange={(value: string) => {
            setFilterType(value);
            setFilter("");
          }}
          modal={false}
        >
          <SelectTrigger className="max-w-40 order-first">
            <SelectValue placeholder="Выберите тип фильтра" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все поля</SelectItem>
            <SelectItem value="teacher">Преподаватель</SelectItem>
            <SelectItem value="dayOfWeek">День недели</SelectItem>
            <SelectItem value="group">Группа</SelectItem>
            <SelectItem value="subject">Дисциплина</SelectItem>
            <SelectItem value="classroom">Аудитория</SelectItem>
          </SelectContent>
        </Select>
        {/* Комбобокс с автодополнением */}
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen} modal={false}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboboxOpen}
              className="w-full sm:w-64 order-last xs:order-2 justify-between text-sm font-normal"
            >
              <span className="truncate">
                {filter
                  ? filterOptions.find((opt) => opt.value === filter)?.label || filter
                  : `Поиск по ${getFilterPlaceholder()}...`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder="Начните ввод..." />
              <CommandEmpty>Ничего не найдено</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {filterOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      setFilter(currentValue === filter ? "" : currentValue);
                      setComboboxOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filter === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          onClick={downloadPDF}
          className="order-2 sm:order-last ml-auto"
          aria-label="Скачать расписание в формате PDF"
        >
          <FileDown />
          Скачать PDF
        </Button>
      </div>

      {/* Кнопка сброса фильтра */}
      {filter && (
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="sm" onClick={handleResetFilter}>
            Сбросить фильтр
          </Button>
        </div>
      )}

      {/* Таблица */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="text-center bg-slate-100 dark:bg-gray-900">
            <TableRow className="text-center">
              {TABLE_COLUMNS.map((col, idx) => (
                <TableHead
                  key={col.key}
                  className={`${idx < TABLE_COLUMNS.length - 1 ? "border-r" : ""} text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors select-none`}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center justify-center">
                    {col.label}
                    {getSortIcon(col.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {/* Скелетон загрузки */}
            {isLoading ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {TABLE_COLUMNS.map((col, colIdx) => (
                    <TableCell
                      key={col.key}
                      className={colIdx < TABLE_COLUMNS.length - 1 ? "border-r" : ""}
                    >
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-gray-900/50">
                  <TableCell className="border-r w-40">{item.group}</TableCell>
                  <TableCell className="border-r text-center">{item.dayOfWeek}</TableCell>
                  <TableCell className="border-r text-center">{item.date}</TableCell>
                  <TableCell className="border-r text-center w-28">{item.time}</TableCell>
                  <TableCell className="border-r">{item.subject}</TableCell>
                  <TableCell className="border-r">{item.lessonType}</TableCell>
                  <TableCell className="border-r">{item.teacher}</TableCell>
                  <TableCell className="text-center">{item.classroom}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMNS.length} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <SearchX className="h-12 w-12 opacity-50" />
                    <div className="text-center">
                      <p className="font-medium text-lg">Ничего не найдено</p>
                      <p className="text-sm">По вашему запросу &quot;{filter}&quot; не найдено записей</p>
                    </div>
                    <Button variant="outline" onClick={handleResetFilter}>
                      Сбросить фильтр
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between mt-4 gap-4">
        {/* Счётчик и выбор количества строк */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Показано {paginatedData.length} из {sortedData.length} записей
          </span>
          <div className="flex items-center gap-2">
            <span>Строк:</span>
            <Select value={String(itemsPerPage)} onValueChange={(value: string) => handlePageSizeChange(value)} modal={false}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Кнопки навигации */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 sm:gap-2">
            {/* В начало */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex"
              aria-label="Перейти на первую страницу"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            {/* Назад */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Предыдущая страница"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Назад</span>
            </Button>
            {/* Номера страниц */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                // На мобильных скрываем крайние страницы (показываем только 3)
                const isEdge = i === 0 || i === 4;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${isEdge && totalPages > 3 ? 'hidden sm:flex' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            {/* Вперёд */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Следующая страница"
            >
              <span className="hidden sm:inline">Вперёд</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* В конец */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden sm:flex"
              aria-label="Перейти на последнюю страницу"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

