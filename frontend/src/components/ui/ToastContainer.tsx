import React, { useState, useCallback } from 'react';
import Toast, { ToastProps, ToastType } from './Toast';
import { createPortal } from 'react-dom';

export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
}

// Créer un contexte pour le système de toast
export const ToastContext = React.createContext<{
  showToast: (options: ToastOptions) => void;
}>({
  showToast: () => {},
});

export const useToast = () => React.useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastProps = {
      id,
      type: options.type,
      message: options.message,
      duration: options.duration,
      onClose: (id) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
      },
    };

    setToasts((prevToasts) => [...prevToasts, toast]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: ToastProps[] }> = ({ toasts }) => {
  // Utiliser un portail pour rendre les toasts en dehors de la hiérarchie DOM normale
  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;
