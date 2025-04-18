import React, { useCallback, useMemo } from 'react';
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

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setIsEditorOpen(true);
      setContextMenu(null);
    },
    []
  );

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

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const deleteNode = useCallback(() => {
    if (selectedNode) {
      if (selectedNode.id === 'start') {
        return;
      }
      
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      
      setIsEditorOpen(false);
      setContextMenu(null);
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

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

      <div className={`flow-editor-container ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
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

        <button
          onClick={() => addNode(NodeType.MESSAGE)}
          className="flow-add-button"
        >
          <PlusIcon className="w-6 h-6" />
        </button>

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
