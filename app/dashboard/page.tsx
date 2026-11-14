"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, PaintBoardIcon } from "@/components/icons";
import { DashboardOps } from "@/components/dashboard/dashboard-ops";
import { DashboardBento } from "@/components/dashboard/dashboard-bento";
import { DashboardStatus } from "@/components/dashboard/dashboard-status";
import { DashboardKpi } from "@/components/dashboard/dashboard-kpi";

type Variant = "ops" | "bento" | "status" | "kpi";

const VARIANTS: Variant[] = ["ops", "bento", "status", "kpi"];

function getVariantFromUrl(): Variant {
  const v = new URLSearchParams(window.location.search).get("variant");
  return VARIANTS.includes(v as Variant) ? (v as Variant) : "ops";
}

const VARIANT_LABEL: Record<Variant, string> = {
    ops: "Итог (3 + баннер)",
    bento: "Острова",
    status: "Статусы",
    kpi: "KPI + лента",
};

/**
 * Прототип «Операционной панели» (вариант C из аудита): страница состояния
 * сервиса на моках. Вариант по умолчанию — «Итог»: сводка + KPI + лента
 * событий. Прежние варианты оставлены в переключателе для сравнения;
 * после выбора данные подключаются к реальным источникам (снапшот Redis,
 * checks Sheets, push-utils, debug-ai-limit).
 */
export default function DashboardPage() {
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>("ops");

  // Глубокая ссылка на вариант (?variant=status) — удобно сравнивать
  // и делиться конкретным экраном. URL — внешняя система: одноразовая
  // синхронизация при монтировании (без SSR-расхождения).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVariant(getVariantFromUrl());
  }, []);

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-evolventa text-2xl font-bold tracking-[-0.01em]">Дашборд</h1>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PaintBoardIcon className="h-3.5 w-3.5" />
            Прототип на моках — пробуем «Итог»; данные подключим после финального выбора
          </p>
        </div>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeftIcon className="h-4 w-4" />
          Вернуться на главную
        </Button>
      </div>

      <Tabs value={variant} onValueChange={(v) => setVariant(v as Variant)}>
        <TabsList className="mb-4">
          <TabsTrigger value="ops">{VARIANT_LABEL.ops}</TabsTrigger>
          <TabsTrigger value="bento">{VARIANT_LABEL.bento}</TabsTrigger>
          <TabsTrigger value="status">{VARIANT_LABEL.status}</TabsTrigger>
          <TabsTrigger value="kpi">{VARIANT_LABEL.kpi}</TabsTrigger>
        </TabsList>
      </Tabs>

      {variant === "ops" && <DashboardOps />}
      {variant === "bento" && <DashboardBento />}
      {variant === "status" && <DashboardStatus />}
      {variant === "kpi" && <DashboardKpi />}
    </main>
  );
}
