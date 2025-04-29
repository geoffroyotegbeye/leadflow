import React from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { NodeData } from './NodeTypes';

interface AddNodeButtonProps {
  onAddNode: (node: NodeData) => void;
  nodeType?: 'start' | 'end' | 'interaction' | 'condition' | 'action';
  position?: { bottom?: number; right?: number; left?: number };
}

const AddNodeButton: React.FC<AddNodeButtonProps> = ({ onAddNode, nodeType = 'interaction', position }) => {
  const handleClick = () => {
    const newNode: NodeData = {
      id: crypto.randomUUID(),
      label: nodeType === 'start' ? 'Début' : nodeType === 'end' ? 'Fin' : 'Nouveau nœud',
      type: nodeType,
      elements: [],
      position: { x: 100, y: 100 }
    };
    onAddNode(newNode);
  };

  const baseClass = 'p-4 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 z-50 flex items-center justify-center';
  let style = 'fixed';
  if (position) {
    if (position.bottom !== undefined) style += ` bottom-[${position.bottom}px]`;
    if (position.right !== undefined) style += ` right-[${position.right}px]`;
    if (position.left !== undefined) style += ` left-[${position.left}px]`;
  }
  let colorClass = 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
  if (nodeType === 'start') colorClass = 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500';
  if (nodeType === 'end') colorClass = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';

  return (
    <button
      onClick={handleClick}
      className={`${style} ${baseClass} ${colorClass}`}
      aria-label={`Ajouter un nœud ${nodeType}`}
      title={`Ajouter un nœud ${nodeType === 'start' ? 'de début' : nodeType === 'end' ? 'de fin' : ''}`}
    >
      <PlusIcon className="h-6 w-6" />
      <span className="ml-2 hidden md:inline text-sm font-semibold">
        {nodeType === 'start' ? 'Début' : nodeType === 'end' ? 'Fin' : 'Nœud'}
      </span>
    </button>
  );
};

export default AddNodeButton;
