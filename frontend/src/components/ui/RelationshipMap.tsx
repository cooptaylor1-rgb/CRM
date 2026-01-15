'use client';

import * as React from 'react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { cn } from './utils';

// ============================================================================
// Types
// ============================================================================

export type RelationshipType =
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'grandparent'
  | 'grandchild'
  | 'partner'
  | 'ex-spouse'
  | 'trustee'
  | 'beneficiary'
  | 'grantor'
  | 'owner'
  | 'officer'
  | 'director'
  | 'shareholder'
  | 'employee'
  | 'advisor'
  | 'attorney'
  | 'accountant'
  | 'other';

export type EntityType =
  | 'individual'
  | 'household'
  | 'trust'
  | 'estate'
  | 'foundation'
  | 'llc'
  | 'corporation'
  | 'partnership'
  | 'charity'
  | 'ira'
  | '401k'
  | 'other';

export interface RelationshipNode {
  id: string;
  name: string;
  type: EntityType;
  avatar?: string;
  initials?: string;
  role?: string;
  tier?: 'platinum' | 'gold' | 'silver' | 'bronze';
  aum?: number;
  birthDate?: string;
  deceased?: boolean;
  isClient?: boolean;
  metadata?: Record<string, unknown>;
}

export interface RelationshipEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  ownership?: number; // Percentage for ownership relationships
  isPrimary?: boolean;
  notes?: string;
}

export interface RelationshipMapData {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
  rootId?: string;
}

// ============================================================================
// Relationship Map Component
// ============================================================================

