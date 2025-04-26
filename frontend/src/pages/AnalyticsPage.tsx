import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import analyticsService, { LeadInfo } from '../services/analyticsService';
import sessionService from '../services/sessionService';
import AssistantService, { Assistant } from '../services/api';

// Interface pour les données d'analytics formatées pour les composants
interface AnalyticsResponse {
  overview: {
    total_sessions: number;
    active_sessions: number;
    completed_sessions: number;
    abandoned_sessions: number;
    total_leads: number;
    partial_leads: number;
    complete_leads: number;
    average_completion_percentage: number;
    average_session_duration: number;
    sessions_count?: number;
    leads_count?: number;
    completion_rate?: number;
    abandonment_rate?: number;
  };
  sessions_by_day: Record<string, number>;
  leads_by_day: Record<string, number>;
  completion_by_node: Array<Record<string, any>>;
  popular_responses: Array<Record<string, any>>;
  average_time_by_node: Array<Record<string, any>>;
}

// Composants
import AnalyticsOverviewCards from '../components/analytics/AnalyticsOverviewCards';
import AnalyticsCharts from '../components/analytics/AnalyticsCharts';
import AnalyticsLeadsTable from '../components/analytics/AnalyticsLeadsTable';
import AnalyticsFilters from '../components/analytics/AnalyticsFilters';

// Fonction pour formater les données pour les graphiques
const formatChartData = (data: AnalyticsResponse | null) => {
  if (!data) {
    return {
      completionData: [],
      responseData: []
    };
  }

  // Formater les données de complétion
  const completionData = data.completion_by_node && data.completion_by_node.length > 0 
    ? data.completion_by_node.map(node => ({
        node_id: node.node_id,
        node_label: node.node_label || `Nœud ${node.node_id}`,
        completion_rate: node.completion_rate || 0
      }))
    : [
        { node_id: '1', node_label: 'Introduction', completion_rate: 95 },
        { node_id: '2', node_label: 'Qualification', completion_rate: 80 },
        { node_id: '3', node_label: 'Collecte d\'informations', completion_rate: 65 },
        { node_id: '4', node_label: 'Présentation', completion_rate: 50 },
        { node_id: '5', node_label: 'Conclusion', completion_rate: 40 }
      ];

  // Formater les données de réponses populaires
  let responseData: any[] = [];
  
  if (data.popular_responses) {
    // Convertir l'objet en tableau
    Object.entries(data.popular_responses).forEach(([_, responses]) => {
      Object.entries(responses as Record<string, number>).forEach(([value, count]) => {
        responseData.push({ value, count });
      });
    });
  }
  
  // Si aucune donnée n'est disponible, utiliser des données fictives
  if (responseData.length === 0) {
    responseData = [
      { value: 'Email', count: 60 },
      { value: 'Téléphone', count: 40 },
      { value: 'Basique', count: 30 },
      { value: 'Premium', count: 45 },
      { value: 'Pro', count: 25 }
    ];
  }

  return {
    completionData,
    responseData
  };
};

