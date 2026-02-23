export type Owner = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export type FamilyTreeListItem = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: Owner;
};

export type Photo = {
  id: string;
  familyNodeId: string;
  blobUrl: string;
  order: number | null;
  createdAt: string;
};

export type FamilyNodeNested = {
  id: string;
  familyTreeId: string;
  firstName: string;
  lastName: string | null;
  birthDate: string | null;
  deathDate: string | null;
  bio: string | null;
  birthOrder: number | null;
  motherId: string | null;
  fatherId: string | null;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
  children: FamilyNodeNested[];
};

export type FamilyTreeWithRoots = FamilyTreeListItem & {
  roots: FamilyNodeNested[];
};

export type FamilyNodeFlat = Omit<FamilyNodeNested, "children">;

export type FamilyTree = Omit<FamilyTreeListItem, "owner">;

export type FamilyNodeMotherFather = {
  id: string;
  firstName: string;
  lastName: string | null;
};

export type FamilyNodeDetail = Omit<FamilyNodeFlat, "children"> & {
  mother: FamilyNodeMotherFather | null;
  father: FamilyNodeMotherFather | null;
};

// Query key factory
export const queryKeys = {
  familyTree: {
    all: ["family-tree"] as const,
    list: () => [...queryKeys.familyTree.all] as const,
    detail: (id: string) => [...queryKeys.familyTree.all, id] as const,
    nodes: (treeId: string) =>
      [...queryKeys.familyTree.all, treeId, "nodes"] as const,
  },
  familyNode: {
    all: ["family-node"] as const,
    detail: (id: string) => [...queryKeys.familyNode.all, id] as const,
  },
} as const;
