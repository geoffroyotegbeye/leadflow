from pymongo import MongoClient
import uuid
from datetime import datetime
import sys

# ID de l'assistant à mettre à jour
assistant_id = '6806a4b76a9fa75038fc10d6'

# URL de base pour générer les liens
base_url = 'http://localhost:8000/api'

# Connexion à MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['leadflow']
collection = db['assistants']

# Vérifier si l'assistant existe
from bson.objectid import ObjectId
assistant = collection.find_one({'_id': ObjectId(assistant_id)})

if not assistant:
    print(f"Assistant avec ID {assistant_id} non trouvé!")
    sys.exit(1)

# Générer un ID public si nécessaire
public_id = assistant.get('public_id')
if not public_id:
    public_id = str(uuid.uuid4())

# Générer l'URL publique
public_url = f"{base_url}/assistants/public/{public_id}"

# Générer le script d'intégration
script = f"""
<div id="leadflow-assistant-{public_id}"></div>
<script>
    (function() {{
        var script = document.createElement('script');
        script.src = '{base_url}/static/js/embed.js';
        script.setAttribute('data-assistant-id', '{public_id}');
        script.setAttribute('data-base-url', '{base_url}');
        document.head.appendChild(script);
    }})();
</script>
""".strip()

# Préparer les données de mise à jour
update_data = {
    'is_published': True,
    'public_id': public_id,
    'public_url': public_url,
    'embed_script': script,
    'publish_date': datetime.utcnow(),
    'updated_at': datetime.utcnow()
}

# Mettre à jour l'assistant
result = collection.update_one({'_id': ObjectId(assistant_id)}, {'$set': update_data})

print(f"Mise à jour effectuée: {result.matched_count} document(s) trouvé(s), {result.modified_count} document(s) modifié(s)")

# Vérifier que la mise à jour a fonctionné
updated_assistant = collection.find_one({'_id': ObjectId(assistant_id)})
print("\nAssistant après mise à jour:")
print(f"ID: {updated_assistant['_id']}")
print(f"Nom: {updated_assistant.get('name')}")
print(f"Publié: {updated_assistant.get('is_published')}")
print(f"ID public: {updated_assistant.get('public_id')}")
print(f"URL publique: {updated_assistant.get('public_url') is not None}")
print(f"Script d'intégration: {updated_assistant.get('embed_script') is not None}")
print(f"Champs disponibles: {list(updated_assistant.keys())}")
