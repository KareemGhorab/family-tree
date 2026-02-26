"use client";

import { api } from "@/app/service/api";
import { useTreeRole } from "@/app/service/family-tree/tree/hooks";
import { useFamilyTreeNodes } from "@/app/service/family-tree/tree/nodes/hooks";
import { queryKeys, type FamilyNodeFlat } from "@/app/service/types";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { FamilyMemberNode } from "@/components/FamilyMemberNode";
import { NodeDetailDialog } from "@/components/NodeDetailDialog";
import { Button } from "@/components/ui/button";
import { getQueryErrorMessage } from "@/lib/query-error";
import { useQueryClient } from "@tanstack/react-query";
import {
    Background,
    ReactFlow,
    type Connection,
    type Edge,
    type Node,
    type NodeTypes,
    type ReactFlowInstance,
    type Viewport
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const NODE_WIDTH = 120;
const NODE_HEIGHT = 100;

const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNode,
};

function buildFlowDataFromFlat(flatNodesInput: FamilyNodeFlat[]): {
  nodes: Node[];
  edges: Edge[];
  flatNodes: FamilyNodeFlat[];
} {
  const seen = new Set<string>();
  const flatNodes: FamilyNodeFlat[] = [];
  for (const n of flatNodesInput) {
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
  flatNodes: FamilyNodeFlat[],
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
  flatNodes: FamilyNodeFlat[],
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
        "elk.spacing.nodeNode": "100",
        "elk.layered.spacing.baseValue": "130",
        "elk.layered.mergeEdges": "false",
        "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
        "elk.layered.crossingMinimization.greedySwitch.type": "TWO_SIDED",
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "elk.layered.thoroughness": "80",
        "elk.separateConnectedComponents": "false",
        "elk.edgeRouting": "ORTHOGONAL",
        "elk.hierarchyHandling": "INCLUDE_CHILDREN",
        "elk.spacing.edgeEdge": "20",
        "elk.layered.spacing.edgeEdgeBetweenLayers": "50",
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

  const positionedEdges = edges.map((rfEdge) => {
    const elkEdge = layout.edges?.find((e) => e.id === rfEdge.id);
    if (!elkEdge || !elkEdge.sections || elkEdge.sections.length === 0) {
      return rfEdge;
    }

    return {
      ...rfEdge,
      type: "elkEdge",
      data: {
        ...rfEdge.data,
        sections: elkEdge.sections,
      },
    };
  });

  return { nodes: positioned, edges: positionedEdges };
}

interface FamilyTreeViewProps {
  treeId: string;
}

export function FamilyTreeView({ treeId }: FamilyTreeViewProps) {
  const t = useTranslations("trees");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { data: nodesData, isLoading } = useFamilyTreeNodes(treeId);
  const { data: roleData } = useTreeRole(treeId);
  const isEditor = roleData?.role === "EDITOR";

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const moveSamplesRef = useRef<{ viewport: Viewport; time: number }[]>([]);
  const inertiaRafRef = useRef<number | null>(null);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    flowInstanceRef.current = instance;
  }, []);

  const onMoveStart = useCallback(() => {
    if (inertiaRafRef.current != null) {
      cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
  }, []);

  const onMove = useCallback((_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    if (_event != null) {
      const samples = moveSamplesRef.current;
      samples.push({ viewport: { ...viewport }, time: performance.now() });
      if (samples.length > 8) samples.shift();
    }
  }, []);

  const onMoveEnd = useCallback((event: MouseEvent | TouchEvent | null) => {
    if (event == null || !flowInstanceRef.current) return;
    const samples = moveSamplesRef.current;
    if (samples.length < 2) return;

    const a = samples[samples.length - 2];
    const b = samples[samples.length - 1];
    if (performance.now() - b.time > 100) return;
    const zoomDelta = Math.abs(b.viewport.zoom - a.viewport.zoom);
    if (zoomDelta > 0.001) return;

    const dt = (b.time - a.time) / 1000;
    if (dt <= 0) return;

    let vx = (b.viewport.x - a.viewport.x) / dt;
    let vy = (b.viewport.y - a.viewport.y) / dt;
    const velocityScale = 0.95;
    vx *= velocityScale;
    vy *= velocityScale;
    const maxSpeed = 1800;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      vx *= scale;
      vy *= scale;
    }

    const FRICTION = 0.82;
    const MIN_VELOCITY = 12;

    let viewport: Viewport = { ...b.viewport };
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;

      viewport = {
        x: viewport.x + vx * elapsed,
        y: viewport.y + vy * elapsed,
        zoom: viewport.zoom,
      };
      const frictionMultiplier = Math.pow(FRICTION, elapsed * 60);
      vx *= frictionMultiplier;
      vy *= frictionMultiplier;

      if (Math.abs(vx) < MIN_VELOCITY && Math.abs(vy) < MIN_VELOCITY) return;
      flowInstanceRef.current?.setViewport(viewport);
      inertiaRafRef.current = requestAnimationFrame(tick);
    };
    inertiaRafRef.current = requestAnimationFrame(tick);
  }, []);

  const {
    nodes: rawNodes,
    edges: rawEdges,
    flatNodes,
  } = useMemo(
    () => buildFlowDataFromFlat(nodesData ?? []),
    [nodesData],
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
            queryKey: queryKeys.familyTree.nodes(treeId),
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
        onInit={onInit}
        onMove={onMove}
        onMoveStart={onMoveStart}
        onMoveEnd={onMoveEnd}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.01}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        className="h-full w-full"
      >
        <Background />
      </ReactFlow>

      {isEditor && (
        <Button
          className="fixed right-6 z-[60] h-12 w-12 rounded-full shadow-lg [bottom:max(1.5rem,env(safe-area-inset-bottom))]"
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