export interface RelationshipMapProps {
  data: RelationshipMapData;
  onNodeClick?: (node: RelationshipNode) => void;
  onNodeDoubleClick?: (node: RelationshipNode) => void;
  onEdgeClick?: (edge: RelationshipEdge) => void;
  onAddNode?: (parentId: string, relationship: RelationshipType) => void;
  onAddEdge?: (sourceId: string, targetId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  layout?: 'tree' | 'radial' | 'force';
  editable?: boolean;
  className?: string;
}

export function RelationshipMap({
  data,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  onAddNode,
  onAddEdge,
  onDeleteNode,
  onDeleteEdge,
  layout = 'tree',
  editable = false,
  className,
}: RelationshipMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Calculate layout positions
  const positions = useMemo(() => {
    return calculateLayout(data, layout);
  }, [data, layout]);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(z * delta, 0.25), 3));
  }, []);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !selectedNode) {
      setIsDragging(true);
    }
  }, [selectedNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan((p) => ({
        x: p.x + e.movementX,
        y: p.y + e.movementY,
      }));
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: RelationshipNode) => {
    setSelectedNode(node.id);
    setSelectedEdge(null);
    onNodeClick?.(node);
  }, [onNodeClick]);

  // Handle edge click
  const handleEdgeClick = useCallback((edge: RelationshipEdge) => {
    setSelectedEdge(edge.id);
    setSelectedNode(null);
    onEdgeClick?.(edge);
  }, [onEdgeClick]);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Get connected nodes for highlighting
  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>();
    data.edges.forEach((edge) => {
      if (edge.sourceId === hoveredNode) connected.add(edge.targetId);
      if (edge.targetId === hoveredNode) connected.add(edge.sourceId);
    });
    return connected;
  }, [hoveredNode, data.edges]);

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-neutral-900 rounded-xl', className)}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="flex items-center bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}
            className="p-2 hover:bg-neutral-700 transition-colors"
            title="Zoom in"
          >
            <ZoomInIcon className="w-4 h-4 text-neutral-300" />
          </button>
          <span className="px-2 text-xs text-neutral-400 border-x border-neutral-700">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(z * 0.8, 0.25))}
            className="p-2 hover:bg-neutral-700 transition-colors"
            title="Zoom out"
          >
            <ZoomOutIcon className="w-4 h-4 text-neutral-300" />
          </button>
        </div>
        <button
          onClick={resetView}
          className="p-2 bg-neutral-800 rounded-lg border border-neutral-700 hover:bg-neutral-700 transition-colors"
          title="Reset view"
        >
          <CenterIcon className="w-4 h-4 text-neutral-300" />
        </button>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={cn(
            'p-2 rounded-lg border transition-colors',
            showLegend
              ? 'bg-accent-600/20 border-accent-500/30 text-accent-400'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          )}
          title="Toggle legend"
        >
          <LegendIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 z-20 bg-neutral-800/95 backdrop-blur border border-neutral-700 rounded-lg p-3 min-w-[180px]"
          >
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Relationships
            </h4>
            <div className="space-y-1.5">
              {relationshipColors.map(({ type, color, label }) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn('w-3 h-0.5 rounded', color)} />
                  <span className="text-xs text-neutral-300">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-700">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Entities
              </h4>
              <div className="space-y-1.5">
                {entityIcons.map(({ type, icon: Icon, label }) => (
                  <div key={type} className="flex items-center gap-2">
                    <Icon className="w-3 h-3 text-neutral-400" />
                    <span className="text-xs text-neutral-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Edges */}
          <g>
            {data.edges.map((edge) => {
              const sourcePos = positions.get(edge.sourceId);
              const targetPos = positions.get(edge.targetId);
              if (!sourcePos || !targetPos) return null;

              const isHighlighted =
                hoveredNode === edge.sourceId ||
                hoveredNode === edge.targetId ||
                selectedEdge === edge.id;

              return (
                <RelationshipEdgeComponent
                  key={edge.id}
                  edge={edge}
                  sourcePos={sourcePos}
                  targetPos={targetPos}
                  isSelected={selectedEdge === edge.id}
                  isHighlighted={isHighlighted}
                  onClick={() => handleEdgeClick(edge)}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {data.nodes.map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;

              const isConnected = connectedNodes.has(node.id);
              const isDimmed = hoveredNode !== null && hoveredNode !== node.id && !isConnected;

              return (
                <RelationshipNodeComponent
                  key={node.id}
                  node={node}
                  position={pos}
                  isSelected={selectedNode === node.id}
                  isHovered={hoveredNode === node.id}
                  isDimmed={isDimmed}
                  onClick={() => handleNodeClick(node)}
                  onDoubleClick={() => onNodeDoubleClick?.(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  editable={editable}
                  onAddRelationship={onAddNode}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Node Detail Panel */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailPanel
            node={data.nodes.find((n) => n.id === selectedNode)!}
            edges={data.edges.filter(
              (e) => e.sourceId === selectedNode || e.targetId === selectedNode
            )}
            nodes={data.nodes}
            onClose={() => setSelectedNode(null)}
            onDeleteNode={onDeleteNode}
            editable={editable}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Node Component
// ============================================================================

interface RelationshipNodeComponentProps {
  node: RelationshipNode;
  position: { x: number; y: number };
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  editable: boolean;
  onAddRelationship?: (parentId: string, relationship: RelationshipType) => void;
}

function RelationshipNodeComponent({
  node,
  position,
  isSelected,
  isHovered,
  isDimmed,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  editable,
  onAddRelationship,
}: RelationshipNodeComponentProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const nodeSize = node.type === 'individual' ? 48 : 56;
  const halfSize = nodeSize / 2;

  const tierColors = {
    platinum: 'stroke-purple-400',
    gold: 'stroke-yellow-400',
    silver: 'stroke-neutral-400',
    bronze: 'stroke-amber-600',
  };

  const entityTypeConfig = getEntityTypeConfig(node.type);

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="cursor-pointer"
      style={{ opacity: isDimmed ? 0.3 : 1, transition: 'opacity 0.2s' }}
    >
      {/* Selection ring */}
      {isSelected && (
        <circle
          r={halfSize + 6}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-accent-500"
          strokeDasharray="4 2"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="10s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Hover ring */}
      {isHovered && !isSelected && (
        <circle
          r={halfSize + 4}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-neutral-500"
        />
      )}

      {/* Tier indicator ring */}
      {node.tier && (
        <circle
          r={halfSize + 2}
          fill="none"
          strokeWidth={2}
          className={tierColors[node.tier]}
        />
      )}

      {/* Main circle/shape */}
      {node.type === 'individual' ? (
        <circle
          r={halfSize}
          className={cn(
            'fill-neutral-800 stroke-neutral-600',
            isSelected && 'stroke-accent-500',
            node.deceased && 'fill-neutral-900'
          )}
          strokeWidth={2}
        />
      ) : (
        <rect
          x={-halfSize}
          y={-halfSize}
          width={nodeSize}
          height={nodeSize}
          rx={8}
          className={cn(
            'fill-neutral-800 stroke-neutral-600',
            isSelected && 'stroke-accent-500'
          )}
          strokeWidth={2}
        />
      )}

      {/* Avatar or Icon */}
      {node.avatar ? (
        <clipPath id={`avatar-clip-${node.id}`}>
          {node.type === 'individual' ? (
            <circle r={halfSize - 4} />
          ) : (
            <rect x={-halfSize + 4} y={-halfSize + 4} width={nodeSize - 8} height={nodeSize - 8} rx={4} />
          )}
        </clipPath>
      ) : (
        <>
          {node.type === 'individual' ? (
            node.initials ? (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white text-sm font-semibold select-none"
              >
                {node.initials}
              </text>
            ) : (
              <PersonIcon className="w-5 h-5 text-neutral-400" x={-10} y={-10} />
            )
          ) : (
            <entityTypeConfig.icon
              className="w-5 h-5 text-neutral-400"
              x={-10}
              y={-10}
            />
          )}
        </>
      )}

      {/* Client indicator */}
      {node.isClient && (
        <circle
          cx={halfSize - 4}
          cy={-halfSize + 4}
          r={6}
          className="fill-accent-500"
        />
      )}

      {/* Deceased indicator */}
      {node.deceased && (
        <line
          x1={-halfSize}
          y1={halfSize}
          x2={halfSize}
          y2={-halfSize}
          className="stroke-neutral-500"
          strokeWidth={2}
        />
      )}

      {/* Name label */}
      <text
        y={halfSize + 16}
        textAnchor="middle"
        className="fill-white text-xs font-medium select-none"
      >
        {node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name}
      </text>

      {/* Role/Type label */}
      {node.role && (
        <text
          y={halfSize + 30}
          textAnchor="middle"
          className="fill-neutral-500 text-[10px] select-none"
        >
          {node.role}
        </text>
      )}

      {/* AUM badge */}
      {node.aum !== undefined && node.aum > 0 && (
        <g transform={`translate(0, ${halfSize + (node.role ? 42 : 30)})`}>
          <rect
            x={-30}
            y={-8}
            width={60}
            height={16}
            rx={8}
            className="fill-green-900/50 stroke-green-700/50"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-green-400 text-[10px] font-medium select-none"
          >
            ${formatCompactNumber(node.aum)}
          </text>
        </g>
      )}

      {/* Add relationship button (editable mode) */}
      {editable && isHovered && (
        <g transform={`translate(${halfSize + 8}, 0)`}>
          <circle
            r={12}
            className="fill-accent-600 cursor-pointer hover:fill-accent-500 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddMenu(!showAddMenu);
            }}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white text-sm font-bold select-none pointer-events-none"
          >
            +
          </text>
        </g>
      )}
    </g>
  );
}

// ============================================================================
// Edge Component
// ============================================================================

interface RelationshipEdgeComponentProps {
  edge: RelationshipEdge;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

function RelationshipEdgeComponent({
  edge,
  sourcePos,
  targetPos,
  isSelected,
  isHighlighted,
  onClick,
}: RelationshipEdgeComponentProps) {
  const relationshipConfig = getRelationshipConfig(edge.type);

  // Calculate control points for curved line
  const midX = (sourcePos.x + targetPos.x) / 2;
  const midY = (sourcePos.y + targetPos.y) / 2;
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Offset for curve
  const curveOffset = Math.min(dist * 0.2, 50);
  const perpX = -dy / dist * curveOffset;
  const perpY = dx / dist * curveOffset;

  const controlX = midX + perpX;
  const controlY = midY + perpY;

  const path = `M ${sourcePos.x} ${sourcePos.y} Q ${controlX} ${controlY} ${targetPos.x} ${targetPos.y}`;

  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* Hit area (invisible, larger click target) */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
      />

      {/* Actual line */}
      <path
        d={path}
        fill="none"
        strokeWidth={isSelected ? 3 : isHighlighted ? 2 : 1.5}
        className={cn(
          relationshipConfig.color,
          isSelected && 'stroke-accent-500',
          !isHighlighted && !isSelected && 'opacity-50'
        )}
        strokeDasharray={edge.type === 'ex-spouse' ? '4 4' : undefined}
      />

      {/* Ownership percentage label */}
      {edge.ownership !== undefined && (
        <g transform={`translate(${controlX}, ${controlY})`}>
          <rect
            x={-16}
            y={-10}
            width={32}
            height={20}
            rx={4}
            className="fill-neutral-800 stroke-neutral-700"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-neutral-300 text-[10px] font-medium select-none"
          >
            {edge.ownership}%
          </text>
        </g>
      )}

      {/* Relationship type label (on hover) */}
      {isHighlighted && !edge.ownership && (
        <g transform={`translate(${controlX}, ${controlY})`}>
          <rect
            x={-30}
            y={-10}
            width={60}
            height={20}
            rx={4}
            className="fill-neutral-800/90 stroke-neutral-700"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-neutral-300 text-[10px] select-none capitalize"
          >
            {edge.type}
          </text>
        </g>
      )}
    </g>
  );
}

// ============================================================================
// Node Detail Panel
// ============================================================================

interface NodeDetailPanelProps {
  node: RelationshipNode;
  edges: RelationshipEdge[];
  nodes: RelationshipNode[];
  onClose: () => void;
  onDeleteNode?: (nodeId: string) => void;
  editable: boolean;
}

function NodeDetailPanel({
  node,
  edges,
  nodes,
  onClose,
  onDeleteNode,
  editable,
}: NodeDetailPanelProps) {
  const relationships = useMemo(() => {
    return edges.map((edge) => {
      const isSource = edge.sourceId === node.id;
      const relatedNode = nodes.find((n) => n.id === (isSource ? edge.targetId : edge.sourceId));
      return {
        edge,
        relatedNode,
        direction: isSource ? 'outgoing' : 'incoming',
      };
    });
  }, [edges, nodes, node.id]);

  const entityConfig = getEntityTypeConfig(node.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute bottom-4 right-4 z-20 w-80 bg-neutral-800/95 backdrop-blur border border-neutral-700 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              node.type === 'individual' ? 'bg-neutral-700' : 'bg-neutral-700 rounded-lg'
            )}>
              {node.initials ? (
                <span className="text-white font-semibold">{node.initials}</span>
              ) : (
                <entityConfig.icon className="w-6 h-6 text-neutral-400" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold">{node.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-neutral-400 capitalize">{node.type}</span>
                {node.tier && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded capitalize',
                    node.tier === 'platinum' && 'bg-purple-900/50 text-purple-300',
                    node.tier === 'gold' && 'bg-yellow-900/50 text-yellow-300',
                    node.tier === 'silver' && 'bg-neutral-700 text-neutral-300',
                    node.tier === 'bronze' && 'bg-amber-900/50 text-amber-300'
                  )}>
                    {node.tier}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-700 transition-colors"
          >
            <CloseIcon className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* AUM */}
        {node.aum !== undefined && node.aum > 0 && (
          <div className="mt-3 p-2 bg-green-900/20 border border-green-800/30 rounded-lg">
            <div className="text-xs text-green-400 mb-0.5">Assets Under Management</div>
            <div className="text-lg font-semibold text-green-300">
              ${node.aum.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Relationships */}
      <div className="p-4">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
          Relationships ({relationships.length})
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {relationships.length === 0 ? (
            <p className="text-sm text-neutral-500 italic">No relationships</p>
          ) : (
            relationships.map(({ edge, relatedNode }) => (
              <div
                key={edge.id}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-700/30 hover:bg-neutral-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                    {relatedNode?.initials ? (
                      <span className="text-xs text-white font-medium">
                        {relatedNode.initials}
                      </span>
                    ) : (
                      <PersonIcon className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-white">
                      {relatedNode?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-neutral-400 capitalize">
                      {edge.type}
                      {edge.ownership !== undefined && ` (${edge.ownership}%)`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      {editable && (
        <div className="p-4 border-t border-neutral-700">
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-sm font-medium bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors">
              Edit
            </button>
            <button
              onClick={() => onDeleteNode?.(node.id)}
              className="px-3 py-2 text-sm font-medium text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/10 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Compact Relationship View (for embedding)
// ============================================================================

export interface CompactRelationshipMapProps {
  data: RelationshipMapData;
  onViewFull?: () => void;
  className?: string;
}

export function CompactRelationshipMap({
  data,
  onViewFull,
  className,
}: CompactRelationshipMapProps) {
  const familyMembers = data.nodes.filter((n) => n.type === 'individual');
  const entities = data.nodes.filter((n) => n.type !== 'individual');

  return (
    <div className={cn('bg-neutral-800/50 rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Relationships</h3>
        {onViewFull && (
          <button
            onClick={onViewFull}
            className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
          >
            View Map →
          </button>
        )}
      </div>

      {/* Family Members */}
      {familyMembers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
            Family ({familyMembers.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {familyMembers.slice(0, 6).map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-2 py-1.5 bg-neutral-700/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-neutral-600 flex items-center justify-center">
                  {member.initials ? (
                    <span className="text-[10px] text-white font-medium">
                      {member.initials}
                    </span>
                  ) : (
                    <PersonIcon className="w-3 h-3 text-neutral-400" />
                  )}
                </div>
                <span className="text-xs text-white">{member.name}</span>
              </div>
            ))}
            {familyMembers.length > 6 && (
              <div className="flex items-center px-2 py-1.5 text-xs text-neutral-400">
                +{familyMembers.length - 6} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entities */}
      {entities.length > 0 && (
        <div>
          <h4 className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
            Entities ({entities.length})
          </h4>
          <div className="space-y-1.5">
            {entities.slice(0, 4).map((entity) => {
              const config = getEntityTypeConfig(entity.type);
              return (
                <div
                  key={entity.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-neutral-700/30 rounded-lg"
                >
                  <config.icon className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs text-white flex-1">{entity.name}</span>
                  {entity.aum && (
                    <span className="text-xs text-green-400">
                      ${formatCompactNumber(entity.aum)}
                    </span>
                  )}
                </div>
              );
            })}
            {entities.length > 4 && (
              <div className="text-xs text-neutral-400 px-2">
                +{entities.length - 4} more entities
              </div>
            )}
          </div>
        </div>
      )}

      {data.nodes.length === 0 && (
        <p className="text-sm text-neutral-500 italic">No relationships mapped</p>
      )}
    </div>
  );
}

// ============================================================================
// Layout Calculations
// ============================================================================

function calculateLayout(
  data: RelationshipMapData,
  layout: 'tree' | 'radial' | 'force'
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = 400;
  const centerY = 300;

  if (data.nodes.length === 0) return positions;

  if (layout === 'tree') {
    // Hierarchical tree layout
    const levels: Map<string, number> = new Map();
    const visited = new Set<string>();

    // Find root (client or first node)
    const rootId = data.rootId || data.nodes.find((n) => n.isClient)?.id || data.nodes[0].id;

    // BFS to assign levels
    const queue = [{ id: rootId, level: 0 }];
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      levels.set(id, level);

      // Find connected nodes
      data.edges.forEach((edge) => {
        if (edge.sourceId === id && !visited.has(edge.targetId)) {
          queue.push({ id: edge.targetId, level: level + 1 });
        }
        if (edge.targetId === id && !visited.has(edge.sourceId)) {
          queue.push({ id: edge.sourceId, level: level + 1 });
        }
      });
    }

    // Handle disconnected nodes
    data.nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });

    // Group by level
    const nodesByLevel: Map<number, string[]> = new Map();
    levels.forEach((level, id) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(id);
    });

    // Position nodes
    const levelHeight = 120;
    const nodeWidth = 150;

    nodesByLevel.forEach((nodeIds, level) => {
      const totalWidth = nodeIds.length * nodeWidth;
      const startX = centerX - totalWidth / 2 + nodeWidth / 2;

      nodeIds.forEach((id, index) => {
        positions.set(id, {
          x: startX + index * nodeWidth,
          y: centerY + level * levelHeight - (nodesByLevel.size * levelHeight) / 2,
        });
      });
    });
  } else if (layout === 'radial') {
    // Radial layout
    const angleStep = (2 * Math.PI) / data.nodes.length;
    const radius = Math.min(150, 50 + data.nodes.length * 15);

    data.nodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
  } else {
    // Force-directed layout (simplified)
    // Initial random positions
    data.nodes.forEach((node, index) => {
      const angle = (index / data.nodes.length) * 2 * Math.PI;
      const radius = 100 + Math.random() * 100;
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });

    // Simple force simulation (10 iterations)
    for (let i = 0; i < 10; i++) {
      // Repulsion between all nodes
      data.nodes.forEach((node1) => {
        data.nodes.forEach((node2) => {
          if (node1.id === node2.id) return;
          const pos1 = positions.get(node1.id)!;
          const pos2 = positions.get(node2.id)!;
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 5000 / (dist * dist);
          positions.set(node1.id, {
            x: pos1.x + (dx / dist) * force,
            y: pos1.y + (dy / dist) * force,
          });
        });
      });

      // Attraction along edges
      data.edges.forEach((edge) => {
        const pos1 = positions.get(edge.sourceId);
        const pos2 = positions.get(edge.targetId);
        if (!pos1 || !pos2) return;
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 100) * 0.1;
        positions.set(edge.sourceId, {
          x: pos1.x + (dx / dist) * force,
          y: pos1.y + (dy / dist) * force,
        });
        positions.set(edge.targetId, {
          x: pos2.x - (dx / dist) * force,
          y: pos2.y - (dy / dist) * force,
        });
      });
    }
  }

  return positions;
}

// ============================================================================
// Configuration & Icons
// ============================================================================

const relationshipColors = [
  { type: 'spouse', color: 'bg-pink-500', label: 'Spouse' },
  { type: 'child', color: 'bg-blue-500', label: 'Child' },
  { type: 'parent', color: 'bg-purple-500', label: 'Parent' },
  { type: 'beneficiary', color: 'bg-green-500', label: 'Beneficiary' },
  { type: 'trustee', color: 'bg-yellow-500', label: 'Trustee' },
  { type: 'owner', color: 'bg-orange-500', label: 'Owner' },
];

function getRelationshipConfig(type: RelationshipType) {
  const configs: Record<RelationshipType, { color: string; dashArray?: string }> = {
    spouse: { color: 'stroke-pink-500' },
    child: { color: 'stroke-blue-500' },
    parent: { color: 'stroke-purple-500' },
    sibling: { color: 'stroke-indigo-500' },
    grandparent: { color: 'stroke-purple-400' },
    grandchild: { color: 'stroke-blue-400' },
    partner: { color: 'stroke-pink-400' },
    'ex-spouse': { color: 'stroke-pink-300', dashArray: '4 4' },
    trustee: { color: 'stroke-yellow-500' },
    beneficiary: { color: 'stroke-green-500' },
    grantor: { color: 'stroke-amber-500' },
    owner: { color: 'stroke-orange-500' },
    officer: { color: 'stroke-cyan-500' },
    director: { color: 'stroke-teal-500' },
    shareholder: { color: 'stroke-emerald-500' },
    employee: { color: 'stroke-neutral-400' },
    advisor: { color: 'stroke-accent-500' },
    attorney: { color: 'stroke-red-400' },
    accountant: { color: 'stroke-violet-500' },
    other: { color: 'stroke-neutral-500' },
  };
  return configs[type] || configs.other;
}

const entityIcons = [
  { type: 'individual', icon: PersonIcon, label: 'Individual' },
  { type: 'trust', icon: TrustIcon, label: 'Trust' },
  { type: 'llc', icon: BuildingIcon, label: 'LLC' },
  { type: 'foundation', icon: FoundationIcon, label: 'Foundation' },
];

function getEntityTypeConfig(type: EntityType) {
  const configs: Record<EntityType, { icon: React.FC<{ className?: string; x?: number; y?: number }> }> = {
    individual: { icon: PersonIcon },
    household: { icon: HouseholdIcon },
    trust: { icon: TrustIcon },
    estate: { icon: EstateIcon },
    foundation: { icon: FoundationIcon },
    llc: { icon: BuildingIcon },
    corporation: { icon: CorporationIcon },
    partnership: { icon: PartnershipIcon },
    charity: { icon: CharityIcon },
    ira: { icon: RetirementIcon },
    '401k': { icon: RetirementIcon },
    other: { icon: OtherEntityIcon },
  };
  return configs[type] || configs.other;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCompactNumber(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(0) + 'K';
  return value.toString();
}

// ============================================================================
// Icons
// ============================================================================

function PersonIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function HouseholdIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function TrustIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function EstateIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function FoundationIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BuildingIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function CorporationIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PartnershipIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CharityIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function RetirementIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function OtherEntityIcon({ className, x = 0, y = 0 }: { className?: string; x?: number; y?: number }) {
  return (
    <svg className={className} x={x} y={y} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  );
}

function ZoomInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
  );
}

function ZoomOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
    </svg>
  );
}

function CenterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

function LegendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default RelationshipMap;
