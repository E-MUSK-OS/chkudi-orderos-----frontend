import { navItems, NavItem } from "@/constants/navigation";
import type { ClientConfigTreeNode } from "../types/clientConfiguration.types";

/**
 * Cleanly generates a deterministic identifier from a route href or label.
 */
export function generateNodeId(item: NavItem, parentId = "", isRoot = false): string {
  if (isRoot) {
    return item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  }
  if (item.href) {
    const trimmed = item.href
      .replace(/^\/dashboard\/?/, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/_+$/, "")
      .toLowerCase();
    if (trimmed && trimmed !== parentId) {
      return trimmed;
    }
  }
  const cleanLabel = item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return parentId ? `${parentId}_${cleanLabel}` : cleanLabel;
}

/**
 * Recursively converts a dynamic NavItem from navItems into a ClientConfigTreeNode.
 * Only processes real, active pages present in navigation.ts.
 */
export function convertNavItemToTreeNode(
  item: NavItem,
  parentId = "",
  isRoot = false
): ClientConfigTreeNode {
  const id = generateNodeId(item, parentId, isRoot);

  // Recursively process children, filtering out the configuration page itself
  // so admins cannot accidentally lock themselves out of the configuration page.
  let children: ClientConfigTreeNode[] | undefined = undefined;
  if (item.children && item.children.length > 0) {
    const validChildren = item.children.filter((c) => {
      const lower = c.label.toLowerCase();
      const href = c.href?.toLowerCase() || "";
      return !lower.includes("configuration") && !href.includes("settings/configuration");
    });

    if (validChildren.length > 0) {
      children = validChildren.map((c) => convertNavItemToTreeNode(c, id, false));
    }
  }

  return {
    id,
    label: item.label,
    path: item.href,
    checked: true,
    indeterminate: false,
    isSection: isRoot,
    children,
  };
}

/**
 * Recursively applies saved state map ({ [id]: boolean }) to tree nodes.
 * Inherits parent disabled state if a newly added child node does not exist in savedStateMap yet.
 */
function applySavedStateToNode(
  node: ClientConfigTreeNode,
  savedStateMap: Record<string, boolean>,
  parentDisabled = false
) {
  const isExplicitlyDisabled = savedStateMap[node.id] === false || parentDisabled;

  // If leaf node, apply directly from map
  if (!node.children || node.children.length === 0) {
    if (typeof savedStateMap[node.id] === "boolean") {
      node.checked = savedStateMap[node.id];
    } else if (parentDisabled) {
      node.checked = false;
    }
    return;
  }

  // If node has children, apply recursively to children first
  node.children.forEach((child) =>
    applySavedStateToNode(child, savedStateMap, isExplicitlyDisabled)
  );

  const allChecked = node.children.every((c) => c.checked);
  const someChecked = node.children.some((c) => c.checked || c.indeterminate);

  node.checked = allChecked;
  node.indeterminate = !allChecked && someChecked;
}

/**
 * Builds the dynamic 3-column configuration tree directly from real pages in navItems.
 * Any new page or module added to `navItems` in navigation.ts automatically appears here!
 */
export function buildDynamicClientConfigTree(
  savedStateMap?: Record<string, boolean> | null
): { column1: ClientConfigTreeNode[]; column2: ClientConfigTreeNode[]; column3: ClientConfigTreeNode[] } {
  // Convert all real items in navItems to tree nodes
  const rootSections: ClientConfigTreeNode[] = navItems.map((item) =>
    convertNavItemToTreeNode(item, "", true)
  );

  // Apply saved state if present
  if (savedStateMap) {
    rootSections.forEach((section) => applySavedStateToNode(section, savedStateMap));
  }

  // Canonical distribution of existing sections across 3 columns:
  // Column 1: Dashboard, VMS, Products
  // Column 2: Order Process, Products Analytics, Transaction
  // Column 3: Offline Sales, Purchase, Settings
  const sectionMap: Record<string, ClientConfigTreeNode> = {};
  const unassigned: ClientConfigTreeNode[] = [];

  for (const sec of rootSections) {
    const key = sec.label.toLowerCase().replace(/\s+/g, "-");
    sectionMap[key] = sec;
    sectionMap[sec.id] = sec;
    sectionMap[sec.label.toLowerCase().replace(/\s+/g, "_")] = sec;
  }

  const column1: ClientConfigTreeNode[] = [
    sectionMap["dashboard"],
    sectionMap["vms"],
    sectionMap["products"],
  ].filter(Boolean);

  const column2: ClientConfigTreeNode[] = [
    sectionMap["order-process"],
    sectionMap["products-analytics"],
    sectionMap["transaction"],
  ].filter(Boolean);

  const column3: ClientConfigTreeNode[] = [
    sectionMap["offline-sales"],
    sectionMap["purchase"],
    sectionMap["settings"],
  ].filter(Boolean);

  // Any newly added sections beyond the standard set are dynamically distributed
  const standardKeys = new Set([
    "dashboard",
    "vms",
    "products",
    "order-process",
    "products-analytics",
    "transaction",
    "offline-sales",
    "purchase",
    "settings",
  ]);

  rootSections.forEach((sec) => {
    const key = sec.label.toLowerCase().replace(/\s+/g, "-");
    if (!standardKeys.has(key)) {
      unassigned.push(sec);
    }
  });

  // Distribute unassigned dynamically to keep columns balanced
  unassigned.forEach((sec, idx) => {
    if (idx % 3 === 0) column1.push(sec);
    else if (idx % 3 === 1) column2.push(sec);
    else column3.push(sec);
  });

  return { column1, column2, column3 };
}

