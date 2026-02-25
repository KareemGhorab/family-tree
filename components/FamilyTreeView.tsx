"use client";

import { api } from "@/app/service/api";
import {
    useFamilyTree,
    useTreeRole,
} from "@/app/service/family-tree/tree/hooks";
import { queryKeys, type FamilyNodeNested } from "@/app/service/types";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { FamilyMemberNode } from "@/components/FamilyMemberNode";
import { NodeDetailDialog } from "@/components/NodeDetailDialog";
import { Button } from "@/components/ui/button";
import { getQueryErrorMessage } from "@/lib/query-error";
import Dagre from "@dagrejs/dagre";
import { useQueryClient } from "@tanstack/react-query";
import {
    Background,
    Controls,
    ReactFlow,
    type Connection,
    type Edge,
    type Node,
    type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const NODE_WIDTH = 120;
const NODE_HEIGHT = 100;

const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNode,
};

function flattenNestedNodes(roots: FamilyNodeNested[]): FamilyNodeNested[] {
  const out: FamilyNodeNested[] = [];
  function visit(node: FamilyNodeNested) {
    out.push(node);
    for (const child of node.children) visit(child);
  }
  for (const root of roots) visit(root);
  return out;
}

function buildFlowDataFromNested(roots: FamilyNodeNested[]): {
  nodes: Node[];
  edges: Edge[];
  flatNodes: FamilyNodeNested[];
} {
  const flatNodes = flattenNestedNodes(roots);
  const rfNodes: Node[] = flatNodes.map((n) => ({
    id: n.id,
    type: "familyMember",
    position: { x: 0, y: 0 },
    data: {
      firstName: n.firstName,
      photo: n.photos[0]?.blobUrl ?? null,
      nodeId: n.id,
    },
  }));

  const rfEdges: Edge[] = [];
  for (const n of flatNodes) {
    if (n.motherId) {
      rfEdges.push({
        id: `e-mother-${n.id}`,
        source: n.motherId,
        target: n.id,
        type: "smoothstep",
      });
    }
    if (n.fatherId) {
      rfEdges.push({
        id: `e-father-${n.id}`,
        source: n.fatherId,
        target: n.id,
        type: "smoothstep",
      });
    }
  }

  const { nodes, edges } = layoutWithDagre(rfNodes, rfEdges);
  return { nodes, edges, flatNodes };
}

function layoutWithDagre(nodes: Node[], edges: Edge[]) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 120 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  Dagre.layout(g);

  const positioned = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: positioned, edges };
}

interface FamilyTreeViewProps {
  treeId: string;
}

export function FamilyTreeView({ treeId }: FamilyTreeViewProps) {
  const t = useTranslations("trees");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { data: treeData, isLoading } = useFamilyTree(treeId);
  const { data: roleData } = useTreeRole(treeId);
  const isEditor = roleData?.role === "EDITOR";

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { nodes, edges, flatNodes } = useMemo(
    () => buildFlowDataFromNested(treeData?.roots ?? []),
    [treeData?.roots]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isEditor || !flatNodes.length) return;

      const sourceNode = flatNodes.find((n) => n.id === connection.source);
      const targetNode = flatNodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      const gender = sourceNode.gender;
      if (!gender) {
        toast.error(t("setGenderFirst"));
        return;
      }

      const field = gender === "M" ? "fatherId" : "motherId";

      api
        .patch(`/api/family-node/${targetNode.id}`, { [field]: sourceNode.id })
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.familyTree.detail(treeId),
          });
        })
        .catch((err) => {
          toast.error(getQueryErrorMessage(err));
        });
    },
    [isEditor, flatNodes, treeId, queryClient, t]
  );

  if (isLoading) {
    return (
      <div className="tree-view-height flex min-h-0 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-500">{tCommon("loading")}</span>
      </div>
    );
  }

  return (
    <div className="tree-view-height relative min-h-0 w-full overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onConnect={isEditor ? onConnect : undefined}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        className="h-full w-full"
      >
        <Background />
        <Controls />
      </ReactFlow>

      {isEditor && (
        <Button
          className="absolute right-6 z-10 h-12 w-12 rounded-full shadow-lg [bottom:max(1.5rem,env(safe-area-inset-bottom))]"
          size="icon"
          onClick={() => setAddDialogOpen(true)}
          aria-label={t("addMember")}
          title={t("addMember")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <NodeDetailDialog
        nodeId={selectedNodeId}
        treeId={treeId}
        isEditor={isEditor}
        open={!!selectedNodeId}
        onClose={() => setSelectedNodeId(null)}
      />

      {isEditor && (
        <AddMemberDialog
          treeId={treeId}
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
        />
      )}
    </div>
  );
}
