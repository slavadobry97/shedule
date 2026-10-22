"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from "@/app/actions/debug-auth";
import { AlertCircleIcon, CheckCircleIcon, ViewIcon, ViewOffIcon, LoadingIcon, LockIcon } from "@/components/icons";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, motionTransition } from "@/lib/motion";
import { cn } from "cn";

export function DebugLoginForm() {
    const reduceMotion = useReducedMotion();
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        // Имитация задержки для красоты анимации
        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const result = await loginAction(password);
            if (result.success) {
                setSuccess(true);
                // toast.success removed
                // Небольшая задержка перед перезагрузкой, чтобы увидеть красивое сообщение
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                setError("Неверный пароль");
            }
        } catch (error) {
            setError("Ошибка подключения");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm border border-border/70">
            <CardHeader className="space-y-3 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/40">
                    <LockIcon className="h-5 w-5 text-primary" />
                </span>
                <div className="space-y-1.5">
                    <p className="font-mono text-tiny uppercase tracking-[0.2em] text-muted-foreground">
                        Служебный раздел
                    </p>
                    <CardTitle className="font-evolventa text-xl font-bold tracking-[-0.01em]">
                        Доступ к отладке
                    </CardTitle>
                    <CardDescription>
                        Для входа в панель администратора требуется авторизация
                    </CardDescription>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="password">Пароль</Label>
                        <div className="relative">
                            <motion.div
                                animate={error ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
                                transition={motionTransition(reduceMotion, { duration: MOTION_DURATION.base })}
                            >
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    disabled={isLoading || success}
                                    required
                                    className={cn(
                                        "pr-10 transition-[color,border-color,box-shadow] duration-200",
                                        error
                                            ? "border-destructive focus-visible:ring-destructive"
                                            : success
                                                ? "border-success/50 focus-visible:ring-success"
                                                : "focus-visible:ring-primary/30"
                                    )}
                                />
                            </motion.div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground/70 hover:text-foreground transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading || success}
                                tabIndex={-1}
                            >
                                {showPassword ? (
 <ViewOffIcon className="h-4 w-4" />
                                ) : (
 <ViewIcon className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={motionTransition(reduceMotion, { duration: MOTION_DURATION.fast })}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-3 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 shadow-xs">
 <AlertCircleIcon className="h-4 w-4 shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={motionTransition(reduceMotion, { duration: MOTION_DURATION.fast })}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-3 p-3 text-sm text-success bg-success/10 rounded-lg border border-success/20 shadow-xs">
 <CheckCircleIcon className="h-4 w-4 shrink-0" />
                                    <p className="font-medium">Успешный вход! Переадресация...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
                <CardFooter className="pb-6">
                    <Button
                        className={cn(
                            "h-10 w-full gap-2 active:scale-[0.96]",
                            success && "bg-success/60 hover:bg-success/70"
                        )}
                        type="submit"
                        disabled={isLoading || success}
                    >
                        {isLoading ? (
                            <>
                                <LoadingIcon className="h-4 w-4 animate-spin" />
                                <span>Проверка…</span>
                            </>
                        ) : success ? (
                            <>
                                <CheckCircleIcon className="h-4 w-4" />
                                <span>Вход выполнен</span>
                            </>
                        ) : (
                            "Войти"
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
