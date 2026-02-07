"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
    usage?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

interface DebugAIChatProps {
    stats: any;
    className?: string;
}

export function DebugAIChat({ stats, className }: DebugAIChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Загрузка истории при монтировании
    useEffect(() => {
        const saved = localStorage.getItem("debug_chat_history");
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Ошибка загрузки истории чата:", e);
            }
        }
    }, []);

    // Сохранение истории при изменении сообщений
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("debug_chat_history", JSON.stringify(messages));
        }
    }, [messages]);

    // Автопрокрутка вниз
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/debug/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    context: stats,
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: data.content,
                usage: data.usage,
            };

            setMessages((prev) => [...prev, aiMessage]);

            // Обновляем счетчик дневных запросов
            const dailyRequests = parseInt(localStorage.getItem("debug_chat_daily_requests") || "0") + 1;
            localStorage.setItem("debug_chat_daily_requests", dailyRequests.toString());
            localStorage.setItem("debug_chat_last_request_date", new Date().toDateString());

        } catch (error: any) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: `❌ Ошибка: ${error.message}. Убедитесь, что GEMINI_API_KEY добавлен в .env`,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        localStorage.removeItem("debug_chat_history");
    };

    return (
        <Card className={`flex flex-col h-[600px] border-primary/10 shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden border ${className}`}>
            <CardHeader className="py-2 px-4 border-b bg-muted/30 flex flex-col gap-2 space-y-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold">ИИ Помощник Катюхи</CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Игорь 2.0</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Ультра-минималистичные индикаторы */}
                <div className="flex items-center gap-3 px-1 mt-0.5 select-none transition-opacity duration-300">
                    <div className="flex items-center gap-1.5 group cursor-help" title="Контекст (использовано / всего)">
                        <div className="w-1 h-1 rounded-full bg-primary/40" />
                        <span className="text-xs text-muted-foreground/40 font-mono uppercase tracking-[0.05em]">
                            Конт: <span className="text-muted-foreground/60">{messages[messages.length - 1]?.usage?.totalTokenCount || 0}</span> / 1M
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 group cursor-help" title="Дневная квота запросов">
                        <div className="w-1 h-1 rounded-full bg-amber-500/40" />
                        {(() => {
                            const lastDate = localStorage.getItem("debug_chat_last_request_date");
                            const isToday = lastDate === new Date().toDateString();
                            const requests = isToday ? parseInt(localStorage.getItem("debug_chat_daily_requests") || "0") : 0;
                            return (
                                <span className="text-xs text-muted-foreground/40 font-mono uppercase tracking-[0.05em]">
                                    День: <span className="text-muted-foreground/60">{requests}</span> / 250
                                </span>
                            );
                        })()}
                    </div>

                    {messages[messages.length - 1]?.usage && (
                        <div className="ml-auto flex items-center gap-1">
                            <span className="text-xs text-muted-foreground/30 font-medium italic lowercase">
                                посл: +{messages[messages.length - 1]?.usage?.candidatesTokenCount}
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea ref={scrollRef} className="h-full p-4">
                    <div className="space-y-4 pb-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-center space-y-2 opacity-50">
                                <Bot className="h-10 w-10 text-primary/40" />
                                <p className="text-sm">Задайте вопрос по текущей статистике<br />или попросите совета по ошибкам.</p>
                            </div>
                        )}

                        <AnimatePresence mode="popLayout">
                            {messages.map((m) => (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex w-full mb-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`flex gap-3 max-w-[92%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        <Avatar className="h-8 w-8 border shadow-sm shrink-0">
                                            {m.role === "user" ? (
                                                <>
                                                    <AvatarImage src="" />
                                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                                        <User className="h-4 w-4" />
                                                    </AvatarFallback>
                                                </>
                                            ) : (
                                                <>
                                                    <AvatarFallback className="bg-muted">
                                                        <Bot className="h-4 w-4 text-primary" />
                                                    </AvatarFallback>
                                                </>
                                            )}
                                        </Avatar>
                                        <div className={`p-3 rounded-2xl text-sm shadow-sm border break-words overflow-hidden ${m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted/50 backdrop-blur-md rounded-tl-none border-primary/5"
                                            }`}>
                                            <div className="leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
                                                {m.role === "ai" ? (
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                                            li: ({ children }) => <li className="mb-1">{children}</li>,
                                                            h1: ({ children }) => <h1 className="text-sm font-bold mb-2 uppercase tracking-wide text-primary">{children}</h1>,
                                                            h2: ({ children }) => <h2 className="text-xs font-bold mb-1 uppercase tracking-wide">{children}</h2>,
                                                            h3: ({ children }) => <h3 className="text-xs font-bold mb-1">{children}</h3>,
                                                            code: ({ children }) => <code className="bg-muted-foreground/10 px-1 rounded text-[10px] font-mono">{children}</code>,
                                                        }}
                                                    >
                                                        {m.content}
                                                    </ReactMarkdown>
                                                ) : (
                                                    m.content
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="flex gap-3 max-w-[80%]">
                                    <Avatar className="h-8 w-8 border shadow-sm animate-pulse">
                                        <AvatarFallback className="bg-muted">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="p-3 rounded-2xl bg-muted/30 rounded-tl-none flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-xs text-muted-foreground font-medium italic">Думаю...</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-3 border-t bg-muted/20 backdrop-blur-md">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex w-full items-end gap-2"
                >
                    <Textarea
                        placeholder="Спросите ИИ о данных..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        rows={1}
                        className="min-h-[40px] px-3 py-2 text-xs resize-y max-h-[200px] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading}
                        className="shrink-0 h-10 w-10 shadow-lg hover:shadow-primary/20 transition-all active:scale-95 mb-0.5"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
