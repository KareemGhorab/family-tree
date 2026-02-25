"use client";

import { useFamilyTreeNodes } from "@/app/service/family-tree/tree/nodes/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, Loader2 } from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

const DEBOUNCE_MS = 280;

export interface ParentSelectProps {
  treeId: string;
  value: string;
  onChange: (nodeId: string) => void;
  gender: "M" | "F";
  label: string;
  excludeId?: string;
  noneLabel?: string;
  disabled?: boolean;
  placeholder?: string;
}

function useDebouncedValue<T>(value: T, delay: number, enabled: boolean): T {
  const [debounced, setDebounced] = useState(value);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDebounced(value);
      return;
    }
    ref.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (ref.current) clearTimeout(ref.current);
      ref.current = null;
    };
  }, [value, delay, enabled]);

  return debounced;
}

export function ParentSelect({
  treeId,
  value,
  onChange,
  gender,
  label,
  excludeId,
  noneLabel = "None",
  disabled,
  placeholder,
}: ParentSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(
    search,
    DEBOUNCE_MS,
    open
  );
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  const filters = useMemo(
    () => (open ? { gender, search: debouncedSearch.trim() || undefined } : undefined),
    [open, gender, debouncedSearch]
  );
  const { data, isLoading } = useFamilyTreeNodes(open ? treeId : null, filters);

  const options = useMemo(() => {
    const list = data ?? [];
    return excludeId ? list.filter((n) => n.id !== excludeId) : list;
  }, [data, excludeId]);

  const selectedNode = useMemo(
    () => options.find((n) => n.id === value),
    [options, value]
  );

  const displayLabel = selectedNode
    ? `${selectedNode.firstName} ${selectedNode.lastName ?? ""}`.trim()
    : selectedLabel || placeholder || label;

  const handleSelect = useCallback(
    (id: string) => {
      if (id === "") {
        setSelectedLabel("");
        onChange("");
      } else {
        const node = options.find((n) => n.id === id);
        setSelectedLabel(
          node ? `${node.firstName} ${node.lastName ?? ""}`.trim() : ""
        );
        onChange(id);
      }
      setSearch("");
      setOpen(false);
    },
    [onChange, options]
  );

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    if (value && selectedNode) {
      setSelectedLabel(
        `${selectedNode.firstName} ${selectedNode.lastName ?? ""}`.trim()
      );
    }
    if (!value) setSelectedLabel("");
  }, [value, selectedNode]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !displayLabel && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {displayLabel || placeholder || noneLabel}
            </span>
            <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-2 border-b">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoComplete="off"
            />
          </div>
          <ScrollArea
            className="h-60"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="p-1">
              <button
                type="button"
                className={cn(
                  "flex w-full cursor-default items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  !value && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSelect("")}
              >
                {noneLabel}
              </button>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                options.map((n) => {
                  const name = `${n.firstName} ${n.lastName ?? ""}`.trim();
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className={cn(
                        "flex w-full cursor-default items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        value === n.id && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleSelect(n.id)}
                    >
                      {name}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
