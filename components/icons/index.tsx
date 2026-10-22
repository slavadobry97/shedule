import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";

import Add01IconData from "@hugeicons/core-free-icons/Add01Icon";
import Alert02IconData from "@hugeicons/core-free-icons/Alert02Icon";
import AlertCircleIconData from "@hugeicons/core-free-icons/AlertCircleIcon";
import AlertDiamondIconData from "@hugeicons/core-free-icons/AlertDiamondIcon";
import ArrowDown01IconData from "@hugeicons/core-free-icons/ArrowDown01Icon";
import ArrowRight01IconData from "@hugeicons/core-free-icons/ArrowRight01Icon";
import ArrowUp01IconData from "@hugeicons/core-free-icons/ArrowUp01Icon";
import ArrowUpDownIconData from "@hugeicons/core-free-icons/ArrowUpDownIcon";
import BellIconData from "@hugeicons/core-free-icons/BellIcon";
import BellOffIconData from "@hugeicons/core-free-icons/BellOffIcon";
import BellRingIconData from "@hugeicons/core-free-icons/BellRingIcon";
import BotIconData from "@hugeicons/core-free-icons/BotIcon";
import BuildingIconData from "@hugeicons/core-free-icons/BuildingIcon";
import Calendar01IconData from "@hugeicons/core-free-icons/Calendar01Icon";
import CalendarDaysIconData from "@hugeicons/core-free-icons/CalendarDaysIcon";
import CalendarPlus01IconData from "@hugeicons/core-free-icons/CalendarPlus01Icon";
import CalendarSyncIconData from "@hugeicons/core-free-icons/CalendarSyncIcon";
import CheckIconData from "@hugeicons/core-free-icons/CheckIcon";
import CheckmarkCircle01IconData from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import ChevronDownIconData from "@hugeicons/core-free-icons/ChevronDownIcon";
import ChevronLeftIconData from "@hugeicons/core-free-icons/ChevronLeftIcon";
import ChevronRightIconData from "@hugeicons/core-free-icons/ChevronRightIcon";
import ChevronUpIconData from "@hugeicons/core-free-icons/ChevronUpIcon";
import ChevronsLeftIconData from "@hugeicons/core-free-icons/ChevronsLeftIcon";
import ChevronsRightIconData from "@hugeicons/core-free-icons/ChevronsRightIcon";
import Clock01IconData from "@hugeicons/core-free-icons/Clock01Icon";
import CommandIconData from "@hugeicons/core-free-icons/CommandIcon";
import Copy01IconData from "@hugeicons/core-free-icons/Copy01Icon";
import File01IconData from "@hugeicons/core-free-icons/File01Icon";
import FileDownloadIconData from "@hugeicons/core-free-icons/FileDownloadIcon";
import GraduationCapIconData from "@hugeicons/core-free-icons/GraduationCapIcon";
import HistoryIconData from "@hugeicons/core-free-icons/HistoryIcon";
import InfoIconData from "@hugeicons/core-free-icons/InfoIcon";
import LayoutDashboardIconData from "@hugeicons/core-free-icons/LayoutDashboardIcon";
import Location01IconData from "@hugeicons/core-free-icons/Location01Icon";
import Loading02IconData from "@hugeicons/core-free-icons/Loading02Icon";
import LockKeyholeIconData from "@hugeicons/core-free-icons/LockKeyholeIcon";
import Moon01IconData from "@hugeicons/core-free-icons/Moon01Icon";
import PaintBoardIconData from "@hugeicons/core-free-icons/PaintBoardIcon";
import QrCodeIconData from "@hugeicons/core-free-icons/QrCodeIcon";
import RefreshCcwIconData from "@hugeicons/core-free-icons/RefreshCcwIcon";
import Search01IconData from "@hugeicons/core-free-icons/Search01Icon";
import SearchXIconData from "@hugeicons/core-free-icons/SearchXIcon";
import SendIconData from "@hugeicons/core-free-icons/SendIcon";
import ShieldCheckIconData from "@hugeicons/core-free-icons/ShieldCheckIcon";
import SlidersHorizontalIconData from "@hugeicons/core-free-icons/SlidersHorizontalIcon";
import SparklesIconData from "@hugeicons/core-free-icons/SparklesIcon";
import Sun01IconData from "@hugeicons/core-free-icons/Sun01Icon";
import TableIconData from "@hugeicons/core-free-icons/TableIcon";
import TrashIconData from "@hugeicons/core-free-icons/TrashIcon";
import UserIconData from "@hugeicons/core-free-icons/UserIcon";
import ViewIconData from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffIconData from "@hugeicons/core-free-icons/ViewOffIcon";
import UsersIconData from "@hugeicons/core-free-icons/UsersIcon";
import WifiOff01IconData from "@hugeicons/core-free-icons/WifiOff01Icon";
import Cancel01IconData from "@hugeicons/core-free-icons/Cancel01Icon";
import CancelCircleIconData from "@hugeicons/core-free-icons/CancelCircleIcon";

export type IconProps = Omit<HugeiconsIconProps, "icon" | "strokeWidth"> & {
    strokeWidth?: number | string;
};

export type IconComponent = (props: IconProps) => React.JSX.Element;

/**
 * Иконки проекта на Hugeicons.
 *
 * Данные тянутся по конкретным путям (`@hugeicons/core-free-icons/<Имя>`),
 * а не из общего бареля — так в бандл попадают только используемые иконки
 * вместо всех ~6000.
 */
