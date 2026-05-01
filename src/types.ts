export type NodeType = 'start' | 'end' | 'process' | 'decision' | 'io' | 'preparation' | 'display' | 'manual_input' | 'loop_start' | 'loop_end';

export interface FlowNodeStyle {
  bg?: string;
  color?: string;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  text: string;
  level: number;
  column: number;
  style?: FlowNodeStyle;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export type ArrowheadVisibility = 'always' | 'only_merge' | 'none';

export interface FlowGraphConfig {
  arrowhead: ArrowheadVisibility;
  fontSize: number;
  spacingX: number;
  spacingY: number;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  config: FlowGraphConfig;
}
