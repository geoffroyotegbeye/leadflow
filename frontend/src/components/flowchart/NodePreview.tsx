import React from 'react';
import { ChatBubbleBottomCenterIcon, QuestionMarkCircleIcon, GlobeAltIcon, ClockIcon } from '@heroicons/react/24/outline';
import { NodeData, ElementType, ELEMENT_TYPES } from './NodeTypes';

interface NodePreviewProps {
  node: NodeData;
  onClick?: () => void;
}

const ElementIcon: React.FC<{ type: ElementType['type'] }> = ({ type }) => {
  switch (type) {
    case 'text':
      return <ChatBubbleBottomCenterIcon className="h-4 w-4" />;
    case 'question':
      return <QuestionMarkCircleIcon className="h-4 w-4" />;
    case 'api_call':
      return <GlobeAltIcon className="h-4 w-4" />;
    case 'wait_input':
      return <ClockIcon className="h-4 w-4" />;
    default:
      return null;
  }
};

const NodePreview: React.FC<NodePreviewProps> = ({ node, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-4 min-w-[200px] cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onClick}
    >
      <div className="font-medium text-gray-900 mb-3 border-b pb-2">{node.label}</div>
      
      <div className="space-y-2">
        {node.elements.map((element, index) => (
          <div 
            key={element.id}
            className="flex items-center text-sm text-gray-600 bg-gray-50 rounded p-2"
          >
            <div className="flex-shrink-0 mr-2 text-gray-500">
              <ElementIcon type={element.type} />
            </div>
            <div className="flex-grow overflow-hidden">
              <div className="truncate">
                {element.type === 'image' ? (
                  <img
                    src={element.mediaUrl || element.content}
                    alt="Image"
                    className="max-h-24 max-w-full object-contain rounded border border-gray-200 bg-white"
                  />
                ) : (
                  element.content || ELEMENT_TYPES[element.type].label
                )}
              </div>
              {element.type === 'question' && element.options && element.options.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {element.options.length} option{element.options.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 ml-2">
              <div className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                {element.displayMode === 'after' ? '↓' : '⇉'}
              </div>
            </div>
          </div>
        ))}
        
        {node.elements.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-2">
            Aucun élément
          </div>
        )}
      </div>

      <button 
        className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center py-1"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <span className="mr-1">+</span> Ajouter un élément
      </button>
    </div>
  );
};

export default NodePreview;
