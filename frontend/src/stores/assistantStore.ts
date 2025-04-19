// src/stores/assistantStore.ts
import { create } from 'zustand';
import { Node, Edge } from 'reactflow';
import { NodeData } from '../components/flowchart/NodeTypes';
import AssistantService from '../services/api';

interface AssistantState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  selectedAssistantId: string | null;
  setSelectedAssistant: (id: string) => void;
  loadAssistant: (id: string) => Promise<void>;
  updateNodes: (nodes: Node<NodeData>[]) => void;
  updateEdges: (edges: Edge[]) => void;
  saveAssistant: () => Promise<void>;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  selectedAssistantId: null,
  
  setSelectedAssistant: (id) => set({ selectedAssistantId: id }),
  
  loadAssistant: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const assistant = await AssistantService.getById(id);
      set({ 
        nodes: assistant.nodes || [],
        edges: assistant.edges || [],
        selectedAssistantId: id,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: "Erreur lors du chargement de l'assistant", 
        isLoading: false 
      });
    }
  },
  
  updateNodes: (nodes) => set({ nodes }),
  updateEdges: (edges) => set({ edges }),
  
  saveAssistant: async () => {
    const { selectedAssistantId, nodes, edges } = get();
    if (!selectedAssistantId) return;
    
    try {
      await AssistantService.saveFlowchart(selectedAssistantId, nodes, edges);
      return true;
    } catch (error) {
      set({ error: "Erreur lors de la sauvegarde" });
      return false;
    }
  }
}));