import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  PlayIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  GlobeAltIcon,
  ClockIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { NodeData, NODE_TYPES } from './NodeTypes';
import './FlowStyles.css';

// Map des icônes pour les types de nœuds
const iconMap = {
  'PlayIcon': PlayIcon,
  'ChatBubbleLeftRightIcon': ChatBubbleLeftRightIcon,
  'QuestionMarkCircleIcon': QuestionMarkCircleIcon,
  'AdjustmentsHorizontalIcon': AdjustmentsHorizontalIcon,
  'BoltIcon': BoltIcon,
  'GlobeAltIcon': GlobeAltIcon,
  'ClockIcon': ClockIcon,
  'StopIcon': StopIcon,
};

const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  const nodeType = NODE_TYPES[data.type];
  const Icon = iconMap[nodeType.icon as keyof typeof iconMap];

  if (!Icon) {
    console.error(`Icon not found for type: ${data.type}`);
    return null;
  }

  return (
    <div
      className={`flow-node ${selected ? 'selected' : ''}`}
      style={{
        backgroundColor: `${nodeType.color}15`,
        borderColor: nodeType.color,
      }}
    >
      {/* Input Handle */}
      {data.type !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="flow-handle"
        />
      )}

      {/* Node Content */}
      <div className="flow-node-content">
        <div
          className="flow-node-icon-container"
          style={{ backgroundColor: `${nodeType.color}25` }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: nodeType.color }}
          />
        </div>
        <div className="flow-node-text">
          <div className="flow-node-title">
            {data.label}
          </div>
          {data.content && (
            <div className="flow-node-description">
              {data.content}
            </div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      {data.type !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="flow-handle"
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
