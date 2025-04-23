import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import analyticsService from '../../services/analyticsService';

// Type pour les données de graphiques
interface ChartData {
  leadsData: Array<{
    date: string;
    leads: number;
    conversations: number;
    conversion: number;
  }>;
  assistantsPerformance: Array<{
    name: string;
    leads: number;
    conversations: number;
  }>;
}

const periods = [
  { label: '7j', value: '7d' },
  { label: '30j', value: '30d' },
  { label: '3 mois', value: '3m' },
  { label: 'Année', value: '1y' },
];

const DashboardStatsCharts: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData>({
    leadsData: [],
    assistantsPerformance: []
  });

  // Charger les données selon la période sélectionnée
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getStatsChartData(period);
        setChartData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données de graphiques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [period]); // Recharger quand la période change

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Statistiques avancées</h2>
        <div className="flex gap-2">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${period === p.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Courbe leads & conversations */}
        <div>
          <h3 className="mb-2 text-gray-700 dark:text-gray-200 font-semibold">Leads & Conversations</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData.leadsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="#2563eb" name="Leads" strokeWidth={2} />
              <Line type="monotone" dataKey="conversations" stroke="#10b981" name="Conversations" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Barres taux de conversion */}
        <div>
          <h3 className="mb-2 text-gray-700 dark:text-gray-200 font-semibold">Taux de conversion (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData.leadsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="conversion" fill="#f59e42" name="Conversion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Performances par assistant */}
      <div className="mt-8">
        <h3 className="mb-2 text-gray-700 dark:text-gray-200 font-semibold">Performances par assistant</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData.assistantsPerformance} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Tooltip />
            <Legend />
            <Bar dataKey="leads" fill="#2563eb" name="Leads" barSize={24} />
            <Bar dataKey="conversations" fill="#10b981" name="Conversations" barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardStatsCharts;
