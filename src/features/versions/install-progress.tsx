import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InstallProgressProps {
  plugin: string;
  version: string;
  lines: string[];
  isRunning: boolean;
  onClose: () => void;
}

export function InstallProgress({
  plugin,
  version,
  lines,
  isRunning,
  onClose,
}: InstallProgressProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">
          {t("versions.installing")}{" "}
          <span className="font-mono">
            {plugin}@{version}
          </span>
        </CardTitle>
        {!isRunning && (
          <Button size="sm" variant="ghost" className="h-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className="h-[250px] overflow-y-auto bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300"
        >
          {lines.map((line, i) => (
            <div key={i}>{line || "\u00A0"}</div>
          ))}
          {isRunning && (
            <div className="animate-pulse text-zinc-500">&#x2588;</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
