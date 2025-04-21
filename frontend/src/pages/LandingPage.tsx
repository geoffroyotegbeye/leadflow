import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCpu, 
  FiGithub, 
  FiGrid, 
  FiLayers, 
  FiMessageCircle, 
  FiStar, 
  FiUsers, 
  FiZap, 
  FiGlobe,
  FiChevronRight
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const LandingPage = () => {
  
  const [isScrolled, setIsScrolled] = useState(false);

  // Gestion du scroll uniquement
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize 3D animation
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Create animated shapes
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      wireframe: true,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.2,
    });
    const torusKnot = new THREE.Mesh(geometry, material);
    scene.add(torusKnot);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 3, 5);
    scene.add(pointLight);

    // Responsive handling
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight * 0.6;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      torusKnot.rotation.x += 0.005;
      torusKnot.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-600">
                  <FiMessageCircle className="text-white text-2xl" />
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                  LeadFlow
                </span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors duration-200">
                Fonctionnalités
              </Link>
              <Link to="/documentation" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors duration-200">
                Documentation
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="hidden md:inline-block px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 transition-colors duration-200"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
              >
                Essayer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <canvas 
            id="hero-canvas" 
            className="w-full h-full opacity-40"
          ></canvas>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium mb-6 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200`}>
                <span className="flex items-center">
                  <FiGithub className="mr-2" /> Plateforme professionnelle de création de chatbots
                </span>
              </span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className={`text-4xl sm:text-6xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white`}
            >
              Créez des chatbots <span className="text-blue-600">sans code</span><br />
              qui convertissent <span className="relative inline-block">
                <span className="relative z-10">vraiment</span>
                <svg className="absolute bottom-1 -z-10 w-full" height="8" viewBox="0 0 232 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M231.1 4.5C138.5 4.5 71.5 -3.5 0.999998 4.5" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round"/>
                </svg>
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className={`text-xl mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300`}
            >
              Automatisez vos conversations, qualifiez vos leads et boostez vos conversions avec 
              une plateforme flexible et entièrement personnalisable — sans écrire une seule ligne de code.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/register"
                className="px-8 py-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
              >
                Commencer gratuitement <FiChevronRight className="ml-2" />
              </Link>
              
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className={`mt-8 text-sm text-gray-500 dark:text-gray-400`}
            >
              <div className="flex items-center justify-center gap-1">
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
              </div>
              
            </motion.div>
          </motion.div>
        </div>
        
        {/* Hero Image */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8"
        >
          <div className={`rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900`}>
            <img 
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80" 
              alt="LeadFlow - Illustration principale" 
              className="w-full object-cover"
            />
            <div className={`absolute inset-0 pointer-events-none bg-gradient-to-t from-white to-transparent opacity-30`}></div>
          </div>
        </motion.div>
        
        {/* Logos Section */}
        <div className={`py-16 bg-gray-50 dark:bg-gray-800`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className={`text-center text-sm font-medium mb-8 text-gray-500 dark:text-gray-400`}>
              UTILISÉ ET SUPPORTÉ PAR DES ENTREPRISES DU MONDE ENTIER
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center justify-items-center">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`h-12 w-24 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
                  <img src={[
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80"
][i-1]} alt={`Logo partenaire ${i}`} className="max-h-10 object-contain rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold mb-4 text-gray-900 dark:text-white`}>
              Toutes les fonctionnalités dont vous avez besoin
            </h2>
            <p className={`text-xl max-w-3xl mx-auto text-gray-600 dark:text-gray-300`}>
              Créez des expériences conversationnelles qui engagent vos visiteurs et convertissent plus de leads.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <FiCpu className="text-blue-600 text-2xl" />,
                title: "Builder No-Code",
                description: "Interface drag-and-drop intuitive pour créer des chatbots sophistiqués sans écrire une seule ligne de code."
              },
              {
                icon: <FiLayers className="text-blue-600 text-2xl" />,
                title: "Scénarios Avancés",
                description: "Personnalisez les conversations avec des scénarios conditionnels, branches logiques et variables dynamiques."
              },
              {
                icon: <FiGrid className="text-blue-600 text-2xl" />,
                title: "Templates Prêts à l'Emploi",
                description: "Démarrez rapidement avec une bibliothèque de templates pour différents cas d'usage."
              },
              {
                icon: <FiUsers className="text-blue-600 text-2xl" />,
                title: "Segmentation Avancée",
                description: "Qualifiez et segmentez vos leads en fonction de leurs réponses et comportements."
              },
              {
                icon: <FiZap className="text-blue-600 text-2xl" />,
                title: "Intégrations API",
                description: "Connectez votre chatbot à vos outils CRM, email marketing et autres services via API."
              },
              {
                icon: <FiGlobe className="text-blue-600 text-2xl" />,
                title: "Multi-Plateformes",
                description: "Déployez vos chatbots sur votre site web, WhatsApp, Facebook Messenger et plus encore."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-6 rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm`}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-blue-50 dark:bg-blue-900">
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-3 text-gray-900 dark:text-white`}>
                  {feature.title}
                </h3>
                <p className={`text-gray-600 dark:text-gray-300`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className={`py-24 bg-gray-50 dark:bg-gray-900`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold mb-4 text-gray-900 dark:text-white`}>
              Comment ça marche
            </h2>
            <p className={`text-xl max-w-3xl mx-auto text-gray-600 dark:text-gray-300`}>
              Créez et déployez un chatbot performant en quelques minutes, sans connaissance technique.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choisissez un template",
                description: "Sélectionnez parmi nos templates prédéfinis ou partez de zéro pour créer votre chatbot."
              },
              {
                step: "02",
                title: "Personnalisez votre flux",
                description: "Configurez les messages, questions, réponses et logique conditionnelle avec notre interface drag-and-drop."
              },
              {
                step: "03",
                title: "Publiez et analysez",
                description: "Intégrez le chatbot sur votre site et analysez ses performances pour l'optimiser continuellement."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className={`text-5xl font-bold mb-4 text-blue-600`}>
                  {step.step}
                </div>
                <h3 className={`text-xl font-semibold mb-3 text-gray-900 dark:text-white`}>
                  {step.title}
                </h3>
                <p className={`text-gray-600 dark:text-gray-300`}>
                  {step.description}
                </p>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 transform translate-x-1/2">
                    <FiChevronRight className={`text-4xl text-gray-300`} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold mb-4 text-gray-900 dark:text-white`}>
              Cas d'utilisation
            </h2>
            <p className={`text-xl max-w-3xl mx-auto text-gray-600 dark:text-gray-300`}>
              leadflow s'adapte à tous vos besoins conversationnels
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Lead Generation",
                description: "Qualifiez vos prospects et collectez des informations pertinentes pour votre équipe commerciale.",
                image: "https://images.unsplash.com/photo-1515168833906-d2a3b82b302c?auto=format&fit=crop&w=500&q=80"
              },
              {
                title: "Support Client",
                description: "Répondez aux questions fréquentes et réduisez la charge de votre équipe support.",
                image: "https://images.unsplash.com/photo-1515168833906-d2a3b82b302c?auto=format&fit=crop&w=500&q=80"
              },
              {
                title: "Réservations & RDV",
                description: "Permettez à vos clients de prendre rendez-vous directement via le chatbot.",
                image: "https://images.unsplash.com/photo-1515168833906-d2a3b82b302c?auto=format&fit=crop&w=500&q=80"
              },
              {
                title: "Formulaires Interactifs",
                description: "Transformez vos formulaires ennuyeux en conversations engageantes pour augmenter le taux de complétion.",
                image: "https://images.unsplash.com/photo-1515168833906-d2a3b82b302c?auto=format&fit=crop&w=500&q=80"
              }
            ].map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-6 rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/2">
                    <h3 className={`text-xl font-semibold mb-3 text-gray-900 dark:text-white`}>
                      {useCase.title}
                    </h3>
                    <p className={`mb-4 text-gray-600 dark:text-gray-300`}>
                      {useCase.description}
                    </p>
                    <Link 
                      to={`/use-cases/${useCase.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      En savoir plus <FiChevronRight className="ml-1" />
                    </Link>
                  </div>
                  <div className="md:w-1/2">
                    <img 
                      src={useCase.image} 
                      alt={useCase.title} 
                      className="rounded-lg w-full h-auto"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Source Section */}
      <div className={`py-24 bg-blue-50 dark:bg-blue-950`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium mb-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200`}>
                <span className="flex items-center">
                  <FiZap className="mr-2" /> Sécurité & Personnalisation
                </span>
              </span>
              <h2 className={`text-3xl font-bold mb-6 text-gray-900 dark:text-white`}>
                Une plateforme robuste, sécurisée et flexible
              </h2>
              <p className={`text-lg mb-6 text-gray-600 dark:text-gray-300`}>
                leadflow répond aux exigences des entreprises modernes : sécurité des données, personnalisation avancée et intégration facile dans votre écosystème digital. Profitez d’une solution fiable, évolutive et adaptée à vos besoins métier.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className={`p-4 rounded-lg bg-white dark:bg-gray-900 shadow-sm`}>
                  <div className="font-bold text-2xl text-blue-600 mb-1">+150</div>
                  <div className={`text-gray-600 dark:text-gray-300`}>Entreprises satisfaites</div>
                </div>
                <div className={`p-4 rounded-lg bg-white dark:bg-gray-900 shadow-sm`}>
                  <div className="font-bold text-2xl text-blue-600 mb-1">+10 000</div>
                  <div className={`text-gray-600 dark:text-gray-300`}>Conversations automatisées</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`rounded-xl overflow-hidden bg-white dark:bg-gray-900 p-4 border border-gray-100 dark:border-gray-800 shadow-sm`}
            >
              <div className={`flex items-center mb-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                <div className="flex space-x-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <FiMessageCircle className="text-white text-2xl" />
                  </div>
                  <div>
                    <div className={`font-semibold text-gray-900 dark:text-white`}>LeadFlow</div>
                    
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg bg-white dark:bg-gray-900 shadow-sm`}>
                  <div className="font-bold text-2xl text-blue-600 mb-1">100+</div>
                  <div className={`text-gray-600 dark:text-gray-300`}>Community Events</div>
                </div>
                <div className={`p-4 rounded-lg bg-white dark:bg-gray-900 shadow-sm`}>
                  <div className="font-bold text-2xl text-blue-600 mb-1">50+</div>
                  <div className={`text-gray-600 dark:text-gray-300`}>Integrations</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`py-12 bg-gray-100 dark:bg-gray-900`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <Link to="/" className="flex items-center">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-blue-600`}>
                  <FiMessageCircle className="text-white text-2xl" />
                </div>
                <span className={`ml-3 text-xl font-bold text-gray-900 dark:text-white`}>
                  LeadFlow
                </span>
              </Link>
            </div>
            <div className="flex space-x-6">
              <Link to="/features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors duration-200">
                Fonctionnalités
              </Link>
              <Link to="/documentation" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors duration-200">
                Documentation
              </Link>
              
              
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              &copy; {new Date().getFullYear()} leadflowOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


