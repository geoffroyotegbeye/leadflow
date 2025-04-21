import React, { useState, useEffect } from 'react';
import { XMarkIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAssistantStore } from '../../stores/assistantStore';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { publicUrl, embedScript, getEmbedScript, selectedAssistantId } = useAssistantStore();
  const [activeTab, setActiveTab] = useState<'link' | 'script'>('link');
  const [copied, setCopied] = useState<'link' | 'script' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedAssistantId && (!publicUrl || !embedScript)) {
      loadEmbedData();
    }
  }, [isOpen, selectedAssistantId]);

  const loadEmbedData = async () => {
    if (!selectedAssistantId) return;
    
    setIsLoading(true);
    try {
      await getEmbedScript();
    } catch (error) {
      console.error('Erreur lors de la récupération du script d\'intégration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (type: 'link' | 'script') => {
    const textToCopy = type === 'link' ? publicUrl : embedScript;
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(type);
          setTimeout(() => setCopied(null), 2000);
        })
        .catch(err => {
          console.error('Erreur lors de la copie dans le presse-papier:', err);
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Partager l'assistant</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des informations de partage...</p>
          </div>
        ) : (
          <>
            <div className="flex border-b dark:border-gray-700">
              <button 
                className={`px-4 py-3 font-medium ${activeTab === 'link' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                onClick={() => setActiveTab('link')}
              >
                Lien public
              </button>
              <button 
                className={`px-4 py-3 font-medium ${activeTab === 'script' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                onClick={() => setActiveTab('script')}
              >
                Script d'intégration
              </button>
            </div>

            <div className="p-6 dark:bg-gray-800">
              {activeTab === 'link' ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Lien vers la page de chat</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Partagez ce lien pour permettre à n'importe qui d'accéder à votre assistant via une interface de chat dédiée.
                  </p>
                  
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={publicUrl || ''}
                      readOnly
                      className="flex-grow p-3 border dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard('link')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-r-md transition-colors"
                    >
                      {copied === 'link' ? (
                        <CheckIcon className="w-5 h-5" />
                      ) : (
                        <DocumentDuplicateIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-6">
                    <a 
                      href={publicUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Ouvrir dans un nouvel onglet
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Script d'intégration</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Copiez ce code HTML et collez-le sur votre site web pour intégrer l'assistant directement dans vos pages.
                  </p>
                  
                  <div className="relative">
                    <pre className="bg-gray-800 dark:bg-gray-900 text-white p-4 rounded-md overflow-auto max-h-60">
                      <code>{embedScript || ''}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard('script')}
                      className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-md transition-colors"
                    >
                      {copied === 'script' ? (
                        <CheckIcon className="w-5 h-5" />
                      ) : (
                        <DocumentDuplicateIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      <strong>Note :</strong> Assurez-vous que votre assistant reste publié pour que l'intégration continue de fonctionner.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-md transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
