"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from "@/app/actions/debug-auth";
import { LockKeyhole, Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function DebugLoginForm() {
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
        <Card className="w-full max-w-sm shadow-lg border">
            <CardHeader className="space-y-1 pb-4">
                <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center shadow-inner">
                        <LockKeyhole className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl text-center font-bold">Доступ к отладке</CardTitle>
                <CardDescription className="text-center px-2">
                    Для входа в панель администратора требуется авторизация
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="password">Пароль</Label>
                        <div className="relative">
                            <motion.div
                                animate={error ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
                                transition={{ duration: 0.4 }}
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
                                        "pr-10 transition-all duration-200",
                                        error
                                            ? "border-destructive focus-visible:ring-destructive"
                                            : success
                                                ? "border-green-500 focus-visible:ring-green-500"
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
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
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
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-3 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 shadow-sm">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
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
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-3 p-3 text-sm text-green-600 bg-green-500/10 rounded-lg border border-green-500/20 shadow-sm">
                                    <CheckCircle className="h-4 w-4 shrink-0" />
                                    <p className="font-medium">Успешный вход! Переадресация...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
                <CardFooter className="pb-6">
                    <Button
                        className={cn(
                            "w-full h-10 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]",
                            success && "bg-green-600 hover:bg-green-700"
                        )}
                        type="submit"
                        disabled={isLoading || success}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Проверка...</span>
                            </div>
                        ) : success ? (
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Вход выполнен</span>
                            </div>
                        ) : (
                            "Войти"
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
