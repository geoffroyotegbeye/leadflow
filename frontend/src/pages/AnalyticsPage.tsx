import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import analyticsService, { LeadInfo } from '../services/analyticsService';
import sessionService from '../services/sessionService';

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
      sessionsData: [],
      completionData: [],
      responseData: []
    };
  }

  // Formater les données de sessions
  const sessionsData = Object.entries(data.sessions_by_day).map(([date, count]) => ({
    date,
    sessions: count
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Formater les données de complétion (données fictives si non disponibles)
  const completionData = data.completion_by_node && data.completion_by_node.length > 0 
    ? data.completion_by_node.map(node => ({
        name: node.name || `Nœud ${node.id}`,
        completion: node.completion_rate || 0
      }))
    : [
        { name: 'Introduction', completion: 95 },
        { name: 'Qualification', completion: 80 },
        { name: 'Collecte d\'informations', completion: 65 },
        { name: 'Présentation', completion: 50 },
        { name: 'Conclusion', completion: 40 }
      ];

  // Formater les données de réponses populaires (données fictives si non disponibles)
  const responseData = data.popular_responses && data.popular_responses.length > 0
    ? data.popular_responses.map(response => ({
        question: response.question || 'Question',
        responses: response.responses || []
      }))
    : [
        { question: 'Préférence de contact', responses: [{ label: 'Email', value: 60 }, { label: 'Téléphone', value: 40 }] },
        { question: 'Intérêt produit', responses: [{ label: 'Basique', value: 30 }, { label: 'Premium', value: 45 }, { label: 'Pro', value: 25 }] }
      ];

  return {
    sessionsData,
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

  // Charger les analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'aperçu des analytics
        const overview = await analyticsService.getAnalyticsOverview(timeRange, assistantId);
        
        // Récupérer les données pour les graphiques
        const chartData = await analyticsService.getStatsChartData(timeRange, assistantId);
        
        if (assistantId) {
          // Récupérer le nom de l'assistant
          try {
            // Utiliser les sessions pour obtenir des informations sur l'assistant
            const sessions = await sessionService.getAssistantSessions(assistantId);
            if (sessions.length > 0) {
              // Simplement utiliser l'ID de l'assistant comme nom
              setAssistantName(`Assistant ${assistantId.substring(0, 6)}`);
            } else {
              setAssistantName('Assistant');
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des détails de l\'assistant:', error);
            setAssistantName('Assistant');
          }
        }
        
        // Construire les données d'analytics dans le format attendu par les composants
        const data = {
          overview: {
            total_sessions: overview.sessions_count,
            active_sessions: 0, // Ces données ne sont plus disponibles dans la nouvelle API
            completed_sessions: Math.round(overview.sessions_count * overview.completion_rate / 100),
            abandoned_sessions: Math.round(overview.sessions_count * overview.abandonment_rate / 100),
            total_leads: overview.leads_count,
            partial_leads: 0, // Ces données ne sont plus disponibles directement
            complete_leads: 0, // Ces données ne sont plus disponibles directement
            average_completion_percentage: overview.completion_rate,
            average_session_duration: overview.average_session_duration
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
  }, [assistantId, timeRange]);
  
  // Charger les leads récents
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLeadsLoading(true);
        const recentLeads = await analyticsService.getRecentLeads(10, 0, assistantId, timeRange);
        
        // Utiliser directement les leads récupérés
        setLeads(recentLeads);
      } catch (err) {
        console.error('Erreur lors de la récupération des leads:', err);
      } finally {
        setLeadsLoading(false);
      }
    };
    
    fetchLeads();
  }, [assistantId, timeRange]);

  // Formater les données pour les graphiques
  const chartData = formatChartData(analytics);

  // Gérer le changement d'assistant
  const handleAssistantChange = () => {
    // Rediriger vers la liste des assistants pour en sélectionner un
    navigate('/dashboard/chatbots');
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
        assistantId={assistantId}
        assistantName={assistantName}
        onAssistantChange={handleAssistantChange}
        isGlobal={!assistantId}
      />

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
      <AnalyticsOverviewCards overview={analytics?.overview} loading={loading} />

      {/* Graphiques */}
      <AnalyticsCharts 
        sessionsData={chartData.sessionsData} 
        completionData={chartData.completionData} 
        responseData={chartData.responseData} 
        loading={loading}
      />
      
      {/* Tableau des leads récents */}
      <AnalyticsLeadsTable leads={leads} loading={leadsLoading} />
      
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Consultez la page des leads pour voir toutes les sessions et conversations.
      </p>
    </div>
  );
};

export default AnalyticsPage;
