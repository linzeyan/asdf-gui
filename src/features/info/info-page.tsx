import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SystemInfo } from "./system-info";
import { EnvInspector } from "./env-inspector";
import * as commands from "@/lib/commands";
import type { AsdfInfo } from "@/lib/types";

export function InfoPage() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<AsdfInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    commands
      .asdfInfo()
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("info.title")}</h1>
      <SystemInfo info={info} isLoading={isLoading} />
      <EnvInspector />
    </div>
  );
}
