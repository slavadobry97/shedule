import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Document } from "@/types/documents";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Building2,
  Calendar,
  FileText,
  MapPin,
  User,
  QrCode,
} from "lucide-react";

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleQrClick = () => {
    if (document.link) {
      setIsQrModalOpen(true);
    }
  };

  const closeQrModal = () => {
    setIsQrModalOpen(false);
  };

  const isLinkAvailable = document.link;

  return (
    <Card className="w-full h-full flex flex-col relative">
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogTrigger asChild>
          <div
            className={`absolute top-2 right-2 cursor-pointer bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow p-2 rounded-full ${
              !isLinkAvailable
                ? "opacity-50 cursor-not-allowed pointer-events-none"
                : ""
            }`}
            onClick={handleQrClick}
          >
            <QrCode />
          </div>
        </DialogTrigger>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-96 mx-auto px-4 py-6 rounded-lg shadow-xl flex flex-col items-center">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold text-center">
              QR Код
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm font-medium text-center">
              {document.documentType}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center my-6">
            <QRCodeSVG
              value={document.link || document.id.toString()}
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#171717"}
            />
          </div>
          <small className="text-sm font-medium leading-none text-muted-foreground">
            Сканируйте QR код для доступа к документу.
          </small>
          <Button
            className="w-full mt-4 h-10 text-sm"
            variant="default"
            onClick={closeQrModal}
          >
            Закрыть
          </Button>
        </DialogContent>
      </Dialog>
      <CardHeader className="p-4 md:p-6 flex-none ">
        <CardTitle className="text-sm md:text-base !leading-tight line-clamp-5	text-center">
          {document.documentType}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 flex-grow flex flex-col">
        <div className="space-y-3 flex-grow">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground capitalize font-semibold">
              {(document.department || "Не указано").toUpperCase()}
            </p>
            <Badge
              variant="outline"
              className="px-3 py-1 rounded-lg font-semibold"
            >
              Каб. {document.room || "Не указан"}
            </Badge>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{document.purpose}</p>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {document.destination}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {document.issueDays}
            </p>
          </div>
          {document.requirements !== "-" && (
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <Badge variant="outline" className="px-3 py-1 rounded-lg">
                {document.requirements}
              </Badge>
            </div>
          )}
        </div>
        <Button
          className="w-full mt-4 h-10 text-sm"
          variant={"default"}
          disabled={!isLinkAvailable}
          onClick={() =>
            isLinkAvailable && window.open(document.link, "_blank")
          }
        >
          {isLinkAvailable ? "Заказать онлайн" : "Заказ онлайн недоступен"}
        </Button>
      </CardContent>
    </Card>
  );
}
