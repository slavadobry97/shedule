import { Metadata } from "next";
import DynamicSchedule from "@/components/DynamicSchedule";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const params = await searchParams;
  const group = typeof params.group === 'string' ? params.group : undefined;
  const teacher = typeof params.teacher === 'string' ? params.teacher : undefined;

  let title = "Расписание занятий РГСУ | Филиал в Минске";
  let description = "Актуальное расписание занятий Филиала РГСУ в г. Минске на 2025-2026 учебный год. Поиск по группам, преподавателям и датам.";

  if (group) {
    title = `Расписание ${group} | РГСУ Минск`;
    description = `Актуальное расписание занятий для группы ${group} в филиале РГСУ.`;
  } else if (teacher) {
    title = `Расписание ${teacher} | РГСУ Минск`;
    description = `Актуальное расписание занятий преподавателя ${teacher} в филиале РГСУ.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
      siteName: 'Расписание РГСУ',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const group = typeof params.group === 'string' ? params.group : undefined;
  const teacher = typeof params.teacher === 'string' ? params.teacher : undefined;

  return (
    <main className="min-h-screen bg-background">
      <DynamicSchedule initialGroup={group} initialTeacher={teacher} />
    </main>
  );
}
