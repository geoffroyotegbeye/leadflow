import React from 'react';
import { PlayIcon, PlusIcon, StopIcon } from '@heroicons/react/24/solid';
import { NodeData } from './NodeTypes';

interface NodeButtonGroupProps {
  onAddNode: (node: NodeData) => void;
}

const NodeButtonGroup: React.FC<NodeButtonGroupProps> = ({ onAddNode }) => {
  const handleAddNode = (nodeType: 'start' | 'interaction' | 'end') => {
    // Générer une position plus intelligente pour le nouveau nœud
    // Position aléatoire mais dans une zone visible du centre de l'écran
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Ajout d'un décalage selon le type de nœud pour les espacer
    let offsetX = 0;
    let offsetY = 0;
    
    if (nodeType === 'start') {
      // Nœud de début en haut
      offsetY = -100;
    } else if (nodeType === 'end') {
      // Nœud de fin en bas
      offsetY = 100;
    }
    
    // Ajout d'une petite variation aléatoire pour éviter les superpositions
    const randomX = Math.random() * 100 - 50;
    const randomY = Math.random() * 60 - 30;
    
    const newNode: NodeData = {
      id: crypto.randomUUID(),
      label: nodeType === 'start' ? 'Début' : nodeType === 'end' ? 'Fin' : 'Nouveau nœud',
      type: nodeType,
      elements: [],
      position: { 
        x: centerX + offsetX + randomX - 150, // -150 pour compenser la taille du nœud
        y: centerY + offsetY + randomY - 75   // -75 pour compenser la taille du nœud
      }
    };
    onAddNode(newNode);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex flex-row space-x-4 z-50">
      {/* Bouton pour ajouter un nœud de début */}
      <button
        onClick={() => handleAddNode('start')}
        className="p-4 w-32 rounded-full shadow-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
        aria-label="Ajouter un nœud de début"
        title="Ajouter un nœud de début"
      >
        <PlayIcon className="h-6 w-6" />
        <span className="ml-2 hidden md:inline text-sm font-semibold">Début</span>
      </button>

      {/* Bouton pour ajouter un nœud standard */}
      <button
        onClick={() => handleAddNode('interaction')}
        className="p-4 w-32 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
        aria-label="Ajouter un nœud"
        title="Ajouter un nœud"
      >
        <PlusIcon className="h-6 w-6" />
        <span className="ml-2 hidden md:inline text-sm font-semibold">Nœud</span>
      </button>

      {/* Bouton pour ajouter un nœud de fin */}
      <button
        onClick={() => handleAddNode('end')}
        className="p-4 w-32 rounded-full shadow-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center"
        aria-label="Ajouter un nœud de fin"
        title="Ajouter un nœud de fin"
      >
        <StopIcon className="h-6 w-6" />
        <span className="ml-2 hidden md:inline text-sm font-semibold">Fin</span>
      </button>
    </div>
  );
};

export default NodeButtonGroup;
