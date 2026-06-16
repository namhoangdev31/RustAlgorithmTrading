import {
  buildDependencyGraph,
  findWorkspaceDirs,
  type DependencyNode,
} from "@/lib/server/native-platform/monorepo";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParallelGroup {
  level: number;
  packages: string[];
}

export interface DependencyAnalysis {
  topologicalOrder: string[];
  parallelGroups: ParallelGroup[];
  affectedPackages: string[];
  mermaidDiagram: string;
  hasCycles: boolean;
  cycles: string[][];
}

// ---------------------------------------------------------------------------
// Topological Sort (Kahn's Algorithm)
// ---------------------------------------------------------------------------

/**
 * Compute a topological ordering of the dependency graph using Kahn's
 * algorithm. Detects cycles and returns the offending paths when found.
 */
export function topologicalSort(graph: Record<string, string[]>): {
  sorted: string[];
  hasCycles: boolean;
  cycles: string[][];
} {
  const nodes = Object.keys(graph);
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};

  // Initialise
  for (const node of nodes) {
    inDegree[node] = 0;
    adjacency[node] = [];
  }

  // Build adjacency list and compute in-degree.
  // graph[A] = [B, C] means A depends on B and C  →  edges B→A, C→A
  for (const node of nodes) {
    for (const dep of graph[node] || []) {
      if (!(dep in inDegree)) {
        inDegree[dep] = 0;
        adjacency[dep] = [];
      }
      adjacency[dep].push(node);
      inDegree[node]++;
    }
  }

  // BFS from nodes with in-degree 0
  const queue: string[] = [];
  for (const node of Object.keys(inDegree)) {
    if (inDegree[node] === 0) queue.push(node);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const dependent of adjacency[current] || []) {
      inDegree[dependent]--;
      if (inDegree[dependent] === 0) {
        queue.push(dependent);
      }
    }
  }

  // Detect cycles
  const remaining = Object.keys(inDegree).filter((n) => inDegree[n] > 0);
  if (remaining.length === 0) {
    return { sorted, hasCycles: false, cycles: [] };
  }

  // Find actual cycle paths via Tarjan's SCC
  const cycles = findTarjanSCC(graph);
  return { sorted, hasCycles: true, cycles };
}

export function findTarjanSCC(graph: Record<string, string[]>): string[][] {
  const nodes = Object.keys(graph);
  let indexCounter = 0;
  const indices: Record<string, number> = {};
  const lowlinks: Record<string, number> = {};
  const stack: string[] = [];
  const onStack = new Set<string>();
  const sccs: string[][] = [];

  function strongConnect(node: string) {
    indices[node] = indexCounter;
    lowlinks[node] = indexCounter;
    indexCounter++;
    stack.push(node);
    onStack.add(node);

    const deps = graph[node] || [];
    for (const dep of deps) {
      if (indices[dep] === undefined) {
        strongConnect(dep);
        lowlinks[node] = Math.min(lowlinks[node], lowlinks[dep]);
      } else if (onStack.has(dep)) {
        lowlinks[node] = Math.min(lowlinks[node], indices[dep]);
      }
    }

    if (lowlinks[node] === indices[node]) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== node);
      
      if (scc.length > 1 || (scc.length === 1 && (graph[scc[0]] || []).includes(scc[0]))) {
        sccs.push(scc);
      }
    }
  }

  for (const node of nodes) {
    if (indices[node] === undefined) {
      strongConnect(node);
    }
  }

  return sccs;
}

// ---------------------------------------------------------------------------
// Parallel Build Groups
// ---------------------------------------------------------------------------

/**
 * Group packages into parallel-build levels.
 * Level 0 contains packages with no internal dependencies (can build first).
 * Level N contains packages whose dependencies are all in levels < N.
 */
