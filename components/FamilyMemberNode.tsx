"use client";

import { BlurredImage } from "@/components/BlurredImage";
import { useImageLightbox } from "@/components/ImageLightboxProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { User } from "lucide-react";

export type FamilyMemberNodeData = {
  firstName: string;
  photo: string | null;
  nodeId: string;
};

export function FamilyMemberNode({
  data,
}: NodeProps & { data: FamilyMemberNodeData }) {
  const { openLightbox } = useImageLightbox();

  return (
    <div className="flex w-[120px] flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <Handle type="target" position={Position.Top} className="!bg-zinc-400" />
      {data.photo ? (
        <button
          type="button"
          className="block h-14 w-14 cursor-pointer overflow-hidden rounded-full outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          onClick={(e) => {
            e.stopPropagation();
            openLightbox(data.photo!, data.firstName);
          }}
        >
          <BlurredImage
            src={data.photo}
            alt={data.firstName}
            wrapperClassName="rounded-full"
            className="rounded-full"
          />
        </button>
      ) : (
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
            <User className="h-6 w-6 text-zinc-400" />
          </AvatarFallback>
        </Avatar>
      )}
      <span className="max-w-full truncate text-center text-xs font-medium text-zinc-900 dark:text-zinc-100">
        {data.firstName}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-zinc-400"
      />
    </div>
  );
}
