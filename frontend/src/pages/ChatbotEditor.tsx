import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useToast } from '../components/ui/ToastContainer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ShareModal from '../components/ui/ShareModal';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  MarkerType,
  addEdge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
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
  EyeIcon,
  DocumentCheckIcon,
  ViewfinderCircleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { NodeData, NodeType, NODE_TYPES } from '../components/flowchart/NodeTypes';
import CustomNode from '../components/flowchart/CustomNode';
import NodeEditor from '../components/flowchart/NodeEditor';
import ContextMenu from '../components/flowchart/ContextMenu';
import ChatPreview from '../components/preview/ChatPreview';
import { useParams } from 'react-router-dom';
import { useAssistantStore } from '../stores/assistantStore';

const iconMap = {
  PlayIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  GlobeAltIcon,
  ClockIcon,
  StopIcon,
  EyeIcon,
  DocumentCheckIcon,
  ViewfinderCircleIcon,
  ShareIcon,
};

// Fonction pour créer un nœud de départ par défaut
const createDefaultStartNode = () => ({
  id: 'start',
  type: 'custom',
  position: { x: 100, y: 100 },
  data: {
    label: 'Démarrer',
    type: NodeType.START,
    id: 'start',
    elements: [],
  },
});

interface ContextMenuInfo {
  id: string;
  x: number;
  y: number;
}