export function getParallelGroups(graph: Record<string, string[]>): ParallelGroup[] {
  const nodes = Object.keys(graph);
  const levels: Record<string, number> = {};
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};

  for (const node of nodes) {
    inDegree[node] = 0;
    adjacency[node] = [];
  }

  for (const node of nodes) {
    for (const dep of graph[node] || []) {
      if (!(dep in inDegree)) {
        inDegree[dep] = 0;
        adjacency[dep] = [];
      }
      adjacency[dep].push(node);
      inDegree[node]++;
    }
  }

  // BFS with level tracking
  const queue: Array<{ node: string; level: number }> = [];
  for (const node of Object.keys(inDegree)) {
    if (inDegree[node] === 0) {
      queue.push({ node, level: 0 });
      levels[node] = 0;
    }
  }

  while (queue.length > 0) {
    const { node, level } = queue.shift()!;

    for (const dependent of adjacency[node] || []) {
      inDegree[dependent]--;
      const nextLevel = level + 1;
      levels[dependent] = Math.max(levels[dependent] || 0, nextLevel);

      if (inDegree[dependent] === 0) {
        queue.push({ node: dependent, level: levels[dependent] });
      }
    }
  }

  // Group by level
  const groupMap = new Map<number, string[]>();
  for (const [node, level] of Object.entries(levels)) {
    if (!groupMap.has(level)) groupMap.set(level, []);
    groupMap.get(level)!.push(node);
  }

  const groups: ParallelGroup[] = [];
  for (const [level, packages] of Array.from(groupMap.entries()).sort((a, b) => a[0] - b[0])) {
    groups.push({ level, packages: packages.sort() });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Affected Package Detection
// ---------------------------------------------------------------------------

/**
 * Given a list of changed packages (from Git diff), compute the full set of
 * downstream packages that must be rebuilt (transitive closure via reverse
 * dependency graph).
 */
export function getAffectedPackages(
  graph: Record<string, string[]>,
  changedPackages: string[]
): string[] {
  // Build reverse graph: dependents of each package
  const reverse: Record<string, string[]> = {};
  for (const node of Object.keys(graph)) {
    reverse[node] = [];
  }
  for (const node of Object.keys(graph)) {
    for (const dep of graph[node] || []) {
      if (!reverse[dep]) reverse[dep] = [];
      reverse[dep].push(node);
    }
  }

  // BFS from changed packages through reverse graph
  const affected = new Set<string>(changedPackages);
  const queue = [...changedPackages];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const dependent of reverse[current] || []) {
      if (!affected.has(dependent)) {
        affected.add(dependent);
        queue.push(dependent);
      }
    }
  }

  return Array.from(affected);
}

// ---------------------------------------------------------------------------
// Mermaid Diagram
// ---------------------------------------------------------------------------

/** Generate a Mermaid flowchart visualising the dependency graph. */
export function generateMermaidDiagram(
  graph: Record<string, string[]>,
  packages: Record<string, DependencyNode>
): string {
  const sanitize = (name: string) => name.replace(/[@/]/g, "_").replace(/-/g, "_");

  const lines: string[] = ["graph TD"];

  // Define nodes
  for (const [name, node] of Object.entries(packages)) {
    const id = sanitize(name);
    lines.push(`  ${id}["${name}"]`);
  }

  // Draw edges (dependency → package)
  for (const [name, deps] of Object.entries(graph)) {
    const targetId = sanitize(name);
    for (const dep of deps) {
      const sourceId = sanitize(dep);
      lines.push(`  ${sourceId} --> ${targetId}`);
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// High-level analyser
// ---------------------------------------------------------------------------

/**
 * Full monorepo dependency analysis: topological sort, parallel build groups,
 * affected-package detection, cycle detection, and Mermaid visualisation.
 */
export async function analyzeMonorepo(
  rootDir: string,
  workspacePatterns: string[],
  changedPackages?: string[]
): Promise<DependencyAnalysis> {
  const { packages, graph } = await buildDependencyGraph(rootDir, workspacePatterns);

  const { sorted, hasCycles, cycles } = topologicalSort(graph);
  const parallelGroups = getParallelGroups(graph);
  const affected = changedPackages ? getAffectedPackages(graph, changedPackages) : [];
  const mermaidDiagram = generateMermaidDiagram(graph, packages);

  return {
    topologicalOrder: sorted,
    parallelGroups,
    affectedPackages: affected,
    mermaidDiagram,
    hasCycles,
    cycles,
  };
}
