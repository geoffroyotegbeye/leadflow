// src/stores/assistantStore.ts
import { create } from 'zustand';
import { Node, Edge } from 'reactflow';
import { NodeData } from '../components/flowchart/NodeTypes';
import AssistantService, { EmbedScriptResponse, Assistant } from '../services/api';

interface AssistantState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  selectedAssistantId: string | null;
  isPublished: boolean;
  publicId: string | null;
  embedScript: string | null;
  publicUrl: string | null;
  setSelectedAssistant: (id: string) => void;
  loadAssistant: (id: string) => Promise<void>;
  updateNodes: (nodes: Node<NodeData>[]) => void;
  updateEdges: (edges: Edge[]) => void;
  saveAssistant: () => Promise<boolean | undefined>;
  publishAssistant: (isPublished: boolean) => Promise<Assistant | undefined>;
  getEmbedScript: () => Promise<EmbedScriptResponse | null>;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  selectedAssistantId: null,
  isPublished: false,
  publicId: null,
  embedScript: null,
  publicUrl: null,

  setSelectedAssistant: (id) => set({ selectedAssistantId: id }),

  loadAssistant: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const assistant = await AssistantService.getById(id);
      set({ 
        nodes: assistant.nodes || [],
        edges: assistant.edges || [],
        selectedAssistantId: id,
        isPublished: assistant.is_published || false,
        publicId: assistant.public_id || null,
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
  },

  publishAssistant: async (isPublished) => {
    const { selectedAssistantId } = get();
    if (!selectedAssistantId) return;

    set({ isLoading: true, error: null });
    try {
      const assistant = await AssistantService.publishAssistant(selectedAssistantId, isPublished);
      set({ 
        isPublished: assistant.is_published || false,
        publicId: assistant.public_id || null,
        publicUrl: assistant.public_url || null,
        embedScript: assistant.embed_script || null,
        isLoading: false 
      });
      return assistant;
    } catch (error) {
      set({ 
        error: `Erreur lors de la ${isPublished ? 'publication' : 'dépublication'} de l'assistant`, 
        isLoading: false 
      });
    }
  },

  getEmbedScript: async () => {
    const { selectedAssistantId, isPublished } = get();
    if (!selectedAssistantId || !isPublished) return null;

    set({ isLoading: true, error: null });
    try {
      const response = await AssistantService.getEmbedScript(selectedAssistantId);
      set({ 
        embedScript: response.script,
        publicUrl: response.public_url,
        isLoading: false 
      });
      return response;
    } catch (error) {
      set({ 
        error: "Erreur lors de la génération du script d'intégration", 
        isLoading: false 
      });
      return null;
    }
  }
}));