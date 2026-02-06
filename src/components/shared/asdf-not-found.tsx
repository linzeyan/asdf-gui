import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AsdfNotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="border-border/50 bg-card max-w-md rounded-xl shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="size-10 text-amber-500" />
          <h2 className="text-lg font-semibold">{t("errors.asdfNotFound")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("errors.asdfNotFoundDesc")}
          </p>
          <Button variant="outline" onClick={() => navigate("/settings")}>
            <Settings className="mr-1.5 size-4" />
            {t("errors.goToSettings")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
