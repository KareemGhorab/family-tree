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
import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const allNodes = flattenNestedNodes(roots);
  const seen = new Set<string>();
  const flatNodes: FamilyNodeNested[] = [];
  for (const n of allNodes) {
    if (!seen.has(n.id)) {
      seen.add(n.id);
      flatNodes.push(n);
    }
  }

  const nodeIds = new Set(flatNodes.map((n) => n.id));

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
  const seenEdges = new Set<string>();
  for (const n of flatNodes) {
    if (n.motherId && nodeIds.has(n.motherId)) {
      const edgeId = `e-mother-${n.id}`;
      if (!seenEdges.has(edgeId)) {
        seenEdges.add(edgeId);
        rfEdges.push({
          id: edgeId,
          source: n.motherId,
          target: n.id,
          type: "smoothstep",
        });
      }
    }
    if (n.fatherId && nodeIds.has(n.fatherId)) {
      const edgeId = `e-father-${n.id}`;
      if (!seenEdges.has(edgeId)) {
        seenEdges.add(edgeId);
        rfEdges.push({
          id: edgeId,
          source: n.fatherId,
          target: n.id,
          type: "smoothstep",
        });
      }
    }
  }

  return { nodes: rfNodes, edges: rfEdges, flatNodes };
}

function computeCouples(
  flatNodes: FamilyNodeNested[],
  nodeIds: Set<string>,
): {
  nodeIdToCouple: Map<string, string>;
  couplePairs: Map<string, [string, string]>;
} {
  const nodeIdToCouple = new Map<string, string>();
  const couplePairs = new Map<string, [string, string]>();

  for (const n of flatNodes) {
    if (!n.motherId || !n.fatherId || !nodeIds.has(n.motherId) || !nodeIds.has(n.fatherId))
      continue;
    const [a, b] = [n.motherId, n.fatherId].sort();
    const key = `${a}_${b}`;
    if (!couplePairs.has(key)) couplePairs.set(key, [a, b]);
    if (!nodeIdToCouple.has(n.motherId)) nodeIdToCouple.set(n.motherId, key);
    if (!nodeIdToCouple.has(n.fatherId)) nodeIdToCouple.set(n.fatherId, key);
  }

  return { nodeIdToCouple, couplePairs };
}

function makeElkPersonNode(id: string): ElkNode {
  return {
    id,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    ports: [
      { id: `${id}__south`, layoutOptions: { "port.side": "SOUTH", "port.index": "0" } },
      { id: `${id}__mother-in`, layoutOptions: { "port.side": "NORTH", "port.index": "0" } },
      { id: `${id}__father-in`, layoutOptions: { "port.side": "NORTH", "port.index": "1" } },
    ],
    layoutOptions: { portConstraints: "FIXED_SIDE" },
  };
}

function collectAbsolutePositions(
  elkNode: ElkNode,
  parentX: number,
  parentY: number,
  personIds: Set<string>,
  out: Map<string, { x: number; y: number }>,
): void {
  const x = parentX + (elkNode.x ?? 0);
  const y = parentY + (elkNode.y ?? 0);
  if (personIds.has(elkNode.id)) out.set(elkNode.id, { x, y });
  for (const child of elkNode.children ?? []) {
    collectAbsolutePositions(child, x, y, personIds, out);
  }
}

const elk = new ELK();

async function layoutWithElk(
  nodes: Node[],
  edges: Edge[],
  flatNodes: FamilyNodeNested[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const { nodeIdToCouple, couplePairs } = computeCouples(flatNodes, nodeIds);

  const rootChildren: ElkNode[] = [];

  for (const [key, [a, b]] of couplePairs) {
    if (!nodeIds.has(a) || !nodeIds.has(b)) continue;
    rootChildren.push({
      id: `couple-${key}`,
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT",
        "elk.spacing.nodeNode": "160",
      },
      children: [makeElkPersonNode(a), makeElkPersonNode(b)],
    });
  }

  for (const n of nodes) {
    if (nodeIdToCouple.has(n.id)) continue;
    rootChildren.push(makeElkPersonNode(n.id));
  }

  const elkGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "80",
      "elk.layered.spacing.baseValue": "120",
      "elk.layered.mergeEdges": "false",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.crossingMinimization.greedySwitch.type": "TWO_SIDED",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.thoroughness": "40",
      "elk.separateConnectedComponents": "false",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
    },
    children: rootChildren,
    edges: edges.map((e) => {
      const isMother = e.id.startsWith("e-mother-");
      return {
        id: e.id,
        sources: [`${e.source}__south`],
        targets: [
          isMother ? `${e.target}__mother-in` : `${e.target}__father-in`,
        ],
      };
    }),
  };

  const layout = await elk.layout(elkGraph);

  const positions = new Map<string, { x: number; y: number }>();
  for (const child of layout.children ?? []) {
    collectAbsolutePositions(child, 0, 0, nodeIds, positions);
  }

  const positioned = nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? { x: 0, y: 0 },
  }));

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

  const {
    nodes: rawNodes,
    edges: rawEdges,
    flatNodes,
  } = useMemo(
    () => buildFlowDataFromNested(treeData?.roots ?? []),
    [treeData?.roots],
  );

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!rawNodes.length) {
      setNodes([]);
      setEdges([]);
      return;
    }
    let cancelled = false;
    layoutWithElk(rawNodes, rawEdges, flatNodes)
      .then(({ nodes: n, edges: e }) => {
        if (!cancelled) {
          setNodes(n);
          setEdges(e);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNodes(rawNodes);
          setEdges(rawEdges);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [rawNodes, rawEdges, flatNodes]);

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
        minZoom={0.05}
        maxZoom={4}
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
