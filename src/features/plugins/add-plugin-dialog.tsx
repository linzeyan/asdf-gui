import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PluginRegistry } from "@/lib/types";

interface AddPluginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registry: PluginRegistry[];
  registryLoading: boolean;
  onAdd: (name: string, gitUrl?: string) => Promise<void>;
}

export function AddPluginDialog({
  open,
  onOpenChange,
  registry,
  registryLoading,
  onAdd,
}: AddPluginDialogProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("registry");
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [adding, setAdding] = useState<string | null>(null);

  const filteredRegistry = registry.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAddFromRegistry(name: string) {
    setAdding(name);
    try {
      await onAdd(name);
      onOpenChange(false);
    } finally {
      setAdding(null);
    }
  }

  async function handleAddCustom() {
    if (!customName.trim() || !customUrl.trim()) return;
    setAdding(customName);
    try {
      await onAdd(customName.trim(), customUrl.trim());
      setCustomName("");
      setCustomUrl("");
      onOpenChange(false);
    } finally {
      setAdding(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("plugins.addPlugin")}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="registry" className="flex-1">
              {t("plugins.fromRegistry")}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              {t("plugins.customUrl")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registry" className="space-y-3">
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ScrollArea className="h-[300px]">
              {registryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="text-muted-foreground size-5 animate-spin" />
                </div>
              ) : filteredRegistry.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No plugins found
                </p>
              ) : (
                <div className="space-y-1 pr-3">
                  {filteredRegistry.map((p) => (
                    <div
                      key={p.name}
                      className="hover:bg-accent/50 flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p
                          className="text-muted-foreground truncate text-xs"
                          title={p.url}
                        >
                          {p.url}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2 h-7 shrink-0 text-xs"
                        disabled={adding === p.name}
                        onClick={() => handleAddFromRegistry(p.name)}
                      >
                        {adding === p.name ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : null}
                        {t("common.add")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("plugins.pluginName")}
              </label>
              <Input
                placeholder="e.g. nodejs"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("plugins.gitUrl")}
              </label>
              <Input
                placeholder="https://github.com/..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={
                  !customName.trim() || !customUrl.trim() || adding !== null
                }
                onClick={handleAddCustom}
              >
                {adding !== null ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : null}
                {t("common.add")}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
