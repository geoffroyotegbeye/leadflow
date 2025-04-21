import requests
import json
import sys
from pprint import pprint

# Configuration
BASE_URL = "http://localhost:8000/api"
ASSISTANT_ID = "6806a4b76a9fa75038fc10d6"  # ID de l'assistant à tester

def test_publish_unpublish():
    """Teste la publication et dépublication d'un assistant"""
    print("\n=== Test de publication et dépublication ===")
    
    # 1. Vérifier l'état actuel
    print("\n1. Vérification de l'état initial...")
    debug_url = f"{BASE_URL}/assistants/debug/{ASSISTANT_ID}"
    response = requests.get(debug_url)
    
    if response.status_code != 200:
        print(f"❌ Erreur lors de la vérification: {response.status_code}")
        sys.exit(1)
    
    initial_state = response.json()
    print(f"État initial: is_published={initial_state['is_published']}")
    
    # 2. Dépublier d'abord pour partir d'un état connu
    print("\n2. Dépublication de l'assistant...")
    publish_url = f"{BASE_URL}/assistants/{ASSISTANT_ID}/publish"
    response = requests.put(publish_url, json={"is_published": False})
    
    if response.status_code != 200:
        print(f"❌ Erreur lors de la dépublication: {response.status_code}")
        sys.exit(1)
    
    # Vérifier l'état après dépublication
    response = requests.get(debug_url)
    unpublished_state = response.json()
    print(f"Après dépublication: is_published={unpublished_state['is_published']}")
    
    if unpublished_state['is_published']:
        print("❌ L'assistant est toujours publié après dépublication!")
    else:
        print("✅ Dépublication réussie")
    
    # 3. Publier l'assistant
    print("\n3. Publication de l'assistant...")
    response = requests.put(publish_url, json={"is_published": True})
    
    if response.status_code != 200:
        print(f"❌ Erreur lors de la publication: {response.status_code}")
        sys.exit(1)
    
    # 4. Vérifier l'état après publication
    print("\n4. Vérification après publication...")
    response = requests.get(debug_url)
    published_state = response.json()
    
    print(f"Après publication: is_published={published_state['is_published']}")
    print(f"public_id: {published_state['public_id']}")
    print(f"public_url présent: {published_state['public_url'] is not None}")
    print(f"embed_script présent: {published_state['has_embed_script']}")
    
    # Vérifier que tous les champs sont présents
    success = True
    if not published_state['is_published']:
        print("❌ L'assistant n'est pas marqué comme publié!")
        success = False
    
    if not published_state['public_id']:
        print("❌ Pas d'ID public généré!")
        success = False
    
    if not published_state['public_url']:
        print("❌ Pas d'URL publique générée!")
        success = False
    
    if not published_state['has_embed_script']:
        print("❌ Pas de script d'intégration généré!")
        success = False
    
    if success:
        print("\n✅ Publication réussie avec tous les champs requis!")
    else:
        print("\n❌ Publication incomplète - certains champs sont manquants!")
    
    # 5. Tester la récupération du script d'intégration
    print("\n5. Test de récupération du script d'intégration...")
    embed_url = f"{BASE_URL}/assistants/{ASSISTANT_ID}/embed"
    response = requests.get(embed_url)
    
    if response.status_code != 200:
        print(f"❌ Erreur lors de la récupération du script: {response.status_code}")
    else:
        embed_data = response.json()
        print("✅ Script d'intégration récupéré avec succès!")
        print(f"URL publique: {embed_data['public_url']}")
        print(f"Script présent: {bool(embed_data['script'])}")
    
    # 6. Restaurer l'état initial si nécessaire
    if initial_state['is_published'] != published_state['is_published']:
        print(f"\n6. Restauration de l'état initial (is_published={initial_state['is_published']})...")
        response = requests.put(publish_url, json={"is_published": initial_state['is_published']})
        
        if response.status_code != 200:
            print(f"❌ Erreur lors de la restauration: {response.status_code}")
        else:
            print("✅ État initial restauré")

if __name__ == "__main__":
    test_publish_unpublish()
