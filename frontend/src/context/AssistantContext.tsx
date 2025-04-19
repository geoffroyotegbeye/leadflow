// src/contexts/AssistantContext.tsx
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { NodeData } from '../components/flowchart/NodeTypes';
import AssistantService from '../services/api';

// Types et interfaces
// [...]

// Réducteur
const assistantReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ASSISTANT':
      return { 
        ...state, 
        nodes: action.payload.nodes, 
        edges: action.payload.edges,
        selectedAssistantId: action.payload.id
      };
    case 'UPDATE_NODES':
      return { ...state, nodes: action.payload };
    case 'UPDATE_EDGES':
      return { ...state, edges: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Contexte
export const AssistantContext = createContext(null);

// Provider
export const AssistantProvider = ({ children }) => {
  // Implémentation du provider
  // [...]
  
  return (
    <AssistantContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AssistantContext.Provider>
  );
};

// Hook personnalisé
export const useAssistant = () => useContext(AssistantContext);