const AnalyticsPage = () => {
  const { assistantId } = useParams();
  const navigate = useNavigate();
  
  // États
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [leads, setLeads] = useState<LeadInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [leadsLoading, setLeadsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [assistantName, setAssistantName] = useState<string>('');
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | undefined>(assistantId);
  const [assistants, setAssistants] = useState<Assistant[]>([]);

  // Mettre à jour l'ID de l'assistant sélectionné quand l'URL change
  useEffect(() => {
    setSelectedAssistantId(assistantId);
  }, [assistantId]);

  // Charger les analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 Récupération des analytics pour:', selectedAssistantId || 'global', 'période:', timeRange, 'jours');
        
        // Récupérer l'aperçu des analytics
        const overview = await analyticsService.getAnalyticsOverview(timeRange, selectedAssistantId);
        console.log('📊 Aperçu des analytics reçu:', overview);
        
        // Récupérer les données pour les graphiques
        const chartData = await analyticsService.getStatsChartData(timeRange, selectedAssistantId);
        console.log('📈 Données des graphiques reçues:', chartData);
        
        if (selectedAssistantId) {
          // Récupérer le nom de l'assistant
          try {
            // Utiliser les sessions pour obtenir des informations sur l'assistant
            const sessions = await sessionService.getAssistantSessions(selectedAssistantId);
            console.log('👤 Sessions de l\'assistant récupérées:', sessions.length, 'sessions trouvées');
            
            if (sessions.length > 0) {
              // Simplement utiliser l'ID de l'assistant comme nom
              setAssistantName(`Assistant ${selectedAssistantId.substring(0, 6)}`);
            } else {
              setAssistantName('Assistant');
            }
          } catch (err) {
            console.error('❌ Erreur lors de la récupération des sessions de l\'assistant:', err);
            setAssistantName('Assistant');
          }
        }
        
        // Construire les données d'analytics dans le format attendu par les composants
        const data: AnalyticsResponse = {
          overview: {
            total_sessions: overview.total_sessions || 0,
            active_sessions: overview.active_sessions || 0,
            completed_sessions: overview.completed_sessions || 0,
            abandoned_sessions: overview.abandoned_sessions || 0,
            total_leads: overview.total_leads || 0,
            partial_leads: overview.partial_leads || 0,
            complete_leads: overview.complete_leads || 0,
            average_completion_percentage: overview.average_completion_percentage || 0,
            average_session_duration: overview.average_session_duration || 0
          },
          sessions_by_day: chartData.sessionsData.reduce((acc: Record<string, number>, item) => {
            acc[item.date] = item.sessions;
            return acc;
          }, {}),
          leads_by_day: chartData.leadsData.reduce((acc: Record<string, number>, item) => {
            acc[item.date] = item.leads;
            return acc;
          }, {}),
          completion_by_node: [], // Ces données ne sont plus disponibles dans le même format
          popular_responses: [], // Ces données ne sont plus disponibles dans le même format
          average_time_by_node: [] // Ces données ne sont plus disponibles dans le même format
        };
        
        console.log('🔄 Données formatées pour l\'affichage:', data);
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des analytics:', err);
        setError('Impossible de charger les données d\'analytics. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedAssistantId, timeRange]);
  
  // Charger les assistants liés à l'utilisateur connecté
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const data = await AssistantService.getAll();
        setAssistants(data);
      } catch (e) {
        setAssistants([]);
      }
    };
    fetchAssistants();
  }, []);

  // Récupérer les leads récents avec leurs conversations complètes
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        console.log('🔍 Début de la récupération des leads pour:', selectedAssistantId || 'vue globale');
        setLeadsLoading(true);
        
        if (selectedAssistantId) {
          // Vue spécifique à un assistant - récupérer les conversations complètes
          console.log('🔍 Récupération des leads avec conversations pour l\'assistant:', selectedAssistantId);
          const leadsWithConversations = await analyticsService.getLeadsWithConversations(selectedAssistantId, 'complete');
          console.log('📊 Leads avec conversations récupérés:', leadsWithConversations.length, leadsWithConversations);
          
          // Transformer les données pour correspondre au format LeadInfo
          const formattedLeads = leadsWithConversations.map((lead: any) => ({
            id: lead.id,
            assistant_name: assistantName || 'Assistant',
            lead_status: lead.lead_status,
            created_at: lead.started_at,
            completion_percentage: lead.completion_percentage,
            lead_info: lead.lead_info || {},
            user_info: lead.user_info || {},
            // Ajouter les messages pour l'affichage de la conversation
            messages: lead.messages || []
          }));
          
          console.log('📋 Leads formatés:', formattedLeads.length, formattedLeads);
          setLeads(formattedLeads);
        } else {
          // Pour la vue globale, utiliser la méthode existante
          console.log('🔍 Récupération des leads récents pour la vue globale');
          const recentLeads = await analyticsService.getRecentLeads(10, 0, selectedAssistantId, timeRange);
          console.log('📊 Leads récents récupérés:', recentLeads.length, recentLeads);
          setLeads(recentLeads);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des leads:', error);
        setLeads([]);
      } finally {
        setLeadsLoading(false);
      }
    };
    
    fetchLeads();
  }, [selectedAssistantId, assistantName, timeRange]);

  // Formater les données pour les graphiques
  const chartData = formatChartData(analytics);
  console.log('📊 Données formatées pour les graphiques:', chartData);

  // Gérer le changement d'assistant
  const handleAssistantChange = (assistantId: string) => {
    console.log('🔄 Changement d\'assistant:', assistantId);
    // Rediriger vers la page d'analytiques de l'assistant sélectionné
    if (assistantId) {
      navigate(`/dashboard/analytics/${assistantId}`);
    } else {
      // Si aucun assistant n'est sélectionné, afficher les analytiques globales
      navigate('/dashboard/analytics');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-300">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-700 dark:text-yellow-300">
          <p>Aucune donnée d'analytique disponible pour cet assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filtres */}
      <AnalyticsFilters
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        assistantId={selectedAssistantId}
        assistantName={assistantName}
        onAssistantChange={handleAssistantChange}
        isGlobal={!selectedAssistantId}
      />
      {/* Pas besoin d'un second sélecteur ici, car AnalyticsFilters contient déjà un AssistantSelector */}
      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <ArrowPathIcon className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Vue d'ensemble */}
      <AnalyticsOverviewCards overview={analytics.overview} loading={loading} />

      {/* Graphiques */}
      {/* <AnalyticsCharts 
        completionData={chartData.completionData} 
        responseData={chartData.responseData} 
        loading={loading}
      /> */}
      
      {/* Tableau des leads récents */}
      <AnalyticsLeadsTable leads={leads} loading={leadsLoading} />
      
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Consultez la page des leads pour voir toutes les sessions et conversations.
      </p>
    </div>
  );
};

export default AnalyticsPage;
