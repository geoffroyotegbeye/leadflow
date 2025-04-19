import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'right' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsAnimating(true);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 300); // Délai de 300ms avant d'afficher le tooltip
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsVisible(false);
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 200); // Garder l'animation pendant 200ms après la disparition
  };
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2'
  };

  return (
    <div 
      className="relative inline-block" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isAnimating && (
        <div 
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-sm whitespace-nowrap ${positionClasses[position]} transition-opacity duration-200 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ pointerEvents: 'none' }}
        >
          {content}
          <div 
            className={`absolute z-50 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 ${
              position === 'top' ? 'top-full -translate-x-1/2 -mt-1 left-1/2' : 
              position === 'right' ? 'right-full -translate-y-1/2 -mr-1 top-1/2' : 
              position === 'bottom' ? 'bottom-full -translate-x-1/2 -mb-1 left-1/2' : 
              'left-full -translate-y-1/2 -ml-1 top-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
