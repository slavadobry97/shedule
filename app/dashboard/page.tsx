"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center min-h-screen gap-2">
        <h1 className="font-semibold text-4xl">Дашбоард</h1>
        <p>Страница в статусе разработки</p>
        <Button onClick={() => router.push("/")} variant="outline">
          Вернуться на главную
        </Button>
      </div>
    </main>
  );
}