function createIcon(icon: IconSvgElement, displayName: string): IconComponent {
    const Icon = ({ strokeWidth = 1.5, ...props }: IconProps) => (
        <HugeiconsIcon
            icon={icon}
            strokeWidth={typeof strokeWidth === "number" ? strokeWidth : Number(strokeWidth)}
            {...props}
        />
    );
    Icon.displayName = displayName;
    return Icon;
}

export const AddIcon = createIcon(Add01IconData, "AddIcon");
export const AlertTriangleIcon = createIcon(Alert02IconData, "AlertTriangleIcon");
export const AlertCircleIcon = createIcon(AlertCircleIconData, "AlertCircleIcon");
export const AlertOctagonIcon = createIcon(AlertDiamondIconData, "AlertOctagonIcon");
export const ArrowDownIcon = createIcon(ArrowDown01IconData, "ArrowDownIcon");
export const ArrowRightIcon = createIcon(ArrowRight01IconData, "ArrowRightIcon");
export const ArrowUpIcon = createIcon(ArrowUp01IconData, "ArrowUpIcon");
export const ArrowUpDownIcon = createIcon(ArrowUpDownIconData, "ArrowUpDownIcon");
export const BellIcon = createIcon(BellIconData, "BellIcon");
export const BellOffIcon = createIcon(BellOffIconData, "BellOffIcon");
export const BellRingIcon = createIcon(BellRingIconData, "BellRingIcon");
export const BotIcon = createIcon(BotIconData, "BotIcon");
export const BuildingIcon = createIcon(BuildingIconData, "BuildingIcon");
export const CalendarIcon = createIcon(Calendar01IconData, "CalendarIcon");
export const CalendarDaysIcon = createIcon(CalendarDaysIconData, "CalendarDaysIcon");
export const CalendarPlusIcon = createIcon(CalendarPlus01IconData, "CalendarPlusIcon");
export const CalendarSyncIcon = createIcon(CalendarSyncIconData, "CalendarSyncIcon");
export const CheckIcon = createIcon(CheckIconData, "CheckIcon");
export const CheckCircleIcon = createIcon(CheckmarkCircle01IconData, "CheckCircleIcon");
export const ChevronDownIcon = createIcon(ChevronDownIconData, "ChevronDownIcon");
export const ChevronLeftIcon = createIcon(ChevronLeftIconData, "ChevronLeftIcon");
export const ChevronRightIcon = createIcon(ChevronRightIconData, "ChevronRightIcon");
export const ChevronUpIcon = createIcon(ChevronUpIconData, "ChevronUpIcon");
export const ChevronsLeftIcon = createIcon(ChevronsLeftIconData, "ChevronsLeftIcon");
export const ChevronsRightIcon = createIcon(ChevronsRightIconData, "ChevronsRightIcon");
export const ClockIcon = createIcon(Clock01IconData, "ClockIcon");
export const CloseIcon = createIcon(Cancel01IconData, "CloseIcon");
export const CloseCircleIcon = createIcon(CancelCircleIconData, "CloseCircleIcon");
export const CommandIcon = createIcon(CommandIconData, "CommandIcon");
export const CopyIcon = createIcon(Copy01IconData, "CopyIcon");
export const ViewIcon = createIcon(ViewIconData, "ViewIcon");
export const ViewOffIcon = createIcon(ViewOffIconData, "ViewOffIcon");
export const FileTextIcon = createIcon(File01IconData, "FileTextIcon");
export const FileDownloadIcon = createIcon(FileDownloadIconData, "FileDownloadIcon");
export const GraduationCapIcon = createIcon(GraduationCapIconData, "GraduationCapIcon");
export const HistoryIcon = createIcon(HistoryIconData, "HistoryIcon");
export const InfoIcon = createIcon(InfoIconData, "InfoIcon");
export const LayoutDashboardIcon = createIcon(LayoutDashboardIconData, "LayoutDashboardIcon");
export const LoadingIcon = createIcon(Loading02IconData, "LoadingIcon");
export const LockIcon = createIcon(LockKeyholeIconData, "LockIcon");
export const Location01Icon = createIcon(Location01IconData, "Location01Icon");
export const MoonIcon = createIcon(Moon01IconData, "MoonIcon");
export const PaintBoardIcon = createIcon(PaintBoardIconData, "PaintBoardIcon");
export const PlusIcon = createIcon(Add01IconData, "PlusIcon");
export const QrCodeIcon = createIcon(QrCodeIconData, "QrCodeIcon");
export const RefreshIcon = createIcon(RefreshCcwIconData, "RefreshIcon");
export const SearchIcon = createIcon(Search01IconData, "SearchIcon");
export const SearchXIcon = createIcon(SearchXIconData, "SearchXIcon");
export const SendIcon = createIcon(SendIconData, "SendIcon");
export const ShieldCheckIcon = createIcon(ShieldCheckIconData, "ShieldCheckIcon");
export const SlidersHorizontalIcon = createIcon(SlidersHorizontalIconData, "SlidersHorizontalIcon");
export const SparklesIcon = createIcon(SparklesIconData, "SparklesIcon");
export const SunIcon = createIcon(Sun01IconData, "SunIcon");
export const TableIcon = createIcon(TableIconData, "TableIcon");
export const TrashIcon = createIcon(TrashIconData, "TrashIcon");
export const UserIcon = createIcon(UserIconData, "UserIcon");
export const UsersIcon = createIcon(UsersIconData, "UsersIcon");
export const WifiOffIcon = createIcon(WifiOff01IconData, "WifiOffIcon");
