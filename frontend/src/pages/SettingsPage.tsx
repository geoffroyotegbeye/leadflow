import React from 'react';

const SettingsPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
    <h1 className="text-4xl font-bold text-blue-600 mb-4">Paramètres</h1>
    <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg text-center max-w-xl">
      Gérez vos paramètres de compte, préférences et autres options ici. Cette page pourra être enrichie avec des formulaires de modification de profil, de gestion des notifications, etc.
    </p>
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded shadow p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">À venir</h2>
      <p className="text-gray-600 dark:text-gray-400">Les fonctionnalités de gestion des paramètres seront bientôt disponibles.</p>
    </div>
  </div>
);

export default SettingsPage;
