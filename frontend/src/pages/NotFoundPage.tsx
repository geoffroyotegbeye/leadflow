import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
    <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Page non trouvée</h2>
    <p className="text-gray-600 dark:text-gray-400 mb-6">La page que vous cherchez n'existe pas ou a été déplacée.</p>
    <Link to="/" className="inline-block px-6 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Retour à l'accueil</Link>
  </div>
);

export default NotFoundPage;