/**
 * Calculates live statistics for top banner cards.
 */
export function calculateTreeStats(
  columns: { column1: ClientConfigTreeNode[]; column2: ClientConfigTreeNode[]; column3: ClientConfigTreeNode[] },
  planName = "Enterprise Plus"
) {
  const allSections = [...columns.column1, ...columns.column2, ...columns.column3];

  let selectedSections = 0;
  let totalSections = allSections.length;
  let grantedRoutes = 0;
  let totalRoutes = 0;

  const countLeafNodes = (node: ClientConfigTreeNode) => {
    if (!node.children || node.children.length === 0) {
      totalRoutes++;
      if (node.checked) grantedRoutes++;
    } else {
      node.children.forEach(countLeafNodes);
    }
  };

  for (const sec of allSections) {
    if (sec.checked || sec.indeterminate) {
      selectedSections++;
    }
    countLeafNodes(sec);
  }

  return {
    planName,
    selectedSections,
    totalSections,
    grantedRoutes,
    totalRoutes,
  };
}

/**
 * Recursively updates checkbox state when a user clicks a node in the tree.
 * Propagates down to all descendants and up to all ancestors.
 */
export function updateNodeCheckedState(
  node: ClientConfigTreeNode,
  targetId: string,
  newChecked: boolean
): boolean {
  if (node.id === targetId) {
    const setAllDescendants = (n: ClientConfigTreeNode, val: boolean) => {
      n.checked = val;
      n.indeterminate = false;
      if (n.children) {
        n.children.forEach((c) => setAllDescendants(c, val));
      }
    };
    setAllDescendants(node, newChecked);
    return true;
  }

  if (node.children) {
    let found = false;
    for (const child of node.children) {
      if (updateNodeCheckedState(child, targetId, newChecked)) {
        found = true;
        break;
      }
    }
    if (found) {
      const allChecked = node.children.every((c) => c.checked);
      const someChecked = node.children.some((c) => c.checked || c.indeterminate);
      node.checked = allChecked;
      node.indeterminate = !allChecked && someChecked;
      return true;
    }
  }

  return false;
}

/**
 * Select all or deselect all nodes in the tree in a single action.
 */
export function setAllTreeChecked(
  columns: { column1: ClientConfigTreeNode[]; column2: ClientConfigTreeNode[]; column3: ClientConfigTreeNode[] },
  newChecked: boolean
): { column1: ClientConfigTreeNode[]; column2: ClientConfigTreeNode[]; column3: ClientConfigTreeNode[] } {
  const setAll = (node: ClientConfigTreeNode) => {
    node.checked = newChecked;
    node.indeterminate = false;
    if (node.children) {
      node.children.forEach(setAll);
    }
  };

  const nextCol1 = JSON.parse(JSON.stringify(columns.column1));
  const nextCol2 = JSON.parse(JSON.stringify(columns.column2));
  const nextCol3 = JSON.parse(JSON.stringify(columns.column3));

  nextCol1.forEach(setAll);
  nextCol2.forEach(setAll);
  nextCol3.forEach(setAll);

  return { column1: nextCol1, column2: nextCol2, column3: nextCol3 };
}

/**
 * Flattens the tree into a map of `{ [nodeId]: boolean }`, list of enabled sections,
 * and list of enabled routes for API persistence.
 */
export function extractConfigPayload(columns: {
  column1: ClientConfigTreeNode[];
  column2: ClientConfigTreeNode[];
  column3: ClientConfigTreeNode[];
}): { enabledSections: string[]; enabledRoutes: string[]; configurationData: Record<string, boolean> } {
  const allSections = [...columns.column1, ...columns.column2, ...columns.column3];
  const configurationData: Record<string, boolean> = {};
  const enabledSections: string[] = [];
  const enabledRoutes: string[] = [];

  const traverse = (node: ClientConfigTreeNode, isRootSection = false) => {
    // A node is active if fully checked or indeterminate (has at least one active child)
    const isNodeActive = node.checked || Boolean(node.indeterminate);
    configurationData[node.id] = isNodeActive;

    if (isRootSection && isNodeActive) {
      enabledSections.push(node.id);
    }

    if (!node.children || node.children.length === 0) {
      if (node.checked) {
        enabledRoutes.push(node.path || node.id);
      }
    } else {
      node.children.forEach((c) => traverse(c, false));
    }
  };

  allSections.forEach((sec) => traverse(sec, true));

  return {
    enabledSections,
    enabledRoutes,
    configurationData,
  };
}
