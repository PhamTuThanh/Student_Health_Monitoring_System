import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const ModalWrapper = ({ isOpen, onClose, children, zIndex = 60, className = "" }) => {
  const { hideNavbar, showNavbar } = useAppContext();

  useEffect(() => {
    if (isOpen) {
      hideNavbar();
    } else {
      showNavbar();
    }

    return () => {
      showNavbar();
    };
  }, [isOpen, hideNavbar, showNavbar]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[${zIndex}] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 ${className}`}>
      {children}
    </div>
  );
};

export default ModalWrapper; 