import { FlowGraph, FlowNode, FlowEdge, NodeType, ArrowheadVisibility } from '../types';

export function parseFlowchart(text: string): FlowGraph {
  const rawLines = text.split('\n').map(l => l.trim());
  let arrowheadConfig: ArrowheadVisibility = 'always';
  let fontSizeConfig: number = 11;
  let spacingXConfig: number = 220;
  let spacingYConfig: number = 120;

  rawLines.forEach(line => {
    if (line.match(/^#?\s*矢羽\s*[:：]\s*(しない|なし|none|false)/)) {
      arrowheadConfig = 'none';
    } else if (line.match(/^#?\s*矢羽\s*[:：]\s*(合流時.*|merge|only_merge)/)) {
      arrowheadConfig = 'only_merge';
    } else if (line.match(/^#?\s*矢羽\s*[:：]\s*(表示.*|あり|always|true)/)) {
      arrowheadConfig = 'always';
    }
    
    const fontSizeMatch = line.match(/^#?\s*文字サイズ\s*[:：]\s*(\d+)/);
    if (fontSizeMatch) {
      fontSizeConfig = parseInt(fontSizeMatch[1], 10);
    }

    const spacingXMatch = line.match(/^#?\s*(?:横)?間隔(?:X|x)?\s*[:：]\s*(\d+)/);
    if (spacingXMatch) {
      spacingXConfig = parseInt(spacingXMatch[1], 10);
    }
    
    const spacingYMatch = line.match(/^#?\s*(?:縦)?間隔(?:Y|y)?\s*[:：]\s*(\d+)/);
    if (spacingYMatch) {
      spacingYConfig = parseInt(spacingYMatch[1], 10);
    }
  });

  const lines = rawLines.filter(l => l.length > 0 && !l.startsWith('#') && !l.match(/^(?:矢羽|文字サイズ|(?:横|縦)?間隔(?:X|x|Y|y)?)\s*[:：]/));
  const nodes: Map<string, FlowNode> = new Map();
  const edges: FlowEdge[] = [];

  const typeMap: Record<string, NodeType> = {
    start: 'start',
    end: 'end',
    term: 'start',
    proc: 'process',
    process: 'process',
    dec: 'decision',
    decision: 'decision',
    io: 'io',
    input: 'manual_input',
    manual: 'manual_input',
    output: 'io',
    prep: 'preparation',
    display: 'display',
    disp: 'display',
    loop_s: 'loop_start',
    loop_e: 'loop_end'
  };

  // First pass: Find all nodes
  lines.forEach(line => {
    // Check for connection: id -> target (label)
    const edgeMatch = line.match(/^([\w\d]+)\s*->\s*([\w\d]+)(?:\s*\((.*)\))?$/);
    if (edgeMatch) {
      edges.push({
        from: edgeMatch[1],
        to: edgeMatch[2],
        label: edgeMatch[3]
      });
      return;
    }

    // Check for node definition: id: type text
    const nodeMatch = line.match(/^([\w\d]+)\s*:\s*(\w+)?\s*(.*)$/);
    if (nodeMatch) {
      const id = nodeMatch[1];
      const typeStr = (nodeMatch[2] || 'process').toLowerCase();
      const content = nodeMatch[3] || id;
      
      nodes.set(id, {
        id,
        type: typeMap[typeStr] || 'process',
        text: content,
        level: 0,
        column: 0
      });
    } else if (line.includes(':')) {
       // fallback for simple "id: text" where type is omitted
       const [id, ...rest] = line.split(':');
       const content = rest.join(':').trim();
       nodes.set(id.trim(), {
         id: id.trim(),
         type: 'process',
         text: content,
         level: 0,
         column: 0
       });
    }
  });

  // Basic Layout Algorithm (Simplified Sugiyama/Top-down)
  const nodeArray = Array.from(nodes.values());
  if (nodeArray.length === 0) return { nodes: [], edges: [], config: { arrowhead: arrowheadConfig, fontSize: fontSizeConfig, spacingX: spacingXConfig, spacingY: spacingYConfig } };

  const adj = new Map<string, string[]>();
  edges.forEach(e => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push(e.to);
  });

  const inDegree = new Map<string, number>();
  nodeArray.forEach(n => inDegree.set(n.id, 0));
  edges.forEach(e => inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1));

  const roots = nodeArray.filter(n => inDegree.get(n.id) === 0);
  if (roots.length === 0 && nodeArray.length > 0) roots.push(nodeArray[0]);

  // Detect Back-edges (DFS)
  const state = new Map<string, 'visiting' | 'visited'>();
  const backEdges = new Set<string>();

  const dfsBackEdge = (u: string) => {
    state.set(u, 'visiting');
    (adj.get(u) || []).forEach(v => {
      const vState = state.get(v);
      if (vState === 'visiting') {
         backEdges.add(`${u}->${v}`);
      } else if (vState !== 'visited') {
         dfsBackEdge(v);
      }
    });
    state.set(u, 'visited');
  };

  roots.forEach(r => dfsBackEdge(r.id));
  // If there are disconnected components, ensure they are checked
  nodeArray.forEach(n => {
    if (!state.has(n.id)) dfsBackEdge(n.id);
  });

  // Level assignment: longest path from roots (DAG)
  const levels = new Map<string, number>();
  roots.forEach(r => levels.set(r.id, 0));

  let changed = true;
  let iterations = 0;
  while (changed && iterations < 100) {
    changed = false;
    iterations++;
    edges.forEach(e => {
      if (backEdges.has(`${e.from}->${e.to}`)) return; // Ignore back edges
      const fromLevel = levels.get(e.from);
      if (fromLevel !== undefined) {
        // If "from" is processed, "to" should be at least fromLevel + 1
        const toLevel = levels.get(e.to) || 0;
        if (fromLevel + 1 > toLevel) {
          levels.set(e.to, fromLevel + 1);
          changed = true;
        }
      }
    });
  }

  nodeArray.forEach(n => {
    n.level = levels.get(n.id) || 0;
  });

  // Column Assignment: DFS to keep main flow in current column, branches pushing right
  const columnUsed = new Map<string, boolean>();
  const getFreeColumn = (level: number, startCol: number) => {
    let col = startCol;
    while (columnUsed.has(`${level},${col}`)) col++;
    return col;
  };

  const visitedNodes = new Set<string>();
  const assignColumnDfs = (nodeId: string, targetCol: number) => {
    if (visitedNodes.has(nodeId)) return;
    visitedNodes.add(nodeId);
    
    const node = nodes.get(nodeId);
    if (!node) return;
    
    const col = getFreeColumn(node.level, targetCol);
    node.column = col;
    columnUsed.set(`${node.level},${col}`, true);
    
    const children = (adj.get(nodeId) || []).filter(cId => !backEdges.has(`${nodeId}->${cId}`));
    
    // Sort children: "Yes", "Y", or empty label preferred for main flow (stays in same column)
    children.sort((aId, bId) => {
       const edgeA = edges.find(e => e.from === nodeId && e.to === aId);
       const edgeB = edges.find(e => e.from === nodeId && e.to === bId);
       
       const labelA = (edgeA?.label || '').trim().toLowerCase();
       const labelB = (edgeB?.label || '').trim().toLowerCase();
       
       const weight = (l: string) => {
         if (['yes', 'y', 'はい', 'ok', 'true', '1'].includes(l)) return 0;
         if (['no', 'n', 'いいえ', 'ng', 'false', '0'].includes(l)) return 2;
         if (l === '') return 1;
         return 3;
       };
       return weight(labelA) - weight(labelB);
    });
    
    let rightmostCol = col;
    children.forEach((childId, index) => {
       if (index === 0) {
           assignColumnDfs(childId, col);
       } else {
           let freeCol = rightmostCol + 1;
           let isOccupied = true;
           while (isOccupied) {
               isOccupied = false;
               for (let l = 0; l <= 100; l++) {
                   if (columnUsed.has(`${l},${freeCol}`)) {
                       isOccupied = true;
                       freeCol++;
                       break;
                   }
               }
           }
           rightmostCol = freeCol;
           assignColumnDfs(childId, freeCol);
       }
    });
  };

  roots.forEach((root, i) => assignColumnDfs(root.id, i * 2));
  
  nodeArray.forEach(n => {
    if (!visitedNodes.has(n.id)) {
      assignColumnDfs(n.id, 0);
    }
  });

  return {
    nodes: nodeArray,
    edges: edges.filter(e => nodes.has(e.from) && nodes.has(e.to)),
    config: {
      arrowhead: arrowheadConfig,
      fontSize: fontSizeConfig,
      spacingX: spacingXConfig,
      spacingY: spacingYConfig
    }
  };
}
