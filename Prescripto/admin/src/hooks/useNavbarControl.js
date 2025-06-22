import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export const useNavbarControl = (isVisible = true) => {
  const { hideNavbar, showNavbar } = useAppContext();

  useEffect(() => {
    if (!isVisible) {
      hideNavbar();
    } else {
      showNavbar();
    }

    return () => {
      showNavbar();
    };
  }, [isVisible, hideNavbar, showNavbar]);

  return { hideNavbar, showNavbar };
}; 