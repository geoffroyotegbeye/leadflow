import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCode, 
  FiCpu, 
  FiGithub, 
  FiGrid, 
  FiLayers, 
  FiMessageCircle, 
  FiStar, 
  FiUsers, 
  FiZap, 
  FiGlobe,
  FiMoon,
  FiSun,
  FiChevronRight
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Toggle dark mode
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    
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
      color: darkMode ? 0x3b82f6 : 0x3b82f6,
      wireframe: true,
      emissive: darkMode ? 0x3b82f6 : 0x3b82f6,
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
  }, [darkMode]);

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
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? `${darkMode ? 'bg-gray-900/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md shadow-sm'}` 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-600'}`}>
                  <FiMessageCircle className="text-white text-2xl" />
                </div>
                <span className={`ml-3 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  LeadFlow<span className="text-blue-600">OS</span>
                </span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/features" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}>
                Fonctionnalités
              </Link>
              <Link to="/documentation" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}>
                Documentation
              </Link>
              <Link to="/community" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}>
                Communauté
              </Link>
              <a 
                href="https://github.com/leadflow/leadflow-os" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 flex items-center`}
              >
                <FiGithub className="mr-2" /> GitHub
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-800'} transition-colors duration-200`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
              </button>
              
              <Link
                to="/login"
                className={`hidden md:inline-block px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                } transition-colors duration-200`}
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
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium mb-6 ${
                darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
              }`}>
                <span className="flex items-center">
                  <FiGithub className="mr-2" /> 100% Open Source
                </span>
              </span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className={`text-4xl sm:text-6xl font-bold mb-6 tracking-tight ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
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
              className={`text-xl mb-8 max-w-2xl mx-auto ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Automatisez vos conversations, qualifiez vos leads et boostez vos conversions avec 
              une plateforme open source et entièrement personnalisable — sans écrire une seule ligne de code.
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
              <a
                href="https://github.com/leadflow/leadflow-os"
                target="_blank"
                rel="noopener noreferrer"
                className={`px-8 py-4 rounded-lg flex items-center justify-center ${
                  darkMode 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } transition-colors duration-200`}
              >
                <FiGithub className="mr-2" /> Star on GitHub
              </a>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className={`mt-8 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <div className="flex items-center justify-center gap-1">
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
              </div>
              <p className="mt-2">Rejoint par plus de 2,000+ développeurs et marketeurs</p>
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
          <div className={`rounded-xl overflow-hidden shadow-2xl border ${
            darkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <img 
              src="/api/placeholder/1200/600" 
              alt="LeadFlow Interface" 
              className="w-full object-cover"
            />
            <div className={`absolute inset-0 pointer-events-none ${
              darkMode ? 'bg-gradient-to-t from-gray-900 to-transparent opacity-70' : 'bg-gradient-to-t from-white to-transparent opacity-30'
            }`}></div>
          </div>
        </motion.div>
        
        {/* Logos Section */}
        <div className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className={`text-center text-sm font-medium mb-8 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              UTILISÉ ET SUPPORTÉ PAR DES ENTREPRISES DU MONDE ENTIER
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center justify-items-center">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`h-12 w-24 rounded-md ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-200'
                } flex items-center justify-center`}>
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>LOGO {i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Toutes les fonctionnalités dont vous avez besoin
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
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
                className={`p-6 rounded-xl ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-100 shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  darkMode ? 'bg-gray-700' : 'bg-blue-50'
                }`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className={`py-24 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Comment ça marche
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
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
                <div className={`text-5xl font-bold mb-4 ${
                  darkMode ? 'text-blue-500' : 'text-blue-600'
                }`}>
                  {step.step}
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {step.title}
                </h3>
                <p className={`${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {step.description}
                </p>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 transform translate-x-1/2">
                    <FiChevronRight className={`text-4xl ${
                      darkMode ? 'text-gray-700' : 'text-gray-300'
                    }`} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Cas d'utilisation
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              LeadFlow s'adapte à tous vos besoins conversationnels
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Lead Generation",
                description: "Qualifiez vos prospects et collectez des informations pertinentes pour votre équipe commerciale.",
                image: "/api/placeholder/500/300"
              },
              {
                title: "Support Client",
                description: "Répondez aux questions fréquentes et réduisez la charge de votre équipe support.",
                image: "/api/placeholder/500/300"
              },
              {
                title: "Réservations & RDV",
                description: "Permettez à vos clients de prendre rendez-vous directement via le chatbot.",
                image: "/api/placeholder/500/300"
              },
              {
                title: "Formulaires Interactifs",
                description: "Transformez vos formulaires ennuyeux en conversations engageantes pour augmenter le taux de complétion.",
                image: "/api/placeholder/500/300"
              }
            ].map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-6 rounded-xl overflow-hidden ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-100 shadow-sm'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/2">
                    <h3 className={`text-xl font-semibold mb-3 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {useCase.title}
                    </h3>
                    <p className={`mb-4 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
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
      <div className={`py-24 ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium mb-4 ${
                darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
              }`}>
                <span className="flex items-center">
                  <FiGithub className="mr-2" /> Open Source
                </span>
              </span>
              <h2 className={`text-3xl font-bold mb-6 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Un projet 100% Open Source et communautaire
              </h2>
              <p className={`text-lg mb-6 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                LeadFlow est un projet open source maintenu par une communauté active de développeurs et de marketeurs. 
                Vous pouvez l'utiliser gratuitement, le modifier selon vos besoins et contribuer à son amélioration.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'
                }`}>
                  <div className="font-bold text-2xl text-blue-600 mb-1">2,500+</div>
                  <div className={`${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Stars GitHub</div>
                </div>
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'
                }`}>
                  <div className="font-bold text-2xl text-blue-600 mb-1">150+</div>
                  <div className={`${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Contributeurs</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://github.com/leadflow/leadflow-os"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <FiGithub className="mr-2" /> Star on GitHub
                </a>
                <Link
                  to="/contribute"
                  className={`px-6 py-3 rounded-lg flex items-center justify-center ${
                    darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-white text-gray-900 hover:bg-gray-100'
                  } transition-colors duration-200`}
                >
                  <FiCode className="mr-2" /> Comment contribuer
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`rounded-xl overflow-hidden ${
                darkMode ? 'bg-gray-900' : 'bg-white'
              } p-4 border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className={`flex items-center mb-4 p-2 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <div className="flex space-x-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <FiMessageCircle className="text-white text-2xl" />
                  </div>
                  <div>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>LeadFlowOS</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Open Source Project</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
                  <div className="font-bold text-2xl text-blue-600 mb-1">100+</div>
                  <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Community Events</div>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
                  <div className="font-bold text-2xl text-blue-600 mb-1">50+</div>
                  <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Integrations</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <Link to="/" className="flex items-center">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-600'}`}>
                  <FiMessageCircle className="text-white text-2xl" />
                </div>
                <span className={`ml-3 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  LeadFlow<span className="text-blue-600">OS</span>
                </span>
              </Link>
            </div>
            <div className="flex space-x-6">
              <Link to="/features" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}>
                Fonctionnalités
              </Link>
              <Link to="/documentation" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}>
                Documentation
              </Link>
              <Link to="/community" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}>
                Communauté
              </Link>
              <a
                href="https://github.com/leadflow/leadflow-os"
                target="_blank"
                rel="noopener noreferrer"
                className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 flex items-center`}
              >
                <FiGithub className="mr-2" /> GitHub
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              &copy; {new Date().getFullYear()} LeadFlowOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


