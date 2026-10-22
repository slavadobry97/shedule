import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "@/components/icons";

/**
 * Как подписаться на расписание в календарь.
 *
 * Шаги короткие, под актуальные версии: iOS 26/27 (шаг «Другое» в меню
 * «Добавить» больше не нужен), Google Calendar на вебе и Android, Календарь
 * Apple на macOS, Outlook в браузере.
 *
 * Используется в двух местах — в подсказке по группе и по преподавателю.
 */
export function CalendarSubscribeHelp() {
    return (
        <div className="text-xs text-muted-foreground space-y-2.5">
            <div>
                <p className="font-medium text-foreground">iPhone (iOS 26 и новее)</p>
                <p>Настройки → Приложения → Календарь → Учётные записи → Добавить → Добавить другую
                    учётную запись → Подписной календарь</p>
                <p className="text-muted-foreground/80">
                    Чтобы приходили уведомления, сначала откройте сайт в Safari → Поделиться → На экран
                    «Домой».
                </p>
            </div>

            <div>
                <p className="font-medium text-foreground">Google Calendar (веб и Android)</p>
                {/* div, а не p: Badge рендерится как <div> — внутри <p> это невалидный HTML */}
                <div className="flex items-center gap-1 flex-wrap">
                    Другие календари →{" "}
                    <Badge
                        variant="outline"
                        className="h-4 w-4 p-0 inline-flex items-center justify-center rounded-full"
                    >
                        <PlusIcon className="h-2.5 w-2.5 text-muted-foreground" strokeWidth={3} />
                    </Badge>{" "}
                    → По URL
                </div>
            </div>

            <div>
                <p className="font-medium text-foreground">Календарь Apple (macOS)</p>
                <p>Календарь → Файл → Новая подписка календаря → вставьте ссылку</p>
            </div>

            <div>
                <p className="font-medium text-foreground">Outlook (в браузере)</p>
                <p>Календари → Добавить календарь → Подписаться из веба → вставьте ссылку</p>
            </div>
        </div>
    );
}
