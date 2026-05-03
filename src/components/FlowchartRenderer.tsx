import React from 'react';
import { FlowGraph, FlowNode, NodeType } from '../types';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface Props {
  graph: FlowGraph;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const PADDING_X = 120;
const PADDING_Y = 60;

export const FlowchartRenderer: React.FC<Props> = ({ graph }) => {
  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-sans italic">
        構文を入力するとフローチャートが表示されます
      </div>
    );
  }

  const maxLevel = Math.max(...graph.nodes.map(n => n.level), 0);
  const maxColumn = Math.max(...graph.nodes.map(n => n.column), 0);

  const gridSizeX = graph.config?.spacingX ?? 260;
  const gridSizeY = graph.config?.spacingY ?? 160;

  const width = (maxColumn + 1) * gridSizeX + PADDING_X * 2;
  const height = (maxLevel + 1) * gridSizeY + PADDING_Y * 2;

  const getNodePos = (node: FlowNode) => ({
    x: PADDING_X + node.column * gridSizeX + (gridSizeX - NODE_WIDTH) / 2,
    y: PADDING_Y + node.level * gridSizeY + (gridSizeY - NODE_HEIGHT) / 2,
  });

  const renderShape = (node: FlowNode) => {
    const { x, y } = getNodePos(node);
    const w = NODE_WIDTH;
    const h = NODE_HEIGHT;
    const commonProps = {
      fill: node.style?.bg || "white",
      stroke: "#1e293b",
      strokeWidth: "2"
    };

    switch (node.type) {
      case 'start':
      case 'end':
        return <rect x={x} y={y} width={w} height={h} rx={h / 2} ry={h / 2} {...commonProps} />;
      
      case 'decision':
        return (
          <path
            d={`M ${x + w / 2} ${y} L ${x + w} ${y + h / 2} L ${x + w / 2} ${y + h} L ${x} ${y + h / 2} Z`}
            {...commonProps}
          />
        );
      
      case 'io':
        const offset = 20;
        return (
          <path
            d={`M ${x + offset} ${y} L ${x + w} ${y} L ${x + w - offset} ${y + h} L ${x} ${y + h} Z`}
            {...commonProps}
          />
        );

      case 'preparation':
        const pOffset = 15;
        return (
          <path
            d={`M ${x + pOffset} ${y} L ${x + w - pOffset} ${y} L ${x + w} ${y + h / 2} L ${x + w - pOffset} ${y + h} L ${x + pOffset} ${y + h} L ${x} ${y + h / 2} Z`}
            {...commonProps}
          />
        );

      case 'display':
        const dOff = 20;
        return (
          <path
            d={`M ${x + dOff} ${y} L ${x + w - dOff} ${y} Q ${x + w} ${y + h / 2} ${x + w - dOff} ${y + h} L ${x + dOff} ${y + h} L ${x} ${y + h / 2} Z`}
            {...commonProps}
          />
        );

      case 'manual_input':
        const mOff = 15;
        return (
          <path
            d={`M ${x} ${y + mOff} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`}
            {...commonProps}
          />
        );

      case 'loop_start':
        const lOff = 20;
        return (
          <path
            d={`M ${x + lOff} ${y} L ${x + w - lOff} ${y} L ${x + w} ${y + h / 3} L ${x + w} ${y + h} L ${x} ${y + h} L ${x} ${y + h / 3} Z`}
            {...commonProps}
          />
        );

      case 'loop_end':
        const leOff = 20;
        return (
          <path
            d={`M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h * 0.66} L ${x + w - leOff} ${y + h} L ${x + leOff} ${y + h} L ${x} ${y + h * 0.66} Z`}
            {...commonProps}
          />
        );

      case 'process':
      default:
        return <rect x={x} y={y} width={w} height={h} {...commonProps} />;
    }
  };

  const renderText = (node: FlowNode) => {
    const { x, y } = getNodePos(node);
    const lines = node.text.split(/\\n|\n/);
    const fontSize = graph.config?.fontSize || 11;
    const lineHeight = Math.round(fontSize * 1.3);
    const totalHeight = lines.length * lineHeight;
    const startY = y + (NODE_HEIGHT - totalHeight) / 2 + lineHeight / 2;

    return (
      <text
        x={x + NODE_WIDTH / 2}
        y={startY}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: 'sans-serif',
          fontSize: `${fontSize}px`,
          fontWeight: 500,
          fill: node.style?.color || '#0f172a',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={x + NODE_WIDTH / 2} dy={i === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <div className="w-full h-full bg-slate-50 relative overflow-hidden">
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={5}
        centerOnInit={true}
        limitToBounds={false}
        wheel={{ step: 0.1, activationKeys: ["Control", "Meta"] }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={() => zoomIn(0.25)}
                className="p-2 bg-white shadow-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors"
                title="拡大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => zoomOut(0.25)}
                className="p-2 bg-white shadow-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors"
                title="縮小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => resetTransform()}
                className="p-2 bg-white shadow-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors"
                title="全体表示"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
            <TransformComponent wrapperClass="!w-full !h-full cursor-grab active:cursor-grabbing">
              <div 
                style={{ 
                  width: Math.max(width, 1000), 
                  height: Math.max(height, 800),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px'
                }}
              >
                <svg
                  id="main-flowchart-svg"
                  width={width}
                  height={height}
                  viewBox={`0 0 ${width} ${height}`}
                  style={{
                    backgroundColor: '#f8fafc',
                    display: 'block'
                  }}
                >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#1e293b" />
          </marker>
        </defs>

        {/* Edges */}
        {graph.edges.map((edge, i) => {
          const fromNode = graph.nodes.find(n => n.id === edge.from);
          const toNode = graph.nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const incomingEdges = graph.edges.filter(e => e.to === toNode.id);
          const isMergeEdge = incomingEdges.length > 1;

          const start = getNodePos(fromNode);
          const end = getNodePos(toNode);

          // Calculate connection points
          let startX = start.x + NODE_WIDTH / 2;
          let startY = start.y + NODE_HEIGHT;
          let endX = end.x + NODE_WIDTH / 2;
          let endY = end.y;

          // If moving sideways or upwards, handle differently
          const isSideways = fromNode.level === toNode.level;
          const isUpwards = fromNode.level > toNode.level;

          let pathD = '';
          let tMergePathD = '';
          let tMergeDropPathD = '';
          let hasTMergeTail = false;
          let isStraightLine = false;
          let labelX = 0;
          let labelY = 0;
          let labelAnchor: 'start' | 'middle' | 'end' = 'middle';

          if (isSideways) {
            if (fromNode.column < toNode.column) {
              startX = start.x + NODE_WIDTH;
              startY = start.y + NODE_HEIGHT / 2;
              endX = end.x;
              endY = end.y + NODE_HEIGHT / 2;
              pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
              labelX = (startX + endX) / 2;
              labelY = startY - 10;
              labelAnchor = 'middle';
            } else {
              startX = start.x;
              startY = start.y + NODE_HEIGHT / 2;
              endX = end.x + NODE_WIDTH;
              endY = end.y + NODE_HEIGHT / 2;
              pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
              labelX = (startX + endX) / 2;
              labelY = startY - 10;
              labelAnchor = 'middle';
            }
          } else if (isUpwards) {
               // Loop back
               startY = start.y + NODE_HEIGHT / 2;
               endY = end.y + NODE_HEIGHT / 2;

               const minCol = Math.min(...graph.nodes.map(n => n.column));

               // Check if left-routing would cross any nodes at the same level or
               // any nodes at intermediate levels whose vertical edges would be crossed
               const wouldCrossGoingLeft =
                 graph.nodes.some(n => n.level === fromNode.level && n.column < fromNode.column) ||
                 graph.nodes.some(n => n.level === toNode.level && n.id !== toNode.id && n.column < toNode.column) ||
                 graph.nodes.some(n => n.level > toNode.level && n.level < fromNode.level && n.column < fromNode.column);

               if (wouldCrossGoingLeft) {
                 // Route right to avoid crossing
                 startX = start.x + NODE_WIDTH;
                 endX = end.x + NODE_WIDTH;
                 const routeX = PADDING_X + (maxColumn + 1) * gridSizeX + 80;
                 pathD = `M ${startX} ${startY} L ${routeX} ${startY} L ${routeX} ${endY} L ${endX} ${endY}`;
                 labelX = startX + 20;
                 labelY = startY - 10;
                 labelAnchor = 'start';
               } else {
                 // Route left (default)
                 startX = start.x;
                 endX = end.x;
                 const routeX = PADDING_X + minCol * gridSizeX - 80;
                 pathD = `M ${startX} ${startY} L ${routeX} ${startY} L ${routeX} ${endY} L ${endX} ${endY}`;
                 labelX = startX - 20;
                 labelY = startY - 10;
                 labelAnchor = 'end';
               }
          } else {
               // Standard top to bottom
               if (fromNode.column === toNode.column) {
                   // Check if there are any nodes in the same column between fromNode.level and toNode.level
                   let hasBlock = false;
                   for (let l = fromNode.level + 1; l < toNode.level; l++) {
                       if (graph.nodes.some(n => n.column === fromNode.column && n.level === l)) {
                           hasBlock = true;
                           break;
                       }
                   }

                   // Straight down if no blocks in between
                   if (!hasBlock) {
                        isStraightLine = true;
                        pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                        labelX = startX + 10;
                        labelY = (startY + endY) / 2;
                        labelAnchor = 'start';
                   } else {
                        // Wide bypass if skipping levels in same column to avoid blocks. Diagonal free.
                        hasTMergeTail = true;
                        const bypassX = startX + NODE_WIDTH / 2 + 40;
                        pathD = `M ${startX} ${startY} L ${startX} ${startY + 20} L ${bypassX} ${startY + 20} L ${bypassX} ${endY - 20} L ${endX} ${endY - 20} L ${endX} ${endY}`;
                        tMergePathD = `M ${startX} ${startY} L ${startX} ${startY + 20} L ${bypassX} ${startY + 20} L ${bypassX} ${endY - 20} L ${endX} ${endY - 20}`;
                        tMergeDropPathD = `M ${endX} ${endY - 20} L ${endX} ${endY}`;
                        labelX = startX + 10;
                        labelY = startY + 10;
                        labelAnchor = 'start';
                   }
               } else {
                   hasTMergeTail = true;
                   if (fromNode.column < toNode.column) {
                       // Branching out (moving right)
                       if (fromNode.type === 'decision') {
                           // Exit from right side
                           startX = start.x + NODE_WIDTH;
                           startY = start.y + NODE_HEIGHT / 2;
                           pathD = `M ${startX} ${startY} L ${endX} ${startY} L ${endX} ${endY}`;
                           tMergePathD = `M ${startX} ${startY} L ${endX} ${startY}`;
                           tMergeDropPathD = `M ${endX} ${startY} L ${endX} ${endY}`;
                           labelX = startX + 10;
                           labelY = startY - 10;
                           labelAnchor = 'start';
                       } else {
                           // Exit from bottom
                           const midY = startY + (gridSizeY - NODE_HEIGHT) / 2;
                           pathD = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
                           tMergePathD = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY}`;
                           tMergeDropPathD = `M ${endX} ${midY} L ${endX} ${endY}`;
                           labelX = startX + 10;
                           labelY = startY + (midY - startY) / 2;
                           labelAnchor = 'start';
                       }
                   } else {
                       // Merging back (moving left): stay in own column until just above target node, merge horizontally into main line
                       const midY = endY - 20;
                       pathD = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
                       tMergePathD = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY}`;
                       tMergeDropPathD = `M ${endX} ${midY} L ${endX} ${endY}`;
                       labelX = startX + 10;
                       labelY = startY + 20;
                       labelAnchor = 'start';
                   }
               }
          }

          let renderPath = pathD;
          let renderDropPath = '';
          let showArrowhead = true; // default

          if (graph.config?.arrowhead === 'none') {
            showArrowhead = false;
          } else if (graph.config?.arrowhead === 'only_merge') {
            if (isMergeEdge) {
              if (isStraightLine) {
                // Main straight line of a merge gets no arrowhead
                showArrowhead = false;
              } else if (hasTMergeTail) {
                // Secondary line merging in. Draw Arrowhead at T-junction!
                renderPath = tMergePathD;
                renderDropPath = tMergeDropPathD;
                showArrowhead = true;
              } else {
                // Edge case: sideway/upwards branch merges without structured T-junction
                showArrowhead = true;
              }
            } else {
              showArrowhead = false;
            }
          }

          return (
            <g key={`edge-${i}`}>
              <path
                d={renderPath}
                fill="none"
                stroke="#1e293b"
                strokeWidth="2"
                markerEnd={showArrowhead ? "url(#arrowhead)" : undefined}
              />
              {renderDropPath && (
                <path
                  d={renderDropPath}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="2"
                />
              )}
              {edge.label && (
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <text
                    x={0}
                    y={0}
                    textAnchor={labelAnchor}
                    dominantBaseline="middle"
                    style={{
                      fontSize: `${Math.max(9, (graph.config?.fontSize || 11) - 1)}px`,
                      fill: '#0f172a',
                      fontFamily: 'sans-serif',
                      fontWeight: 'bold',
                      textShadow: '0 1px 4px white, 0 -1px 4px white, 1px 0 4px white, -1px 0 4px white'
                    }}
                  >
                    {edge.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {graph.nodes.map(node => (
          <g key={node.id}>
            {renderShape(node)}
            {renderText(node)}
          </g>
        ))}
      </svg>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
