# leadflow - Plateforme de Création de Chatbots

leadflow est une plateforme complète pour la création, la gestion et le déploiement de chatbots conversationnels avec une interface visuelle intuitive basée sur des flowcharts.

## Architecture du Projet

Le projet est divisé en deux parties principales :

### Frontend (React + TypeScript)

Interface utilisateur permettant de :
- Créer et éditer des flowcharts de conversation
- Prévisualiser les chatbots en temps réel
- Gérer les assistants et leurs configurations

### Backend (FastAPI + MongoDB)

API RESTful pour :
- Stocker et gérer les assistants
- Gérer les configurations des chatbots
- Fournir les données nécessaires au frontend

## Prérequis

- Python 3.8+
- Node.js 14+
- MongoDB

## Installation et Démarrage

### Backend

1. Installer les dépendances Python :
```bash
cd backend
pip install -r requirements.txt
```

2. Configurer les variables d'environnement dans le fichier `.env` :
```
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=leadflow
API_PORT=8000
```

3. Démarrer le serveur backend :
```bash
python run.py
```

Le serveur API sera accessible à l'adresse : http://localhost:8000

Documentation de l'API : http://localhost:8000/docs

### Frontend

1. Installer les dépendances Node.js :
```bash
cd frontend
npm install
```

2. Démarrer le serveur de développement :
```bash
npm start
```

L'application frontend sera accessible à l'adresse : http://localhost:3000

## Fonctionnalités Principales

- Création de flowcharts de conversation avec une interface drag-and-drop
- Différents types de nœuds pour des interactions variées (texte, questions, médias, etc.)
- Prévisualisation en temps réel des conversations
- Sauvegarde et chargement des configurations
- Import/export au format JSON
- Gestion des assistants via l'API

## API Endpoints

### Assistants

- `GET /api/assistants` - Récupérer tous les assistants
- `GET /api/assistants/{id}` - Récupérer un assistant par son ID
- `POST /api/assistants` - Créer un nouvel assistant
- `PUT /api/assistants/{id}` - Mettre à jour un assistant
- `DELETE /api/assistants/{id}` - Supprimer un assistant

## Développement

Le projet utilise :
- TypeScript pour le typage statique
- React pour l'interface utilisateur
- React Flow pour les flowcharts
- FastAPI pour l'API backend
- MongoDB pour le stockage des données
