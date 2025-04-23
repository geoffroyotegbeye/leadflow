import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';

interface AnalyticsChartsProps {
  sessionsData: any[];
  completionData: any[];
  responseData: any[];
  loading: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ 
  sessionsData, 
  completionData, 
  responseData,
  loading 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-80">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Graphique des sessions et leads */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sessions et Leads</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sessionsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} 
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="sessions" 
              stroke="#3b82f6" 
              strokeWidth={2}
              activeDot={{ r: 8 }} 
              name="Sessions"
            />
            <Line 
              type="monotone" 
              dataKey="leads" 
              stroke="#10b981" 
              strokeWidth={2}
              activeDot={{ r: 8 }} 
              name="Leads"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique de taux de conversion */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Taux de Conversion</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sessionsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} 
              formatter={(value: any) => [`${value}%`, 'Taux de conversion']}
            />
            <Legend />
            <Bar 
              dataKey="conversion" 
              fill="#8b5cf6" 
              name="Taux de conversion (%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique de complétion par étape */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Complétion par Étape</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={completionData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" />
            <YAxis 
              type="category" 
              dataKey="node_label" 
              stroke="#9ca3af" 
              width={80}
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} 
              formatter={(value: any) => [`${value}%`, 'Taux de complétion']}
            />
            <Legend />
            <Bar 
              dataKey="completion_rate" 
              fill="#f59e0b" 
              name="Taux de complétion (%)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique de réponses populaires */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Réponses Populaires</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={responseData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              nameKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {responseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} 
              formatter={(value: any, name: any) => [value, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
