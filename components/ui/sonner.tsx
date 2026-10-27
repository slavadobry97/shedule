'use client'

import { useTheme } from "next-themes"
import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
} from 'sonner';
import {
 AlertCircleIcon,
 AlertTriangleIcon,
 CalendarDaysIcon,
 CheckCircleIcon,
 ClockIcon,
 CloseIcon,
 FileTextIcon,
 InfoIcon,
 Location01Icon,
 UsersIcon,
} from "@/components/icons";
import { cn } from "cn";

type Variant = 'success' | 'error' | 'warning' | 'info';

interface ScheduleToastProps {
  group: string;
  date: string;
  time: string;
  subject: string;
  classroom?: string;
  teacher?: string;
  lessonType?: string;
  variant: Variant;
  actionLabel?: string;
  // Для отображения изменений (было → стало)
  oldSubject?: string;
  oldClassroom?: string;
  oldTeacher?: string;
  oldLessonType?: string;
}

const variantStyles: Record<Variant, string> = {
  success: 'border-success',
  error: 'border-destructive',
  warning: 'border-warning',
  info: 'border-info',
};

const titleColor: Record<Variant, string> = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
};

const iconColor: Record<Variant, string> = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
};

const variantIcons: Record<Variant, React.ComponentType<{ className?: string }>> = {
 success: CheckCircleIcon,
 error: AlertCircleIcon,
 warning: AlertTriangleIcon,
 info: InfoIcon,
};

const actionLabels: Record<Variant, string> = {
  success: 'Добавлено',
  error: 'Удалено',
  warning: 'Изменено',
  info: 'Информация',
};

// Кастомный toast для расписания
export const showScheduleToast = ({
  group,
  date,
  time,
  subject,
  classroom,
  teacher,
  lessonType,
  variant,
  actionLabel,
  oldSubject,
  oldClassroom,
  oldTeacher,
  oldLessonType,
}: ScheduleToastProps) => {
  const Icon = variantIcons[variant];
  const label = actionLabel || actionLabels[variant];

  // Собираем список изменений для warning
  const changes: { field: string; from: string; to: string }[] = [];
  if (oldSubject && oldSubject !== subject) {
    changes.push({ field: 'Дисциплина', from: oldSubject, to: subject });
  }
  if (oldClassroom && oldClassroom !== classroom) {
    changes.push({ field: 'Аудитория', from: oldClassroom, to: classroom || '' });
  }
  if (oldTeacher && oldTeacher !== teacher) {
    changes.push({ field: 'Преподаватель', from: oldTeacher, to: teacher || '' });
  }
  if (oldLessonType && oldLessonType !== lessonType) {
    changes.push({ field: 'Тип занятия', from: oldLessonType, to: lessonType || '' });
  }

  sonnerToast.custom(
    (toastId) => (
      <div
        className={cn(
          'flex flex-col gap-2 w-full max-w-sm p-4 rounded-3xl border-l-4 bg-card border border-border shadow-md',
          variantStyles[variant]
        )}
      >
        {/* Заголовок с иконкой */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5 shrink-0', iconColor[variant])} />
            <p className={cn('text-base font-semibold leading-none', titleColor[variant])}>
              {label}
            </p>
          </div>
          <button
            onClick={() => sonnerToast.dismiss(toastId)}
            className="rounded-full p-1 hover:bg-muted/50 transition-colors shrink-0"
            aria-label="Закрыть"
          >
 <CloseIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Детали с иконками */}
        <div className="space-y-1.5 text-xs text-foreground font-medium pl-7">
          <div className="flex items-center gap-2">
 <UsersIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>{group}</span>
          </div>
          <div className="flex items-center gap-2">
 <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2">
 <ClockIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>{time}</span>
          </div>

          {/* Показываем изменения если есть */}
          {changes.length > 0 ? (
            <div className="mt-2 pt-2 border-t border-dashed space-y-1">
              {changes.map((change, idx) => (
                <div key={idx} className="text-xs">
                  <span className="text-muted-foreground">{change.field}: </span>
                  <span className="line-through text-destructive/70">{change.from}</span>
                  <span className="mx-1">→</span>
                  <span className="text-green-600 dark:text-green-400">{change.to}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
 <FileTextIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{subject}</span>
              </div>
              {classroom && (
                <div className="flex items-center gap-2">
 <Location01Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>Ауд. {classroom}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    ),
    { duration: 5000 }
  );
};

// Простой toast для сообщений
export const showToast = ({
  title,
  message,
  variant,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  variant: Variant;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  const Icon = variantIcons[variant];

  sonnerToast.custom(
    (toastId) => (
      <div
        className={cn(
          'flex items-start gap-3 w-full max-w-sm p-4 rounded-3xl border-l-4 bg-card border border-border shadow-md',
          variantStyles[variant]
        )}
      >
        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', iconColor[variant])} />
        <div className="flex-1 space-y-1">
          <p className={cn('text-sm font-semibold leading-none', titleColor[variant])}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{message}</p>
          {onAction && actionLabel && (
            <button
              onClick={() => {
                onAction();
                sonnerToast.dismiss(toastId);
              }}
              className="mt-2 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-3xl hover:bg-primary/90 transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={() => sonnerToast.dismiss(toastId)}
          className="rounded-full p-1 hover:bg-muted/50 transition-colors shrink-0"
          aria-label="Закрыть"
        >
 <CloseIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    ),
    { duration: 5000 }
  );
};

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      toastOptions={{
        unstyled: true,
        className: 'w-full',
      }}
      {...props}
    />
  )
}

export { Toaster }
