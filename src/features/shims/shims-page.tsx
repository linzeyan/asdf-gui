import { useTranslation } from "react-i18next";
import { ShimLookup } from "./shim-lookup";
import { ReshimPanel } from "./reshim-panel";

export function ShimsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("shims.title")}</h1>
      <ShimLookup />
      <ReshimPanel />
    </div>
  );
}
