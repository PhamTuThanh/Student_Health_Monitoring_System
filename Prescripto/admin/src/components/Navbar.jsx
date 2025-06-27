import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/SocketContext';

const Navbar = () => {
  const { aToken, logout: adminLogout } = useContext(AdminContext);
  const { dToken, logout: doctorLogout } = useContext(DoctorContext);
  const { isNavbarVisible } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocketContext();

  useEffect(() => {
    const saved = localStorage.getItem('mainSidebarOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }

    const interval = setInterval(() => {
      const saved = localStorage.getItem('mainSidebarOpen');
      if (saved !== null) {
        const isOpen = saved === 'true';
        if (isOpen !== sidebarOpen) {
          setSidebarOpen(isOpen);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [sidebarOpen]);

  // Debug log for navbar visibility
  useEffect(() => {
    console.log('🎯 Navbar: isNavbarVisible changed to:', isNavbarVisible);
  }, [isNavbarVisible]);

  const handleLogout = async () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    
    if (aToken) {
      await adminLogout();
    } else if (dToken) {
      await doctorLogout();
    }
    
    navigate('/');
  };

  // Conditional rendering instead of CSS transform
  if (!isNavbarVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-sm border-b px-4 sm:px-10 py-3 flex items-center justify-between">
      <div className='flex items-center gap-2 text-xs'>
        <img className='w-36 sm:w-40 cursor-pointer' src={assets.utc2_logo} alt="" />
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>
          {aToken ? 'Teacher' : 'Doctor'}
        </p>
      </div>
      <button onClick={handleLogout} className='bg-primary text-white text-sm px-10 py-2 rounded-full'>
        Logout
      </button>
    </div>
  );
};

export default Navbar;
