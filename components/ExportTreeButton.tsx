"use client";

import { Button } from "@/components/ui/button";
import { useReactFlow } from "@xyflow/react";
import { toPng } from "html-to-image";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ExportTreeButtonProps {
  isEmpty: boolean;
}

export function ExportTreeButton({ isEmpty }: ExportTreeButtonProps) {
  const t = useTranslations("trees");
  const tCommon = useTranslations("common");
  const { getNodes, getViewport, setViewport, fitView } = useReactFlow();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      toast.error(tCommon("error"));
      return;
    }

    setIsExporting(true);
    const previousViewport = getViewport();

    try {
      fitView({ padding: 0.01 });
      await new Promise((r) => setTimeout(r, 150));

      const viewportEl = document.querySelector(".react-flow__viewport")
        ?.parentElement;
      if (!viewportEl) {
        throw new Error("Could not find flow viewport");
      }

      const isDark = document.documentElement.classList.contains("dark");
      const backgroundColor = isDark ? "#1a1a1a" : "#ffffff";

      const dataUrl = await toPng(viewportEl, {
        pixelRatio: 256,
        backgroundColor,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = "ghorab-family.png";
      link.href = dataUrl;
      link.click();

      setViewport(previousViewport);
    } catch (err) {
      console.error(err);
      toast.error(tCommon("error"));
    } finally {
      setIsExporting(false);
    }
  }, [getNodes, getViewport, setViewport, fitView, t, tCommon]);

  return (
    <Button
      variant="outline"
      size="sm"
      className="shadow-xs"
      onClick={handleExport}
      disabled={isEmpty || isExporting}
      aria-label={t("exportTree")}
      title={t("exportTree")}
    >
      {isExporting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {t("exportTree")}
    </Button>
  );
}
