import axios from 'axios';
import { API_URL } from '../config';
import Cookies from 'js-cookie';

// Configuration des cookies - même constante que dans api.ts
const TOKEN_COOKIE = 'leadflow_token';

// Créer un client axios avec les headers d'authentification
const analyticsClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Ajouter le token d'authentification à chaque requête
analyticsClient.interceptors.request.use(config => {
  // Utiliser Cookies.get au lieu de localStorage pour être cohérent avec apiClient
  const token = Cookies.get(TOKEN_COOKIE);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log(`🔒 Token d'authentification ajouté pour ${config.method?.toUpperCase()} ${config.url}`);
  } else {
    console.warn(`⚠️ Aucun token d'authentification trouvé pour ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

/**
 * Service pour gérer les données d'analytics et de leads
 */
export interface AnalyticsOverview {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  total_leads: number;
  partial_leads: number;
  complete_leads: number;
  average_completion_percentage: number;
  average_session_duration: number;
}

export interface TimeSeriesData {
  sessions: Array<{ date: string; count: number }>;
  leads: Array<{ date: string; status: string; count: number }>;
}

export interface NodePerformance {
  node_id: string;
  node_name: string;
  visits: number;
  completions: number;
  completion_rate: number;
  average_time: number;
  is_lead_node: boolean;
}

export interface TrafficSource {
  source: string;
  count: number;
}

export interface LeadInfo {
  id: string;
  assistant_name: string;
  lead_status: string;
  created_at: string;
  completion_percentage: number;
  lead_info: Record<string, string>;
  user_info: Record<string, string>;
  conversations?: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: string | number;
    content_type?: string;
    is_question?: boolean;
  }>;
  user_responses?: Array<{
    id?: string;
    node_id: string;
    field_name: string;
    response_value: string;
    timestamp: string | number;
  }>;
  qa_pairs?: Array<{
    id?: string;
    node_id?: string;
    question: string;
    answer: string;
    timestamp: string | number;
  }>;
  form_submissions?: Array<{
    id?: string;
    node_id?: string;
    form_data: Record<string, any>;
    timestamp: string | number;
  }>;
}

export interface RecentActivity {
  id: string;
  type: 'lead' | 'conversation' | 'assistant';
  label: string;
  detail: string;
  date: string;
  assistantId?: string;
  assistantName?: string;
}

/**
 * Enregistre un message (question ou réponse) pendant le parcours conversationnel
 */
export async function trackMessage(
  sessionId: string,
  content: string,
  sender: "user" | "bot",
  isQuestion: boolean,
  messageType: string = "text",
  nodeId?: string
) {
  await analyticsClient.post("/track_message", {
    session_id: sessionId,
    content,
    sender,
    is_question: isQuestion,
    message_type: messageType,
    node_id: nodeId,
  });
}

class AnalyticsService {
  /**
   * Récupère les statistiques d'aperçu pour tous les assistants ou un assistant spécifique
   */
  async getAnalyticsOverview(days: number = 30, assistantId?: string): Promise<AnalyticsOverview> {
    try {
      const queryParams = new URLSearchParams({ days: days.toString() });
      if (assistantId) {
        queryParams.append('assistant_id', assistantId);
      }
      
      const response = await analyticsClient.get(`/analytics/overview?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'aperçu des analytics:', error);
      throw error;
    }
  }

  /**
   * Récupère les données de séries temporelles pour les sessions et les leads
   */
  async getTimeSeriesData(days: number = 30, assistantId?: string): Promise<TimeSeriesData> {
    try {
      const queryParams = new URLSearchParams({ days: days.toString() });
      if (assistantId) {
        queryParams.append('assistant_id', assistantId);
      }
      
      const response = await analyticsClient.get(`/analytics/time-series?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des séries temporelles:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des leads récents
   */
  async getRecentLeads(limit: number = 20, offset: number = 0, assistantId?: string, days: number = 30): Promise<LeadInfo[]> {
    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        days: days.toString()
      });
      
      if (assistantId) {
        queryParams.append('assistant_id', assistantId);
      }
      
      const response = await analyticsClient.get(`/analytics/leads?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des leads récents:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les leads avec leurs conversations complètes
   * @param assistantId ID de l'assistant
   * @param leadType Type de lead (complet ou partiel)
   */
  async getLeadsWithConversations(assistantId: string, leadType: 'complete' | 'partial' = 'complete'): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        assistant_id: assistantId,
        lead_type: leadType
      });
      
      const response = await analyticsClient.get(`/analytics/leads/conversations?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des leads avec conversations:', error);
      
      // Pour le développement, retourner des données de démo si l'API n'est pas encore implémentée
      return [
        {
          id: '1',
          assistant_name: 'RH Assistant',
          lead_status: 'complete',
          created_at: '2023-04-23T10:30:00Z',
          completion_percentage: 100,
          lead_info: { email: 'alice@example.com', name: 'Alice Dupont' },
          user_info: { source: 'website', browser: 'Chrome' },
          conversations: [
            { id: '1', content: 'Bonjour, comment puis-je vous aider ?', sender: 'bot', timestamp: '2023-04-23T10:30:05Z', is_question: true },
            { id: '2', content: 'Je cherche des informations sur vos services', sender: 'user', timestamp: '2023-04-23T10:30:15Z', is_question: false },
            { id: '3', content: 'Bien sûr, je peux vous aider. Pouvez-vous me donner votre email ?', sender: 'bot', timestamp: '2023-04-23T10:30:25Z', is_question: true },
            { id: '4', content: 'alice@example.com', sender: 'user', timestamp: '2023-04-23T10:30:35Z', is_question: false }
          ],
          user_responses: [
            { id: '1', node_id: 'email_node', field_name: 'email', response_value: 'alice@example.com', timestamp: '2023-04-23T10:30:35Z' }
          ],
          qa_pairs: [
            { id: '1', question: 'Quel est votre budget ?', answer: '5000€', timestamp: '2023-04-23T10:31:15Z' },
            { id: '2', question: 'Quand souhaitez-vous démarrer ?', answer: 'Le mois prochain', timestamp: '2023-04-23T10:31:45Z' }
          ],
          form_submissions: [
            { 
              id: '1',
              form_data: { 
                name: 'Alice Dupont', 
                email: 'alice@example.com',
                phone: '0612345678',
                company: 'ABC Corp'
              }, 
              timestamp: '2023-04-23T10:32:15Z' 
            }
          ]
        }
      ];
    }
  }

  /**
   * Récupère les performances par nœud pour un assistant spécifique
   */
  async getNodePerformance(assistantId: string, days: number = 30): Promise<NodePerformance[]> {
    try {
      const response = await analyticsClient.get(`/analytics/node-performance?assistant_id=${assistantId}&days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des performances par nœud:', error);
      throw error;
    }
  }

  /**
   * Récupère les sources de trafic
   */
  async getTrafficSources(days: number = 30, assistantId?: string): Promise<TrafficSource[]> {
    try {
      const queryParams = new URLSearchParams({ days: days.toString() });
      if (assistantId) {
        queryParams.append('assistant_id', assistantId);
      }
      
      const response = await analyticsClient.get(`/analytics/sources?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des sources de trafic:', error);
      throw error;
    }
  }

  /**
   * Récupère les réponses des utilisateurs pour un assistant spécifique
   */
  async getUserResponses(assistantId: string, days: number = 30): Promise<Record<string, Record<string, Record<string, number>>>> {
    try {
      const response = await analyticsClient.get(`/analytics/responses?assistant_id=${assistantId}&days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des réponses utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Récupère les activités récentes (leads, conversations, créations d'assistants)
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      // Utiliser les leads récents comme activités récentes pour le moment
      const leads = await this.getRecentLeads(limit);
      
      return leads.map(lead => ({
        id: lead.id,
        type: 'lead',
        label: 'Nouveau lead',
        detail: Object.values(lead.lead_info)[0] || 'Informations non disponibles',
        date: new Date(lead.created_at).toLocaleString(),
        assistantName: lead.assistant_name
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des activités récentes:', error);
      
      // Pour le développement, retourner des données de démo si l'API n'est pas encore implémentée
      return [
        { id: '1', type: 'lead', label: 'Nouveau lead', detail: 'alice@example.com', date: '2023-04-23 00:41', assistantId: '1', assistantName: 'RH Assistant' },
        { id: '2', type: 'conversation', label: 'Nouvelle conversation', detail: 'RH Assistant', date: '2023-04-22 22:14', assistantId: '1', assistantName: 'RH Assistant' },
        { id: '3', type: 'assistant', label: 'Assistant créé', detail: 'Support', date: '2023-04-22 19:05', assistantId: '2', assistantName: 'Support' },
        { id: '4', type: 'conversation', label: 'Nouvelle conversation', detail: 'Ventes', date: '2023-04-22 18:44', assistantId: '3', assistantName: 'Ventes' },
      ];
    }
  }

  /**
   * Récupère les données pour les graphiques de statistiques
   */
  async getStatsChartData(days: number = 30, assistantId?: string): Promise<{
    leadsData: any[];
    sessionsData: any[];
  }> {
    try {
      const timeSeriesData = await this.getTimeSeriesData(days, assistantId);
      
      // Transformer les données pour les graphiques
      const sessionsData = timeSeriesData.sessions.map(item => ({
        date: item.date,
        sessions: item.count
      }));
      
      // Agréger les leads par date
      const leadsByDate: Record<string, { partial: number; complete: number; total: number }> = {};
      
      timeSeriesData.leads.forEach(item => {
        if (!leadsByDate[item.date]) {
          leadsByDate[item.date] = { partial: 0, complete: 0, total: 0 };
        }
        
        if (item.status === 'partial') {
          leadsByDate[item.date].partial += item.count;
        } else if (item.status === 'complete') {
          leadsByDate[item.date].complete += item.count;
        }
        
        leadsByDate[item.date].total += item.count;
      });
      
      const leadsData = Object.entries(leadsByDate).map(([date, counts]) => ({
        date,
        leads: counts.total,
        partial: counts.partial,
        complete: counts.complete
      }));
      
      return {
        leadsData,
        sessionsData
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données de graphiques:', error);
      
      // Pour le développement, retourner des données de démo si l'API n'est pas encore implémentée
      return {
        leadsData: [
          { date: '2023-04-17', leads: 12, partial: 8, complete: 4 },
          { date: '2023-04-18', leads: 18, partial: 10, complete: 8 },
          { date: '2023-04-19', leads: 14, partial: 9, complete: 5 },
          { date: '2023-04-20', leads: 21, partial: 12, complete: 9 },
          { date: '2023-04-21', leads: 17, partial: 10, complete: 7 },
          { date: '2023-04-22', leads: 23, partial: 13, complete: 10 },
          { date: '2023-04-23', leads: 19, partial: 11, complete: 8 },
        ],
        sessionsData: [
          { date: '2023-04-17', sessions: 40 },
          { date: '2023-04-18', sessions: 55 },
          { date: '2023-04-19', sessions: 38 },
          { date: '2023-04-20', sessions: 60 },
          { date: '2023-04-21', sessions: 48 },
          { date: '2023-04-22', sessions: 70 },
          { date: '2023-04-23', sessions: 62 },
        ]
      };
    }
  }

  /**
   * Récupère les détails complets d'une session avec toutes les interactions
   */
  async getSessionInteractions(sessionId: string): Promise<any> {
    try {
      const response = await analyticsClient.get(`/analytics/sessions/${sessionId}/interactions`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des interactions de session:', error);
      
      // Pour le développement, retourner des données de démo
      return {
        session_info: {
          id: sessionId,
          assistant_id: '1',
          started_at: '2023-04-23T10:30:00Z',
          ended_at: '2023-04-23T10:35:00Z',
          status: 'completed',
          lead_status: 'complete'
        },
        conversations: [
          { id: '1', content: 'Bonjour, comment puis-je vous aider ?', sender: 'bot', timestamp: '2023-04-23T10:30:05Z', is_question: true },
          { id: '2', content: 'Je cherche des informations sur vos services', sender: 'user', timestamp: '2023-04-23T10:30:15Z', is_question: false },
          { id: '3', content: 'Bien sûr, je peux vous aider. Pouvez-vous me donner votre email ?', sender: 'bot', timestamp: '2023-04-23T10:30:25Z', is_question: true },
          { id: '4', content: 'alice@example.com', sender: 'user', timestamp: '2023-04-23T10:30:35Z', is_question: false }
        ],
        user_responses: [
          { id: '1', node_id: 'email_node', field_name: 'email', response_value: 'alice@example.com', timestamp: '2023-04-23T10:30:35Z' }
        ],
        qa_pairs: [
          { id: '1', question: 'Quel est votre budget ?', answer: '5000€', timestamp: '2023-04-23T10:31:15Z' },
          { id: '2', question: 'Quand souhaitez-vous démarrer ?', answer: 'Le mois prochain', timestamp: '2023-04-23T10:31:45Z' }
        ],
        form_submissions: [
          { 
            id: '1',
            form_data: { 
              name: 'Alice Dupont', 
              email: 'alice@example.com',
              phone: '0612345678',
              company: 'ABC Corp'
            }, 
            timestamp: '2023-04-23T10:32:15Z' 
          }
        ],
        user_info: { source: 'website', browser: 'Chrome' },
        lead_info: { email: 'alice@example.com', name: 'Alice Dupont' }
      };
    }
  }
}

export default new AnalyticsService();
