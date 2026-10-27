"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckIcon, RefreshIcon } from "@/components/icons";

const DEFAULTS = {
    radius: 0.65,
    hue: 250,
    fontScale: 100,
    dense: false,
};

/**
 * Живой тюнер темы: правит CSS-переменные прямо в превью,
 * чтобы увидеть, как система поведёт себя с другими значениями.
 */
export function ThemeTuner() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [radius, setRadius] = useState(DEFAULTS.radius);
    const [hue, setHue] = useState(DEFAULTS.hue);
    const [fontScale, setFontScale] = useState(DEFAULTS.fontScale);
    const [dense, setDense] = useState(DEFAULTS.dense);

    // На сервере useTheme() отдаёт undefined, на клиенте — реальную тему:
    // без этого разметка не совпадёт при гидрации.
    useEffect(() => setMounted(true), []);

    const style = useMemo(
        () =>
            ({
                "--radius": `${radius}rem`,
                "--primary": `oklch(0.62 0.19 ${hue})`,
                "--ring": `oklch(0.62 0.19 ${hue})`,
                fontSize: `${fontScale}%`,
            }) as React.CSSProperties,
        [radius, hue, fontScale]
    );

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Управление */}
            <div className="rounded-3xl border border-border/70 bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xxs uppercase tracking-[0.2em] text-muted-foreground">
                        Тюнер темы
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                        {(["light", "dark", "system"] as const).map((option) => (
                            <Button
                                key={option}
                                size="sm"
                                variant={mounted && theme === option ? "secondary" : "ghost"}
                                className="h-7 px-2 text-xs"
                                onClick={() => setTheme(option)}
                            >
                                {option === "light" ? "Светлая" : option === "dark" ? "Тёмная" : "Система"}
                            </Button>
                        ))}
                    </span>
                </div>

                <div className="mt-6 space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <Label htmlFor="tuner-radius">Скругление</Label>
                            <span className="font-mono text-tiny tabular-nums text-muted-foreground">
                                {radius.toFixed(2)}rem
                            </span>
                        </div>
                        <Slider
                            id="tuner-radius"
                            min={0}
                            max={1.25}
                            step={0.05}
                            value={[radius]}
                            onValueChange={([value]) => setRadius(value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <Label htmlFor="tuner-hue">Оттенок акцента</Label>
                            <span className="font-mono text-tiny tabular-nums text-muted-foreground">
                                {hue}°
                            </span>
                        </div>
                        <Slider
                            id="tuner-hue"
                            min={0}
                            max={360}
                            step={1}
                            value={[hue]}
                            onValueChange={([value]) => setHue(value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <Label htmlFor="tuner-font">Масштаб шрифта</Label>
                            <span className="font-mono text-tiny tabular-nums text-muted-foreground">
                                {fontScale}%
                            </span>
                        </div>
                        <Slider
                            id="tuner-font"
                            min={85}
                            max={120}
                            step={1}
                            value={[fontScale]}
                            onValueChange={([value]) => setFontScale(value)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="tuner-dense">Плотная компоновка</Label>
                        <Switch id="tuner-dense" checked={dense} onCheckedChange={setDense} />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => {
                            setRadius(DEFAULTS.radius);
                            setHue(DEFAULTS.hue);
                            setFontScale(DEFAULTS.fontScale);
                            setDense(DEFAULTS.dense);
                        }}
                    >
                        <RefreshIcon className="h-4 w-4" />
                        Сбросить к значениям проекта
                    </Button>
                </div>
            </div>

            {/* Превью */}
            <div className="rounded-3xl border border-border/70 bg-background p-5" style={style}>
                <p className="font-mono text-xxs uppercase tracking-[0.2em] text-muted-foreground">
                    Превью
                </p>

                <div className={dense ? "mt-4 space-y-3" : "mt-4 space-y-5"}>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button>Основная</Button>
                        <Button variant="secondary">Вторичная</Button>
                        <Button variant="outline">Контурная</Button>
                        <Button variant="ghost">Призрачная</Button>
                        <Button variant="link">Ссылка</Button>
                        <Button size="sm">Маленькая</Button>
                        <Button size="lg">Большая</Button>
                        <Button size="icon" variant="outline" aria-label="Настройки">
                            <CheckIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge>По умолчанию</Badge>
                        <Badge variant="secondary">Вторичный</Badge>
                        <Badge variant="outline">Контурный</Badge>
                        <Badge variant="destructive">Ошибка</Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input placeholder="Группа или преподаватель" />
                        <div className="flex h-9 items-center rounded-3xl border border-input bg-transparent px-3 text-sm text-muted-foreground">
                            Значение поля
                        </div>
                    </div>

                    <Alert>
                        <AlertTitle>Заголовок оповещения</AlertTitle>
                        <AlertDescription>Текст оповещения в одну или две строки.</AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Карточка</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Плотность отступов зависит от режима.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
