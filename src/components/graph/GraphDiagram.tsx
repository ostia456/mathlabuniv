import { memo } from 'react';

type Edge = [number, number, number];

function edgeLabelPlacement(a: { x: number; y: number }, b: { x: number; y: number }, idx: number) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  // Alternate sides and vary magnitude a bit to reduce overlaps
  const side = idx % 2 === 0 ? 1 : -1;
  const mag = 14 + (idx % 3) * 6;

  return { x: mx + nx * mag * side, y: my + ny * mag * side };
}

function edgeCurveControl(a: { x: number; y: number }, b: { x: number; y: number }, idx: number) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const side = idx % 2 === 0 ? 1 : -1;
  const mag = 10 + (idx % 4) * 5;
  return { cx: mx + nx * mag * side, cy: my + ny * mag * side };
}

function getNodePosition(id: number, total: number, width: number, height: number) {
  const angle = (id * 2 * Math.PI) / total - Math.PI / 2;
  const radius = Math.min(width, height) * 0.35;
  const cx = width / 2;
  const cy = height / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

export const GraphDiagram = memo(function GraphDiagram(props: {
  numNodes: number;
  edges: Edge[];
  start?: number;
  end?: number;
  width?: number;
  height?: number;
}) {
  const { numNodes, edges, start, end, width = 520, height = 300 } = props;

  const positions = Array.from({ length: numNodes }, (_, id) =>
    getNodePosition(id, numNodes, width, height)
  );

  const nodeRadius = 18;

  return (
    <div className="w-full overflow-auto rounded-lg border bg-background">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
        {/* Edges */}
        {edges.map(([u, v, w], idx) => {
          const a = positions[u];
          const b = positions[v];
          if (!a || !b) return null;

          const { cx, cy } = edgeCurveControl(a, b, idx);
          const lp = edgeLabelPlacement(a, b, idx);

          return (
            <g key={idx}>
              <path
                d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                opacity={0.85}
              />
              <rect
                x={lp.x - 14}
                y={lp.y - 11}
                width={28}
                height={20}
                rx={6}
                fill="hsl(var(--background))"
                opacity={0.95}
              />
              <rect
                x={lp.x - 14}
                y={lp.y - 11}
                width={28}
                height={20}
                rx={6}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                opacity={0.35}
              />
              <text
                x={lp.x}
                y={lp.y + 5}
                textAnchor="middle"
                fontSize={12}
                fill="hsl(var(--foreground))"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
              >
                {w}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {positions.map((p, id) => {
          const isStart = start === id;
          const isEnd = end === id;
          const fill = isStart ? '#22c55e' : isEnd ? '#ef4444' : 'hsl(var(--background))';
          const stroke = isStart || isEnd ? fill : 'hsl(var(--muted-foreground))';
          const labelColor = isStart || isEnd ? '#fff' : 'hsl(var(--foreground))';

          return (
            <g key={id}>
              <circle cx={p.x} cy={p.y} r={nodeRadius} fill={fill} stroke={stroke} strokeWidth={2} />
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor="middle"
                fontSize={12}
                fill={labelColor}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
              >
                {id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});