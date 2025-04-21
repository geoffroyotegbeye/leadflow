import axios from 'axios';

// Configuration de l'API
const API_URL = 'http://localhost:8000/api';
const BASE_URL = 'http://localhost:8000'; // URL de base pour accéder aux fichiers statiques

/**
 * Service pour gérer l'upload et la gestion des fichiers média
 */
const MediaService = {
  /**
   * Upload un fichier média (image, vidéo, audio, fichier)
   * @param file - Le fichier à uploader
   * @param type - Le type de média ('image', 'video', 'audio', 'file')
   * @returns Le chemin du fichier uploadé
   */
  async uploadMedia(file: File, type: string): Promise<string> {
    try {
      console.log(`🔄 Upload de fichier ${type}: ${file.name}`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await axios.post(`${API_URL}/upload/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Convertir le chemin relatif en URL complète
      const fullPath = `${BASE_URL}${response.data.path}`;
      console.log(`✅ Fichier uploadé avec succès: ${fullPath}`);
      return fullPath;
    } catch (error: any) {
      console.error(`❌ Erreur lors de l'upload du fichier:`, error);
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Data:`, error.response.data);
      }
      throw new Error(`Erreur lors de l'upload: ${error.message}`);
    }
  }
};

export default MediaService;
