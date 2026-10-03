import type { CDPSession } from '@playwright/test';

type Heap = {
  snapshot: {
    meta: {
      node_fields: string[];
      node_types: unknown[];
      edge_fields: string[];
      edge_types: unknown[];
    };
  };
  nodes: number[];
  edges: number[];
  strings: string[];
};

// Retain aggregate evidence, not a full browser heap export.
export async function summarizeHeap(
  protocol: CDPSession,
  ownerNames: Record<string, string | null>,
) {
  const chunks: string[] = [];
  const receive = (event: { chunk: string }) => chunks.push(event.chunk);
  protocol.on('HeapProfiler.addHeapSnapshotChunk', receive);
  let heap: Heap;
  try {
    await protocol.send('HeapProfiler.takeHeapSnapshot', {
      reportProgress: false,
    });
    heap = JSON.parse(chunks.join('')) as Heap;
  } finally {
    protocol.off('HeapProfiler.addHeapSnapshotChunk', receive);
    chunks.length = 0;
  }
  const fields = heap.snapshot.meta.node_fields,
    stride = fields.length,
    nameIndex = fields.indexOf('name'),
    typeIndex = fields.indexOf('type'),
    sizeIndex = fields.indexOf('self_size'),
    countIndex = fields.indexOf('edge_count'),
    nodeTypes = heap.snapshot.meta.node_types[0] as string[],
    edgeFields = heap.snapshot.meta.edge_fields,
    edgeStride = edgeFields.length,
    edgeTypeIndex = edgeFields.indexOf('type'),
    edgeNameIndex = edgeFields.indexOf('name_or_index'),
    edgeTargetIndex = edgeFields.indexOf('to_node'),
    edgeTypes = heap.snapshot.meta.edge_types[0] as string[],
    nodeCount = heap.nodes.length / stride,
    edgeOffsets = new Uint32Array(nodeCount),
    totals: Record<string, { count: number; bytes: number }> = {},
    nativeObjects: Record<string, number> = {},
    targets: Record<string, number[]> = {};
  const nodeName = (node: number) =>
    heap.strings[heap.nodes[node * stride + nameIndex] ?? 0] ?? '';
  let edgeOffset = 0;
  for (let node = 0; node < nodeCount; node++) {
    const i = node * stride,
      name = nodeName(node),
      type = nodeTypes[heap.nodes[i + typeIndex] ?? 0] ?? 'unknown',
      size = heap.nodes[i + sizeIndex] ?? 0,
      key = type === 'object' || type === 'native' ? name : type;
    const total = totals[key] ?? { count: 0, bytes: 0 };
    total.count++;
    total.bytes += size;
    totals[key] = total;
    edgeOffsets[node] = edgeOffset;
    edgeOffset += (heap.nodes[i + countIndex] ?? 0) * edgeStride;
    if (
      (type === 'object' || type === 'native') &&
      /^(?:HTMLCanvasElement|WebGLRenderingContext|WebGL2RenderingContext|ResizeObserver|AudioBufferSourceNode|AudioContext)$/.test(
        name,
      )
    ) {
      nativeObjects[name] = (nativeObjects[name] ?? 0) + 1;
      const entries = (targets[name] ??= []);
      if (entries.length < 2) entries.push(node);
    }
  }
  // Find shortest root paths, ignoring weak edges. A path explains retention;
  // native browser roots and a live app cache are different owners.
  const parents = new Int32Array(nodeCount).fill(-1),
    labels: string[] = [],
    queue = [0];
  parents[0] = -2;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const node = queue[cursor]!;
    const begin = edgeOffsets[node]!,
      end = begin + (heap.nodes[node * stride + countIndex] ?? 0) * edgeStride;
    for (let edge = begin; edge < end; edge += edgeStride) {
      const type = edgeTypes[heap.edges[edge + edgeTypeIndex] ?? 0];
      if (type === 'weak') continue;
      const target = (heap.edges[edge + edgeTargetIndex] ?? 0) / stride;
      if (parents[target] !== -1) continue;
      parents[target] = node;
      const name = heap.edges[edge + edgeNameIndex] ?? 0;
      labels[target] =
        type === 'element' || type === 'hidden'
          ? String(name)
          : (heap.strings[name] ?? '');
      queue.push(target);
    }
  }
  const rootPaths = Object.fromEntries(
    Object.entries(targets).map(([name, nodes]) => [
      name,
      nodes.map((node) => {
        const path: string[] = [];
        let current = node;
        while (current >= 0 && parents[current] !== -1 && path.length < 16) {
          path.unshift(`${labels[current] ?? ''} → ${nodeName(current)}`);
          current = parents[current]!;
        }
        return {
          strongRootFound: parents[node] !== -1,
          truncated: current >= 0,
          path,
        };
      }),
    ]),
  );
  const roles = Object.entries(ownerNames).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return {
    nativeObjects,
    representativeRootPaths: rootPaths,
    ownerObjects: Object.fromEntries(
      roles.map(([role, name]) => [
        role,
        {
          name,
          ambiguous: roles.filter((entry) => entry[1] === name).length > 1,
          count: totals[name]?.count ?? 0,
          bytes: totals[name]?.bytes ?? 0,
        },
      ]),
    ),
    categories: Object.entries(totals)
      .sort((a, b) => b[1].bytes - a[1].bytes)
      .slice(0, 30)
      .map(([name, values]) => ({ name, ...values })),
  };
}