const FlowEditor = () => {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const { assistantId } = useParams<{ assistantId: string }>();
  const { showToast } = useToast();

  // État pour la boîte de dialogue de confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // État pour le modal de partage
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Utiliser le store Zustand au lieu des états locaux
  const {
    nodes,
    edges,
    isPublished,
    updateNodes,
    updateEdges,
    loadAssistant,
    saveAssistant,
    setSelectedAssistant,
    publishAssistant
  } = useAssistantStore();

  // Charger le flowchart au montage
  useEffect(() => {
    if (assistantId) {
      // Configurer l'assistant sélectionné
      setSelectedAssistant(assistantId);
      // Charger les données depuis l'API
      loadAssistant(assistantId);
    }
  }, [assistantId, setSelectedAssistant, loadAssistant]);

  // Fonction pour créer des connexions basées sur les options des questions
  const updateOptionConnections = useCallback(() => {
    if (!nodes.length) return;

    // Collecter toutes les connexions d'options
    const optionConnections: Edge[] = [];

    nodes.forEach(node => {
      if (node.data?.elements) {
        node.data.elements.forEach((element: any) => {
          if (element.type === 'question' && element.options) {
            element.options.forEach((option: any, optIndex: number) => {
              if (option.targetNodeId) {
                // Créer une connexion pour cette option
                optionConnections.push({
                  id: `option-edge-${node.id}-${element.id}-${optIndex}`,
                  source: node.id,
                  target: option.targetNodeId,
                  sourceHandle: `option-${element.id}-${optIndex}`,
                  animated: true,
                  style: { stroke: '#10b981' }, // Couleur verte pour les connexions d'options
                  markerEnd: { type: MarkerType.ArrowClosed },
                  data: { optionIndex: optIndex, elementId: element.id, isOptionConnection: true }
                });
              }
            });
          }
        });
      }
    });

    // Filtrer les connexions existantes pour ne garder que celles qui ne sont pas des connexions d'options
    // et celles qui ont été créées manuellement via l'interface
    const regularEdges = edges.filter(edge => {
      // Garder les connexions qui ne sont pas des connexions d'options
      if (!edge.sourceHandle || !edge.sourceHandle.startsWith('option-')) {
        return true;
      }

      // Garder les connexions manuelles d'options (celles qui n'ont pas été créées par updateOptionConnections)
      return !edge.id.startsWith('option-edge-');
    });

    // Vérifier si les connexions ont réellement changé pour éviter les mises à jour infinies
    const newEdges = [...regularEdges, ...optionConnections];
    const currentEdgesStr = JSON.stringify(edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })));
    const newEdgesStr = JSON.stringify(newEdges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })));

    if (currentEdgesStr !== newEdgesStr) {
      updateEdges(newEdges);
    }
  }, [nodes, edges, updateEdges]);

  // Mettre à jour les connexions d'options lorsque les nœuds changent
  useEffect(() => {
    // Utiliser un délai pour éviter les mises à jour pendant le rendu
    const timer = setTimeout(() => {
      updateOptionConnections();
    }, 0);

    return () => clearTimeout(timer);
  }, [nodes, updateOptionConnections]);

  const { setViewport, zoomIn, zoomOut, fitView } = useReactFlow();

  useEffect(() => {
    setViewport({ x: 0, y: 0, zoom: 0.35 });
  }, [setViewport]);

  const [selectedNode, setSelectedNode] = React.useState<Node<NodeData> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuInfo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(() => {
    if (typeof window !== 'undefined' && assistantId) {
      const v = localStorage.getItem(`leadflow:assistant:${assistantId}:panelOpen`);
      return v === 'true';
    }
    return false;
  });

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Appliquer les changements aux nœuds
      const updatedNodes = applyNodeChanges(changes, nodes);
      updateNodes(updatedNodes);
    },
    [nodes, updateNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Appliquer les changements aux arêtes
      const updatedEdges = applyEdgeChanges(changes, edges);
      updateEdges(updatedEdges);
    },
    [edges, updateEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Vérifier si la connexion provient d'un handle d'option
      const isOptionConnection = params.sourceHandle && params.sourceHandle.startsWith('option-');

      // Créer la connexion avec le style approprié
      const newEdge = {
        ...params,
        animated: true,
        style: { stroke: isOptionConnection ? '#10b981' : '#64748b' },
        markerEnd: { type: MarkerType.ArrowClosed },
        data: isOptionConnection ? { isOptionConnection: true } : undefined
      };

      const updatedEdges = addEdge(newEdge, edges);
      updateEdges(updatedEdges);

      // Si c'est une connexion d'option, mettre à jour l'option dans le nœud source
      if (isOptionConnection) {
        const [_, elementId, optionIndexStr] = params.sourceHandle?.split('-') || [];
        const optionIndex = parseInt(optionIndexStr, 10);

        if (!isNaN(optionIndex) && elementId) {
          const updatedNodes = nodes.map((node) => {
            if (node.id === params.source) {
              // Trouver l'élément et mettre à jour l'option
              const updatedElements = node.data?.elements?.map((element: any) => {
                if (element.id === elementId && element.options) {
                  const updatedOptions = [...element.options];
                  if (updatedOptions[optionIndex]) {
                    updatedOptions[optionIndex] = {
                      ...updatedOptions[optionIndex],
                      targetNodeId: params.target
                    };
                  }
                  return { ...element, options: updatedOptions };
                }
                return element;
              });

              return {
                ...node,
                data: { ...node.data, elements: updatedElements }
              };
            }
            return node;
          });

          updateNodes(updatedNodes);
        }
      }
    },
    [edges, nodes, updateEdges, updateNodes]
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

      // Filtrer les nœuds pour supprimer celui qui est sélectionné
      const updatedNodes = nodes.filter(node => node.id !== selectedNode.id);
      // Filtrer les edges pour supprimer celles liées au nœud
      const updatedEdges = edges.filter(
        edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      );

      // Mettre à jour le store
      updateNodes(updatedNodes);
      updateEdges(updatedEdges);

      setIsEditorOpen(false);
      setContextMenu(null);
      setSelectedNode(null);
    }
  }, [selectedNode, nodes, edges, updateNodes, updateEdges]);

  const duplicateNode = useCallback(() => {
    if (selectedNode) {
      // Ne pas dupliquer le nœud de départ
      if (selectedNode.id === 'start') {
        return;
      }

      // Créer un nouvel ID unique pour le nœud dupliqué
      const newNodeId = `${selectedNode.data.type || 'node'}-${Date.now()}`;

      // Créer une copie profonde des données du nœud
      const nodeDataCopy = JSON.parse(JSON.stringify(selectedNode.data));

      // Créer le nouveau nœud avec les mêmes données mais un nouvel ID
      const newNode = {
        id: newNodeId,
        type: 'custom',
        // Positionner le nouveau nœud légèrement décalé par rapport à l'original
        position: {
          x: selectedNode.position.x + 50,
          y: selectedNode.position.y + 50
        },
        data: {
          ...nodeDataCopy,
          label: `${nodeDataCopy.label} (copie)`
        }
      };

      // Ajouter le nouveau nœud au graphe
      updateNodes([...nodes, newNode]);

      // Fermer l'éditeur du nœud actuel
      setIsEditorOpen(false);

      // Sélectionner le nouveau nœud et ouvrir son éditeur
      setTimeout(() => {
        setSelectedNode(newNode);
        setIsEditorOpen(true);
      }, 100);
    }
  }, [selectedNode, nodes, updateNodes]);

  const addNode = useCallback((type: NodeType) => {
    const newNodeId = `${type}-${Date.now()}`;
    const newNode: Node<NodeData> = {
      id: newNodeId,
      type: 'custom',
      position: { x: 100, y: 100 },
      data: {
        label: NODE_TYPES[type].label,
        type: type,
        id: newNodeId,
        elements: [],
      },
    };

    // Ajouter le nouveau nœud à la liste existante
    updateNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    setIsEditorOpen(true);
  }, [nodes, updateNodes]);

  const handleNodeUpdate = useCallback((data: NodeData) => {
    if (selectedNode) {
      // Mettre à jour le nœud sélectionné avec les nouvelles données
      const updatedNodes = nodes.map(node =>
        node.id === selectedNode.id ? { ...node, data } : node
      );

      // Mettre à jour le store
      updateNodes(updatedNodes);

      // Ne pas appeler updateOptionConnections ici, l'effet s'en chargera
    }
  }, [selectedNode, nodes, updateNodes]);

  return (
    <div className="flow-editor">
      {/* Le panel latéral a été remplacé par la modal ElementPicker */}

      <div className={`absolute top-20 right-4 z-10 flex space-x-2 transition-all duration-300 ease-in-out ${isPreviewOpen ? 'mr-96' : ''}`}>
        <button
          onClick={() => {
            if (!assistantId) return;

            // Créer un élément input de type file invisible
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';

            // Gérer l'événement de changement de fichier
            fileInput.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              const file = target.files?.[0];

              if (file) {
                const reader = new FileReader();

                reader.onload = (event) => {
                  try {
                    const jsonContent = event.target?.result as string;
                    const parsedData = JSON.parse(jsonContent);

                    // Vérifier que le JSON contient des nodes et des edges
                    if (parsedData.nodes && parsedData.edges) {
                      // Mettre à jour le flowchart avec les données importées
                      updateNodes(parsedData.nodes);
                      updateEdges(parsedData.edges);

                      // Sauvegarder dans le localStorage
                      const storageKey = `leadflow:assistant:${assistantId}:flowchart`;
                      localStorage.setItem(storageKey, jsonContent);

                      alert('Flowchart importé avec succès!');
                    } else {
                      alert('Format JSON invalide. Le fichier doit contenir des nodes et des edges.');
                    }
                  } catch (error) {
                    console.error('Erreur lors de l\'importation du JSON:', error);
                    alert('Erreur lors de l\'importation du JSON. Vérifiez le format du fichier.');
                  }
                };

                reader.readAsText(file);
              }

              // Nettoyer l'élément input
              document.body.removeChild(fileInput);
            };

            // Ajouter l'élément au DOM et déclencher le clic
            document.body.appendChild(fileInput);
            fileInput.click();
          }}
          className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Importer JSON
        </button>
        <button
          onClick={() => {
            if (!assistantId || !nodes.length) return;

            // Créer un objet avec les données actuelles du store
            const data = JSON.stringify({ nodes, edges });

            // Générer le fichier JSON pour téléchargement
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assistant-${assistantId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Flowchart exporté avec succès!');
          }}
          className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Exporter JSON
        </button>
        <button
          onClick={() => {
            // Sauvegarder manuellement
            saveAssistant().then(() => {
              showToast({
                type: 'success',
                message: 'Flowchart sauvegardé avec succès!'
              });
            }).catch(() => {
              showToast({
                type: 'error',
                message: 'Impossible de sauvegarder le flowchart. Veuillez réessayer.'
              });
            });
          }}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <DocumentCheckIcon className="w-5 h-5 mr-2" />
          Sauvegarder
        </button>
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <EyeIcon className="w-5 h-5 mr-2" />
          Prévisualiser
        </button>
        <button
          onClick={() => fitView({ padding: 0.5, includeHiddenNodes: true })}
          className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ViewfinderCircleIcon className="w-5 h-5 mr-2" />
          Recentrer
        </button>
        <button
          onClick={async () => {
            // Sauvegarder d'abord l'assistant
            await saveAssistant();

            // Demander confirmation pour la publication/dépublication
            setConfirmDialog({
              isOpen: true,
              title: isPublished ? 'Dépublier l\'assistant' : 'Publier l\'assistant',
              message: isPublished
                ? 'Voulez-vous vraiment dépublier cet assistant ? Il ne sera plus accessible via son lien public.'
                : 'Voulez-vous publier cet assistant ? Il sera accessible publiquement via un lien dédié.',
              onConfirm: async () => {
                try {
                  await publishAssistant(!isPublished);
                  showToast({
                    type: 'success',
                    message: isPublished
                      ? 'L\'assistant a été dépublié avec succès.'
                      : 'L\'assistant a été publié avec succès.'
                  });

                  // Si on vient de publier l'assistant, ouvrir le modal de partage
                  if (!isPublished) {
                    setIsShareModalOpen(true);
                  }
                } catch (error) {
                  showToast({
                    type: 'error',
                    message: `Erreur lors de la ${isPublished ? 'dépublication' : 'publication'} de l'assistant.`
                  });
                }
              }
            });
          }}
          className={`flex items-center px-3 py-2 ${isPublished ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-teal-600 hover:bg-teal-700'} text-white rounded-lg transition-colors`}
        >
          {isPublished ? (
            <>
              <GlobeAltIcon className="w-5 h-5 mr-2" />
              Publié
            </>
          ) : (
            <>
              <GlobeAltIcon className="w-5 h-5 mr-2" />
              Publier
            </>
          )}
        </button>
        {isPublished && (
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ShareIcon className="w-5 h-5 mr-2" />
            Partager
          </button>
        )}
      </div>

      <div className={`flow-editor-container ${!isSidebarOpen ? 'sidebar-collapsed' : ''} ${isPreviewOpen ? 'preview-open' : ''}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onEdgeClick={(event, edge) => {
            // Fonction pour supprimer la connexion
            const deleteConnection = () => {
              // Supprimer la connexion
              const updatedEdges = edges.filter((e) => e.id !== edge.id);
              updateEdges(updatedEdges);

              // Si c'est une connexion d'option, mettre à jour l'option dans le nœud source
              if (edge.sourceHandle && edge.sourceHandle.startsWith('option-')) {
                const [_, elementId, optionIndexStr] = edge.sourceHandle.split('-');
                const optionIndex = parseInt(optionIndexStr, 10);

                if (!isNaN(optionIndex) && elementId) {
                  const updatedNodes = nodes.map((node) => {
                    if (node.id === edge.source) {
                      // Trouver l'élément et réinitialiser l'option
                      const updatedElements = node.data?.elements?.map((element: any) => {
                        if (element.id === elementId && element.options) {
                          const updatedOptions = [...element.options];
                          if (updatedOptions[optionIndex]) {
                            updatedOptions[optionIndex] = {
                              ...updatedOptions[optionIndex],
                              targetNodeId: undefined
                            };
                          }
                          return { ...element, options: updatedOptions };
                        }
                        return element;
                      });

                      return {
                        ...node,
                        data: { ...node.data, elements: updatedElements }
                      };
                    }
                    return node;
                  });

                  // Mettre à jour les nœuds
                  updateNodes(updatedNodes);
                }
              }

              // Afficher une notification de succès
              showToast({
                type: 'success',
                message: 'La connexion a été supprimée avec succès'
              });
            };

            // Si la touche Alt est enfoncée, supprimer directement la connexion sans confirmation
            if (event.altKey) {
              deleteConnection();
              return;
            }

            // Sinon, demander confirmation avant de supprimer la connexion
            setConfirmDialog({
              isOpen: true,
              title: 'Supprimer la connexion',
              message: 'Êtes-vous sûr de vouloir supprimer cette connexion ?',
              onConfirm: () => {
                deleteConnection();
              }
            });
          }}
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

        <div className={`flow-add-buttons transition-all duration-300 ease-in-out ${isPreviewOpen ? 'mr-96' : ''}`}>
          <button
            onClick={() => addNode(NodeType.INTERACTION)}
            className="flow-add-button mb-2"
            title="Ajouter un nœud d'interaction"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => addNode(NodeType.END)}
            className="flow-add-button bg-red-600 hover:bg-red-700"
            title="Ajouter un nœud de fin"
          >
            <StopIcon className="w-6 h-6" />
          </button>
        </div>

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

      {isPreviewOpen && (
        <ChatPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          assistantId={assistantId}
        />
      )}

      {/* Persistance de l'état du panel */}
      {useEffect(() => {
        if (assistantId) {
          localStorage.setItem(`leadflow:assistant:${assistantId}:panelOpen`, isPreviewOpen ? 'true' : 'false');
        }
      }, [isPreviewOpen, assistantId])}

      <NodeEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedNode(null);
        }}
        node={selectedNode?.data || null}
        onSave={handleNodeUpdate}
        onDelete={selectedNode?.id !== 'start' ? deleteNode : undefined}
        onDuplicate={selectedNode?.id !== 'start' ? duplicateNode : undefined}
      />

      {/* Boîte de dialogue de confirmation */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
      
      {/* Modal de partage */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </div>
  );
};

const ChatbotEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
};

export default ChatbotEditor;
