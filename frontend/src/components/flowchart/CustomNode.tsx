import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import * as HeroIcons from '@heroicons/react/24/outline';
import { NodeData, NODE_TYPES, ELEMENT_TYPES, OptionType } from './NodeTypes';
import './FlowStyles.css';

// Map des icônes pour les types de nœuds
const iconMap = {
  'PlayIcon': HeroIcons.PlayIcon,
  'ChatBubbleLeftRightIcon': HeroIcons.ChatBubbleLeftRightIcon,
  'QuestionMarkCircleIcon': HeroIcons.QuestionMarkCircleIcon,
  'AdjustmentsHorizontalIcon': HeroIcons.AdjustmentsHorizontalIcon,
  'BoltIcon': HeroIcons.BoltIcon,
  'GlobeAltIcon': HeroIcons.GlobeAltIcon,
  'ClockIcon': HeroIcons.ClockIcon,
  'StopIcon': HeroIcons.StopIcon,
};

const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  const nodeType = NODE_TYPES[data.type];
  const Icon = data.icon ? HeroIcons[data.icon as keyof typeof HeroIcons] : iconMap[nodeType.icon as keyof typeof iconMap];

  if (!Icon) {
    console.error(`Icon not found for type: ${data.type}`);
    return null;
  }

  return (
    <div
      className={`flow-node ${selected ? 'selected' : ''}`}
      style={{
        backgroundColor: `${data.color || nodeType.color}15`,
        borderColor: data.color || nodeType.color,
        width: data.width || 300
      }}
    >
      {/* Input Handle */}
      {data.type !== 'start' && (
        <Handle
          type="target"
          position={Position.Left}
          className="flow-handle"
          isConnectable={true}
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
          {data.elements && data.elements.length > 0 && (
            <div className="flow-node-elements">
              {data.elements.map((element, index) => (
                <div key={element.id} className="flow-node-element">
                  <div className="flow-element-type">
                    {ELEMENT_TYPES[element.type].label}
                  </div>
                  {element.content && element.type !== 'image' && (
                    <div className="flow-element-content">
                      {element.content}
                    </div>
                  )}
                  {element.type === 'image' && (element.mediaUrl || element.content) && (
                    <div className="flow-element-image">
                      <img 
                        src={element.mediaUrl || element.content} 
                        alt="Image" 
                        className="max-h-24 max-w-full object-contain rounded border border-gray-200 bg-white"
                      />
                    </div>
                  )}
                  {element.type === 'question' && element.options && (
                    <div className="flow-element-options">
                      {element.options.map((option, optIndex) => (
                        <div key={optIndex} className="flow-element-option relative">
                          • {typeof option === 'string' ? option : option.text}
                          {/* Handle spécifique pour cette option */}
                          <Handle
                            id={`option-${element.id}-${optIndex}`}
                            type="source"
                            position={Position.Right}
                            className="flow-handle flow-option-handle"
                            style={{ 
                              top: 'auto', 
                              right: '-8px',
                              bottom: 'auto',
                              opacity: 0.5,
                              width: '10px',
                              height: '10px',
                              zIndex: 10 // Augmenter le z-index pour faciliter la sélection
                            }}
                            isConnectable={true} // Rendre explicitement connectable
                            data={{ optionIndex: optIndex, elementId: element.id }} // Ajouter des données pour identifier l'option
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Output Handle principal (pour les nœuds sans options ou comme fallback) */}
      {data.type !== 'end' && (
        <Handle
          id="main"
          type="source"
          position={Position.Right}
          className="flow-handle"
          isConnectable={true}
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
