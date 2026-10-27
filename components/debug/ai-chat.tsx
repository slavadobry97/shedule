"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "cn";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, motionTransition } from "@/lib/motion";
import { stripEmoji } from "@/lib/sanitize";
import { ScheduleAnalysis } from "@/types/debug";
import {
    AlertTriangleIcon,
    ArrowRightIcon,
    CheckIcon,
    ChevronDownIcon,
    CloseIcon,
    HistoryIcon,
    LayoutDashboardIcon,
    LoadingIcon,
    SendIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TableIcon,
    TrashIcon,
    type IconComponent,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type DebugTab = "checks" | "overview" | "records" | "journal" | "history";

interface Message {
    id: string;
    /**
     * error — не реплика ассистента, а состояние последнего запроса.
     * Такие сообщения не уходят в историю и не отправляются модели.
     */
    role: "user" | "ai" | "error";
    content: string;
    usage?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

interface ModelOption {
    provider: string;
    model: string;
    label: string;
    providerLabel: string;
}

interface ChatSelection {
    provider: string;
    model: string;
}

interface ChatResponse {
    content?: string;
    usage?: Message["usage"];
    dailyUsage?: { count: number; limit: number };
    error?: string;
    code?: string;
}

interface DebugAIChatProps {
    /** Разбор расписания: цифры, аналитика и результаты проверок */
    stats: ScheduleAnalysis | null;
    /** Активная вкладка /debug: от неё зависят подсказки и строка контекста */
    activeTab?: DebugTab;
    className?: string;
    /** Закрыть панель: кнопка в шапке, если чат живёт в Sheet */
    onClose?: () => void;
}

interface Suggestion {
    title: string;
    hint: string;
    question: string;
}

interface TabMeta {
    label: string;
    icon: IconComponent;
    suggestions: Suggestion[];
    note?: string;
}

const HISTORY_KEY = "debug_chat_history";
const SELECTION_KEY = "debug_chat_model";
const AUTO_KEY = "debug_chat_auto";
/** Сколько последних сообщений отправлять модели: окно контекста не бесконечное */
const HISTORY_LIMIT = 12;

/**
 * Подсказки для пустого лога. Они зависят от вкладки: человек не должен
 * придумывать вопрос, глядя на таблицу проверок.
 */
const TAB_META: Record<DebugTab, TabMeta> = {
    checks: {
        label: "Проверки",
        icon: ShieldCheckIcon,
        suggestions: [
            {
                title: "Объясни критичные проверки",
                hint: "Что сломано и что исправить первым",
                question: "Объясни критичные проверки и что исправить первым.",
            },
            {
                title: "Где окна у групп?",
                hint: "Разрывы между занятиями",
                question: "Где окна у групп? Покажи самые длинные.",
            },
            {
                title: "Покажи конфликты аудиторий",
                hint: "Кто занимает одно место",
                question: "Покажи конфликты аудиторий и кого можно переставить.",
            },
        ],
    },
    overview: {
        label: "Обзор",
        icon: LayoutDashboardIcon,
        suggestions: [
            {
                title: "Кто перегружен?",
                hint: "Топ преподавателей по нагрузке",
                question: "Кто перегружен? Покажи топ-5 преподавателей.",
            },
            {
                title: "Сколько окон и у кого?",
                hint: "Разрывы в расписании групп",
                question: "Сколько окон в расписании и у каких групп их больше всего?",
            },
            {
                title: "Сводка по аудиториям",
                hint: "Загрузка и конфликты",
                question: "Дай сводку по загрузке аудиторий и конфликтам.",
            },
        ],
    },
    records: {
        label: "Записи",
        icon: TableIcon,
        suggestions: [
            {
                title: "Почему записи невидимы?",
                hint: "Критические ошибки в данных",
                question: "Почему часть записей не попадает в календарь?",
            },
            {
                title: "Покажи дубликаты",
                hint: "Повторы в таблице деканата",
                question: "Покажи дубликаты и что с ними делать.",
            },
            {
                title: "Что не так с полями?",
                hint: "Пустые группа, дата, время",
                question: "Какие поля заполнены неверно и что исправить?",
            },
        ],
    },
    journal: {
        label: "Журнал",
        icon: TrashIcon,
        suggestions: [
            {
                title: "Что проверить первым?",
                hint: "Приоритеты по текущим данным",
                question: "Что проверить в первую очередь?",
            },
            {
                title: "Где окна у групп?",
                hint: "Разрывы в расписании",
                question: "Где окна у групп?",
            },
            {
                title: "Кто перегружен?",
                hint: "Нагрузка преподавателей",
                question: "Кто перегружен?",
            },
        ],
        note: "Журнал изменений ИИ не читает — отвечает по текущим данным расписания.",
    },
    history: {
        label: "История",
        icon: HistoryIcon,
        suggestions: [
            {
                title: "Сводка по расписанию",
                hint: "Общие цифры и проблемы",
                question: "Дай сводку по расписанию.",
            },
            {
                title: "Где окна у групп?",
                hint: "Разрывы в расписании",
                question: "Где окна у групп?",
            },
            {
                title: "Что исправить первым?",
                hint: "Критичные проверки",
                question: "Что исправить первым?",
            },
        ],
        note: "Ленту обновлений ИИ не читает — отвечает по данным расписания.",
    },
};

const numberFormat = new Intl.NumberFormat("ru-RU");

function formatNumber(value: number): string {
    return numberFormat.format(value);
}

/** 512000 → «512K», 1000000 → «1M» */
function formatContext(tokens: number): string {
    if (tokens >= 1_000_000) {
        const millions = tokens / 1_000_000;
        return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
    }

    return `${Math.round(tokens / 1000)}K`;
}

function readStoredSelection(): ChatSelection | null {
    try {
        const raw = localStorage.getItem(SELECTION_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<ChatSelection>;
        if (typeof parsed.provider !== "string" || typeof parsed.model !== "string") {
            return null;
        }

        return { provider: parsed.provider, model: parsed.model };
    } catch {
        return null;
    }
}

/**
 * null — пользователь ещё не делал выбора (ведём себя как «Авто»).
 * false — выбрана конкретная модель, true — выбран автовариант.
 */
function readStoredAuto(): boolean | null {
    try {
        const raw = localStorage.getItem(AUTO_KEY);
        return raw === null ? null : raw !== "0";
    } catch {
        return null;
    }
}

function getScopeDetail(tab: DebugTab, stats: ScheduleAnalysis | null): string {
    if (!stats) return "данные загружаются";

    switch (tab) {
        case "checks":
            return `${stats.checks.length} проверок · ${stats.criticalCount} критичных`;
        case "overview":
            return `${formatNumber(stats.total)} занятий · ${stats.groups} групп`;
        case "records":
            return `${formatNumber(stats.total)} записей`;
        case "journal":
        case "history":
            return "ИИ отвечает по данным расписания";
    }
}

function SuggestionCards({ scope, onPick }: { scope: TabMeta; onPick: (question: string) => void }) {
    const Icon = scope.icon;

    return (
        <div className="space-y-2">
            <div className="grid gap-2">
                {scope.suggestions.map((suggestion) => (
                    <button
                        key={suggestion.question}
                        type="button"
                        onClick={() => onPick(suggestion.question)}
                        className="group flex w-full items-start gap-3 rounded-3xl border border-border/60 bg-card p-3 text-left shadow-xs transition-colors hover:border-primary/25 hover:bg-primary/3"
                    >
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-3xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium leading-snug">
                                {suggestion.title}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                {suggestion.hint}
                            </span>
                        </span>
                        <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </button>
                ))}
            </div>
            {scope.note && (
                <p className="px-1 text-xxs leading-relaxed text-muted-foreground/70">
                    {scope.note}
                </p>
            )}
        </div>
    );
}

const COMMANDS: { name: string; aliases: string[]; description: string }[] = [
    { name: "/очистить", aliases: ["/clear"], description: "очистить лог" },
    { name: "/помощь", aliases: ["/help"], description: "список команд и подсказки" },
    { name: "/подсказки", aliases: ["/вопросы", "/suggestions"], description: "показать готовые вопросы" },
];

function ModelPicker({
    models,
    active,
    auto,
    onSelect,
    onAuto,
}: {
    models: ModelOption[];
    active: ChatSelection | null;
    auto: boolean;
    onSelect: (option: ModelOption) => void;
    onAuto: () => void;
}) {
    const current =
        models.find(
            (option) => option.provider === active?.provider && option.model === active?.model
        ) ?? models[0];

    if (!current) return null;

    const isFree = current.model.endsWith(":free");
    const label = auto ? "Авто" : current.label;
    const freeBadge = isFree ? (
        <span className="rounded-2xl bg-success/10 px-1 font-mono text-[9px] font-medium uppercase tracking-wide text-success">
            free
        </span>
    ) : null;

    // Одна модель — переключать нечего, но состояние «Авто» показать нужно.
    if (models.length <= 1) {
        return (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2 text-xxs font-medium text-muted-foreground shadow-xs">
                <span className="max-w-25 truncate">{label}</span>
                {freeBadge}
            </span>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Модель: ${label}`}
                    title="Выбрать модель"
                    className="h-7 min-w-0 gap-1.5 rounded-full border border-border/60 bg-background/70 px-2 text-xxs font-medium text-muted-foreground shadow-xs hover:bg-background"
                >
                    <span className="max-w-20.5 truncate sm:max-w-27.5">{label}</span>
                    {freeBadge}
                    <ChevronDownIcon className="h-3 w-3 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-1">
                <p className="px-2 py-1.5 text-xxs font-medium uppercase tracking-wider text-muted-foreground">
                    Модель
                </p>

                <PopoverClose asChild>
                    <button
                        type="button"
                        onClick={onAuto}
                        className={cn(
                            "flex w-full items-center gap-2 rounded-3xl px-2 py-2 text-left transition-colors hover:bg-muted",
                            auto && "bg-muted"
                        )}
                    >
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm">Авто</span>
                            <span className="block text-xxs text-muted-foreground">
                                Проверенная бесплатная по умолчанию
                            </span>
                        </span>
                        {auto && <CheckIcon className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                </PopoverClose>

                <div className="my-1 border-t border-border/60" />

                {models.map((option) => {
                    const isActive =
                        !auto &&
                        option.provider === current.provider &&
                        option.model === current.model;

                    return (
                        <PopoverClose asChild key={`${option.provider}/${option.model}`}>
                            <button
                                type="button"
                                onClick={() => onSelect(option)}
                                className={cn(
                                    "flex w-full items-center gap-2 rounded-3xl px-2 py-2 text-left transition-colors hover:bg-muted",
                                    isActive && "bg-muted"
                                )}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm">{option.label}</span>
                                    <span className="block text-xxs text-muted-foreground">
                                        {option.providerLabel}
                                        {option.model.endsWith(":free") ? " · бесплатно" : ""}
                                    </span>
                                </span>
                                {isActive && <CheckIcon className="h-4 w-4 shrink-0 text-primary" />}
                            </button>
                        </PopoverClose>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}

export function DebugAIChat({ stats, activeTab = "checks", className, onClose }: DebugAIChatProps) {
    const reduceMotion = useReducedMotion();
    const [messages, setMessages] = useState<Message[]>([]);
    // Повторный показ карточек-подсказок, когда переписка уже началась.
    const [showSuggestions, setShowSuggestions] = useState(false);
    // Автодополнение команд при вводе «/».
    const [cmdDismissed, setCmdDismissed] = useState(false);
    const [cmdIndex, setCmdIndex] = useState(0);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [dailyUsage, setDailyUsage] = useState<{ count: number; limit: number } | null>(null);
    // Размер контекстного окна выбранной модели — приходит с сервера
    const [contextLength, setContextLength] = useState<number | null>(null);
    // Готовность ИИ: без ключа или при исчерпанном лимите чат недоступен,
    // и человек должен узнать об этом сразу, а не после отправки вопроса.
    const [aiUnavailable, setAiUnavailable] = useState<string | null>(null);
    // Модели из белого списка на сервере. Пусто или одна — переключателя нет.
    const [models, setModels] = useState<ModelOption[]>([]);
    const [selection, setSelection] = useState<ChatSelection | null>(null);
    // «Авто» — проверенная бесплатная модель по умолчанию, без выбора слага.
    const [auto, setAuto] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scope = TAB_META[activeTab] ?? TAB_META.checks;
    const scopeDetail = getScopeDetail(activeTab, stats);

    const commandMatches = useMemo(() => {
        const q = input.trim().toLowerCase();
        if (!q.startsWith("/") || q.includes(" ")) return [];
        return COMMANDS.filter(
            (command) =>
                command.name.startsWith(q) ||
                command.aliases.some((alias) => alias.startsWith(q))
        );
    }, [input]);
    const showCmdMenu = commandMatches.length > 0 && !cmdDismissed;

    useEffect(() => {
        setCmdIndex(0);
    }, [input]);
    const currentModel =
        models.find(
            (option) => option.provider === selection?.provider && option.model === selection?.model
        ) ?? models[0];
    const modelLabel = auto ? "Авто" : currentModel?.label ?? "Модель";

    // Текущее состояние лимита, готовность ИИ и список моделей — с сервера.
    // Запрос повторяется при смене модели: вместе с ней меняется контекстное окно.
    useEffect(() => {
        let cancelled = false;
        let retryTimer: ReturnType<typeof setTimeout> | undefined;

        const params = new URLSearchParams();
        if (selection) {
            params.set("provider", selection.provider);
            params.set("model", selection.model);
        }
        const query = params.toString();

        const load = (attempt: number) => {
            fetch(`/api/debug/chat${query ? `?${query}` : ""}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (cancelled || !data) return;

                    if (typeof data.count === "number" && typeof data.limit === "number") {
                        setDailyUsage({ count: data.count, limit: data.limit });
                    }

                    setContextLength(
                        typeof data.contextLength === "number" ? data.contextLength : null
                    );

                    const options: ModelOption[] = Array.isArray(data.models) ? data.models : [];
                    setModels(options);

                    const defaultOption =
                        options.find(
                            (option) =>
                                option.provider === data.defaultProvider &&
                                option.model === data.defaultModel
                        ) ?? options[0];

                    // Выбранной модели больше нет в белом списке (.env поменяли) —
                    // возвращаемся к доступной, иначе чат останется с моделью,
                    // которую сервер уже не принимает.
                    if (
                        selection &&
                        options.length > 0 &&
                        !options.some(
                            (option) =>
                                option.provider === selection.provider &&
                                option.model === selection.model
                        )
                    ) {
                        const fallback = auto ? defaultOption : options[0];
                        setSelection({ provider: fallback.provider, model: fallback.model });
                        return;
                    }

                    if (!selection && options.length > 0) {
                        const stored = readStoredSelection();
                        const storedAuto = readStoredAuto();
                        // Старые версии не знали AUTO_KEY. Если там сохранена
                        // модель по умолчанию, показываем «Авто»; если человек
                        // выбрал другую — оставляем её.
                        const storedIsDefault =
                            stored?.provider === defaultOption.provider &&
                            stored.model === defaultOption.model;
                        const useAuto = storedAuto ?? (!stored || storedIsDefault);
                        const pick = useAuto
                            ? defaultOption
                            : options.find(
                                  (option) =>
                                      stored &&
                                      option.provider === stored.provider &&
                                      option.model === stored.model
                              ) ?? defaultOption;

                        setAuto(useAuto);
                        setSelection({ provider: pick.provider, model: pick.model });
                    }

                    if (data.available === false) {
                        setAiUnavailable(
                            "ИИ-чат не работает: нет связи с провайдером или ключ не принят. Проверьте ключ в .env. Остальные проверки работают."
                        );
                    } else if (data.limitReached) {
                        setAiUnavailable(
                            `Лимит на сегодня исчерпан: ${data.limit} запросов. Новый лимит — в 03:00 по Минску.`
                        );
                    } else {
                        setAiUnavailable(null);
                    }
                })
                .catch(() => {
                    // Дев-сервер перекомпилируется и может не ответить на первый
                    // запрос: без повтора переключатель моделей исчезал до перезагрузки.
                    if (cancelled || attempt >= 2) return;
                    retryTimer = setTimeout(() => load(attempt + 1), 1500);
                });
        };

        load(0);

        return () => {
            cancelled = true;
            if (retryTimer) clearTimeout(retryTimer);
        };
    }, [selection, auto]);

    // Загрузка истории при монтировании. Ошибки не восстанавливаем:
    // это состояние запроса, а не часть переписки.
    useEffect(() => {
        const saved = localStorage.getItem(HISTORY_KEY);
        if (!saved) return;

        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                setMessages(parsed.filter((message) => message?.role !== "error"));
            }
        } catch (error) {
            console.error("Ошибка загрузки истории чата:", error);
        }
    }, []);

    // Сохранение истории при изменении сообщений
    useEffect(() => {
        const persistable = messages.filter((message) => message.role !== "error");

        if (persistable.length > 0) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(persistable));
        } else {
            localStorage.removeItem(HISTORY_KEY);
        }
    }, [messages]);

    // Автопрокрутка вниз
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector(
                "[data-radix-scroll-area-viewport]"
            );
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isLoading]);

    // Cmd/Ctrl+K — фокус в командную строку, как в прототипе C.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const chooseModel = (option: ModelOption) => {
        const next = { provider: option.provider, model: option.model };
        setAuto(false);
        setSelection(next);
        setContextLength(null);
        localStorage.setItem(AUTO_KEY, "0");
        localStorage.setItem(SELECTION_KEY, JSON.stringify(next));
    };

    const chooseAuto = () => {
        setAuto(true);
        localStorage.setItem(AUTO_KEY, "1");
        localStorage.removeItem(SELECTION_KEY);

        const fallback = models[0];
        if (fallback) {
            setSelection({ provider: fallback.provider, model: fallback.model });
            setContextLength(null);
        }
    };

    const executeCommand = (commandText: string): boolean => {
        const command = commandText.trim().toLowerCase();
        if (command === "/clear" || command === "/очистить") {
            clearChat();
            setInput("");
            return true;
        }
        if (command === "/help" || command === "/помощь") {
            setShowSuggestions(true);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "ai",
                    content:
                        "Команды: `/очистить` — очистить лог; `/подсказки` (или `/вопросы`) — показать готовые вопросы (см. ниже). Остальное — обычный вопрос по данным расписания.",
                },
            ]);
            setInput("");
            return true;
        }
        if (
            command === "/подсказки" ||
            command === "/вопросы" ||
            command === "/suggestions"
        ) {
            setShowSuggestions(true);
            setInput("");
            return true;
        }
        return false;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading || aiUnavailable) return;

        const question = input.trim();
        if (executeCommand(question)) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: question,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Сервер понимает role: "assistant", а в истории чата роль называется
        // "ai". Без перевода модель видела только вопросы и не помнила ответы.
        const history = [...messages, userMessage]
            .filter((message) => message.role === "user" || message.role === "ai")
            .slice(-HISTORY_LIMIT)
            .map((message) => ({
                role: message.role === "ai" ? "assistant" : "user",
                content: message.content,
            }));

        // Ответ сервера нужен и в try, и в catch: в catch по нему понятно,
        // гасить ли ввод (ИИ недоступен) или просто показать текст ошибки.
        let data: ChatResponse | null = null;

        try {
            const response = await fetch("/api/debug/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: history,
                    context: stats,
                    activeTab,
                    ...(selection ? { provider: selection.provider, model: selection.model } : {}),
                }),
            });

            data = (await response.json()) as ChatResponse;

            if (data.error) {
                throw new Error(data.error);
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: data.content ?? "",
                usage: data.usage,
            };

            setMessages((prev) => [...prev, aiMessage]);

            if (data.dailyUsage) {
                setDailyUsage(data.dailyUsage);
            }
        } catch (error: unknown) {
            // Сервер уже вернул понятный текст (см. lib/debug-ai-errors.ts).
            // Здесь только сетевой случай: до сервера запрос не дошёл.
            const message =
                error instanceof Error && error.message !== "Failed to fetch"
                    ? error.message
                    : "Сервис ИИ не отвечает. Повторите попытку через минуту.";

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "error",
                content: message,
            };
            setMessages((prev) => [...prev, errorMessage]);

            // Если ИИ недоступен — гасим ввод, чтобы не слать заведомо
            // обречённые вопросы.
            if (
                data?.code === "not_configured" ||
                data?.code === "invalid_key" ||
                data?.code === "limit_exceeded" ||
                data?.code === "model_unavailable"
            ) {
                setAiUnavailable(data.error ?? message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setShowSuggestions(false);
        localStorage.removeItem(HISTORY_KEY);
    };

    const fillSuggestion = (question: string) => {
        setInput(question);
        inputRef.current?.focus();
    };

    // Расход последнего ОТВЕТА, а не последнего сообщения: после отправки
    // вопроса последним становится сообщение пользователя без usage,
    // и счётчик контекста падал бы в ноль до прихода ответа.
    const lastUsage = [...messages].reverse().find((message) => message.usage)?.usage;

    return (
        <Card
            className={cn(
                // Высота привязана к вьюпорту: на низком экране окно не обрежется.
                // cn (clsx + tailwind-merge) нужен, чтобы h-full из Sheet/Drawer
                // переопределял базовую высоту, а не спорил с ней порядком в CSS.
                "flex h-[min(640px,calc(100vh-7rem))] flex-col overflow-hidden border border-primary/10 bg-canvas shadow-xl",
                className
            )}
        >
            <CardHeader className="space-y-0 border-b bg-canvas p-0">
                <div className="flex items-center justify-between gap-2 px-4 pb-2.5 pt-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="rounded-3xl bg-primary/10 p-1.5">
                            <SparklesIcon className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="truncate font-evolventa text-sm font-semibold">ИИ-помощник</CardTitle>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <ModelPicker
                            models={models}
                            active={selection}
                            auto={auto}
                            onSelect={chooseModel}
                            onAuto={chooseAuto}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearChat}
                            aria-label="Очистить чат"
                            title="Очистить чат"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </Button>
                        {onClose && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                aria-label="Закрыть чат"
                                title="Закрыть"
                                className="h-8 w-8 text-muted-foreground"
                            >
                                <CloseIcon className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Строка контекста — главный признак варианта A: видно, по какой
                    вкладке и каким цифрам сейчас отвечает помощник. */}
                <div className="flex items-center gap-1.5 border-t border-border/40 bg-muted/20 px-4 py-1.5 text-xxs font-mono uppercase tracking-[0.12em] text-muted-foreground">
                    <span className="text-muted-foreground/60">Смотрю:</span>
                    <span className="font-medium text-foreground/80">{scope.label}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="truncate normal-case tracking-normal">{scopeDetail}</span>
                </div>
            </CardHeader>

            <CardContent className="relative flex-1 overflow-hidden p-0">
                <ScrollArea ref={scrollRef} className="h-full p-4">
                    <div className="space-y-3 pb-4">
                        {aiUnavailable && (
                            <div className="flex items-start gap-2 rounded-3xl border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
                                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{aiUnavailable}</span>
                            </div>
                        )}

                        {messages.length === 0 && (
                            <div className="space-y-4 py-1">
                                <div className="flex items-start gap-3">
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-3xl bg-primary/10 text-primary">
                                        <SparklesIcon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-evolventa text-sm font-semibold leading-snug">
                                            Спросите о том, что видите
                                        </h2>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Ответ строится по цифрам вкладки «{scope.label}».
                                        </p>
                                    </div>
                                </div>

                                <SuggestionCards scope={scope} onPick={fillSuggestion} />
                            </div>
                        )}

                        <AnimatePresence initial={false}>
                            {messages.map((message, index) => {
                                if (message.role === "error") {
                                    return (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={motionTransition(reduceMotion, {
                                                duration: MOTION_DURATION.fast,
                                            })}
                                            className="flex items-start gap-2 rounded-3xl border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning"
                                        >
                                            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>{message.content}</span>
                                        </motion.div>
                                    );
                                }

                                if (message.role === "user") {
                                    return (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={motionTransition(reduceMotion, {
                                                duration: MOTION_DURATION.fast,
                                            })}
                                            className={cn(
                                                "flex gap-2 text-sm",
                                                index > 0 && "border-t border-border/40 pt-3"
                                            )}
                                        >
                                            <span className="select-none pt-0.5 font-mono text-primary">
                                                &gt;
                                            </span>
                                            <span className="min-w-0 flex-1 whitespace-pre-wrap wrap-break-word font-medium">
                                                {stripEmoji(message.content)}
                                            </span>
                                        </motion.div>
                                    );
                                }

                                return (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={motionTransition(reduceMotion, {
                                            duration: MOTION_DURATION.fast,
                                        })}
                                        className="border-l-2 border-primary/15 pl-3"
                                    >
                                        <div className="text-sm leading-relaxed text-foreground">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }) => (
                                                        <p className="mb-2 last:mb-0">{children}</p>
                                                    ),
                                                    ul: ({ children }) => (
                                                        <ul className="mb-2 ml-4 list-disc space-y-0.5">
                                                            {children}
                                                        </ul>
                                                    ),
                                                    ol: ({ children }) => (
                                                        <ol className="mb-2 ml-4 list-decimal space-y-0.5">
                                                            {children}
                                                        </ol>
                                                    ),
                                                    li: ({ children }) => (
                                                        <li className="pl-0.5">{children}</li>
                                                    ),
                                                    h1: ({ children }) => (
                                                        <h1 className="mb-2 text-sm font-semibold text-primary">
                                                            {children}
                                                        </h1>
                                                    ),
                                                    h2: ({ children }) => (
                                                        <h2 className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide">
                                                            {children}
                                                        </h2>
                                                    ),
                                                    h3: ({ children }) => (
                                                        <h3 className="mb-1 mt-2 text-xs font-semibold">
                                                            {children}
                                                        </h3>
                                                    ),
                                                    code: ({ children }) => (
                                                        <code className="rounded-xl bg-muted px-1 py-0.5 font-mono text-[0.7rem]">
                                                            {children}
                                                        </code>
                                                    ),
                                                    // Модель регулярно отвечает таблицами
                                                    // (приоритеты, конфликты). Плагина
                                                    // typography в проекте нет, поэтому
                                                    // prose не работает и таблицы нужно
                                                    // оформить явно.
                                                    table: ({ children }) => (
                                                        <div className="my-2 overflow-x-auto rounded-3xl border border-border/60">
                                                            <table className="w-full border-collapse text-xs [&_tr:last-child_td]:border-b-0">
                                                                {children}
                                                            </table>
                                                        </div>
                                                    ),
                                                    thead: ({ children }) => (
                                                        <thead className="bg-muted/50">{children}</thead>
                                                    ),
                                                    th: ({ children }) => (
                                                        <th className="border-b border-border/60 px-2.5 py-1.5 text-left font-semibold align-top">
                                                            {children}
                                                        </th>
                                                    ),
                                                    td: ({ children }) => (
                                                        <td className="border-b border-border/40 px-2.5 py-1.5 align-top">
                                                            {children}
                                                        </td>
                                                    ),
                                                    a: ({ children, href }) => (
                                                        <a
                                                            href={href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary underline underline-offset-2"
                                                        >
                                                            {children}
                                                        </a>
                                                    ),
                                                    blockquote: ({ children }) => (
                                                        <blockquote className="my-2 border-l-2 border-primary/30 pl-3 italic text-muted-foreground">
                                                            {children}
                                                        </blockquote>
                                                    ),
                                                    hr: () => <hr className="my-3 border-border/60" />,
                                                    pre: ({ children }) => (
                                                        <pre className="my-2 overflow-x-auto rounded-3xl bg-muted/50 p-2.5 text-xs [&_code]:bg-transparent [&_code]:p-0">
                                                            {children}
                                                        </pre>
                                                    ),
                                                }}
                                            >
                                                {stripEmoji(message.content)}
                                            </ReactMarkdown>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                                <span className="select-none font-mono text-primary/60">&gt;</span>
                                <LoadingIcon className="h-3.5 w-3.5 animate-spin text-primary" />
                                <span className="font-mono text-xs">Считаю по расписанию…</span>
                            </motion.div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="flex-col items-stretch gap-2 border-t bg-canvas p-3">
                {messages.length > 0 && (
                    <div className="space-y-2">
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowSuggestions((value) => !value)}
                            className="h-auto self-start p-0 text-xs text-muted-foreground hover:text-foreground"
                        >
                            {showSuggestions ? "Скрыть подсказки" : "Подсказки"}
                        </Button>
                        {showSuggestions && (
                            <SuggestionCards scope={scope} onPick={fillSuggestion} />
                        )}
                    </div>
                )}
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSend();
                    }}
                    className="flex w-full items-end gap-2"
                >
                    <div className="relative flex min-w-0 flex-1 items-end gap-2 rounded-3xl border border-border/60 bg-background px-2.5 py-2 shadow-xs transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
                        <span className="select-none pb-0.5 font-mono text-sm leading-5 text-primary">
                            &gt;
                        </span>
                        <Textarea
                            ref={inputRef}
                            placeholder={
                                aiUnavailable ? "Чат недоступен" : "Спросить или /помощь"
                            }
                            aria-label="Вопрос к ИИ"
                            value={input}
                            onChange={(event) => {
                                setInput(event.target.value);
                                setCmdDismissed(false);
                            }}
                            onKeyDown={(event) => {
                                if (showCmdMenu) {
                                    if (event.key === "ArrowDown") {
                                        event.preventDefault();
                                        setCmdIndex((index) => Math.min(index + 1, commandMatches.length - 1));
                                        return;
                                    }
                                    if (event.key === "ArrowUp") {
                                        event.preventDefault();
                                        setCmdIndex((index) => Math.max(index - 1, 0));
                                        return;
                                    }
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        const selected = commandMatches[cmdIndex];
                                        if (selected) executeCommand(selected.name);
                                        return;
                                    }
                                    if (event.key === "Tab") {
                                        event.preventDefault();
                                        const selected = commandMatches[cmdIndex];
                                        if (selected) {
                                            setInput(selected.name);
                                            setCmdDismissed(true);
                                        }
                                        return;
                                    }
                                    if (event.key === "Escape") {
                                        event.preventDefault();
                                        setCmdDismissed(true);
                                        return;
                                    }
                                }
                                if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    handleSend();
                                }
                            }}
                            rows={1}
                            className="max-h-40 min-h-5 resize-none overflow-auto border-0 bg-transparent p-0 text-sm shadow-none scrollbar-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
                            disabled={isLoading || Boolean(aiUnavailable)}
                        />
                        <span
                            className="hidden h-5 shrink-0 select-none items-center rounded-xl border border-border/60 px-1.5 font-mono text-xxs leading-none text-muted-foreground/50 sm:inline-flex"
                            title="Ctrl+K — фокус в поле"
                        >
                            Ctrl K
                        </span>
                        {showCmdMenu && (
                            <div className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-3xl border border-border/60 bg-popover shadow-lg">
                                {commandMatches.map((command, index) => (
                                    <button
                                        key={command.name}
                                        type="button"
                                        onMouseEnter={() => setCmdIndex(index)}
                                        onClick={() => executeCommand(command.name)}
                                        className={cn(
                                            "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                                            index === cmdIndex ? "bg-muted" : "hover:bg-muted/60"
                                        )}
                                    >
                                        <span className="font-mono text-primary">{command.name}</span>
                                        <span className="text-xs text-muted-foreground">{command.description}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        aria-label="Отправить вопрос"
                        title="Отправить"
                        disabled={
                            !input.trim() ||
                            isLoading ||
                            Boolean(aiUnavailable) ||
                            (dailyUsage ? dailyUsage.count >= dailyUsage.limit : false)
                        }
                        className="h-10 w-10 shrink-0 rounded-3xl shadow-lg transition-[color,background-color,box-shadow,transform] active:scale-[0.96] hover:shadow-primary/20"
                    >
                        {isLoading ? (
                            <LoadingIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <SendIcon className="h-4 w-4" />
                        )}
                    </Button>
                </form>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-0.5 font-mono text-xxs uppercase tracking-[0.08em] text-muted-foreground/50">
                    <span className="truncate">
                        {modelLabel} · бесплатно
                    </span>
                    <span className="tabular-nums">
                        Контекст {formatNumber(lastUsage?.totalTokenCount || 0)}
                        {contextLength ? ` / ${formatContext(contextLength)}` : ""} ·{" "}
                        {dailyUsage?.count ?? 0}/{dailyUsage?.limit ?? 250}
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
