import React, { useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  MarkerType,
  NodeMouseHandler,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../components/flowchart/FlowStyles.css';
import {
  PlusIcon,
  PlayIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  GlobeAltIcon,
  ClockIcon,
  StopIcon,
  TrashIcon,
  Bars3Icon,
  XMarkIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  CircleStackIcon,
  ArrowsRightLeftIcon,
  ArrowPathRoundedSquareIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { NodeData, NodeType, NODE_TYPES } from '../components/flowchart/NodeTypes';
import CustomNode from '../components/flowchart/CustomNode';
import NodeEditor from '../components/flowchart/NodeEditor';
import ContextMenu from '../components/flowchart/ContextMenu';

// Map des icônes pour les types de nœuds
const iconMap = {
  PlayIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  GlobeAltIcon,
  ClockIcon,
  StopIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  CircleStackIcon,
  ArrowsRightLeftIcon,
  ArrowPathRoundedSquareIcon,
  BellIcon,
};

const initialNodes: Node<NodeData>[] = [
  {
    id: 'start',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: {
      label: 'Début',
      type: NodeType.START,
    },
  },
];

interface ContextMenuInfo {
  id: string;
  x: number;
  y: number;
}

const ChatbotEditor: React.FC = () => {
  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = React.useState<Node<NodeData> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuInfo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#64748b' },
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setIsEditorOpen(true);
      setContextMenu(null);
    },
    []
  );

  // Handle node context menu
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setSelectedNode(node);
      setContextMenu({
        id: node.id,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  // Handle background click to close context menu
  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Delete selected node
  const deleteNode = useCallback(() => {
    if (selectedNode) {
      // Ne pas permettre la suppression du nœud de départ
      if (selectedNode.id === 'start') {
        return;
      }
      
      // Supprimer le nœud
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      
      // Supprimer les connexions associées
      setEdges((eds) => eds.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      
      // Fermer l'éditeur et le menu contextuel
      setIsEditorOpen(false);
      setContextMenu(null);
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  // Add new node to the canvas
  const addNode = useCallback((type: NodeType) => {
    const newNode: Node<NodeData> = {
      id: `${type}-${Date.now()}`,
      type: 'custom',
      position: { x: 100, y: 100 },
      data: {
        label: NODE_TYPES[type].label,
        type: type,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
    setIsEditorOpen(true);
  }, [setNodes]);

  // Update node data
  const handleNodeUpdate = useCallback((data: NodeData) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id ? { ...node, data } : node
        )
      );
    }
  }, [selectedNode, setNodes]);

  return (
    <div className="flow-editor">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="flow-sidebar-toggle"
      >
        {isSidebarOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Node Types Sidebar */}
      <div className={`flow-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <h2 className="flow-sidebar-title">
          Éléments
        </h2>
        <div className="flow-sidebar-items">
          {Object.entries(NODE_TYPES).map(([type, config]) => {
            const Icon = iconMap[config.icon as keyof typeof iconMap];
            return (
              <button
                key={type}
                onClick={() => addNode(type as NodeType)}
                className="flow-sidebar-item"
              >
                <div
                  className="flow-node-icon-container"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: config.color }}
                  />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flow Editor */}
      <div className="flow-editor-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50 dark:bg-gray-900"
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#64748b' },
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {/* Add Node Button */}
        <button
          onClick={() => addNode(NodeType.MESSAGE)}
          className="flow-add-button"
        >
          <PlusIcon className="w-6 h-6" />
        </button>

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onEdit={() => {
              setIsEditorOpen(true);
              setContextMenu(null);
            }}
            onDelete={contextMenu.id !== 'start' ? deleteNode : undefined}
          />
        )}
      </div>

      {/* Node Editor */}
      <NodeEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedNode(null);
        }}
        node={selectedNode?.data || null}
        onSave={handleNodeUpdate}
        onDelete={selectedNode?.id !== 'start' ? deleteNode : undefined}
      />
    </div>
  );
};

export default ChatbotEditor;
