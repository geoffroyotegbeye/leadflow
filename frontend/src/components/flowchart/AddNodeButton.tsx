import React from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { NodeData } from './NodeTypes';

interface AddNodeButtonProps {
  onAddNode: (node: NodeData) => void;
}

const AddNodeButton: React.FC<AddNodeButtonProps> = ({ onAddNode }) => {
  const handleClick = () => {
    const newNode: NodeData = {
      id: crypto.randomUUID(),
      label: 'Nouveau nœud',
      elements: [],
      position: { x: 100, y: 100 },
      width: 300
    };
    onAddNode(newNode);
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
      aria-label="Ajouter un nœud"
    >
      <PlusIcon className="h-6 w-6" />
    </button>
  );
};

export default AddNodeButton;
