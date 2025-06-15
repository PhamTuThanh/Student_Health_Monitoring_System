import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/SocketContext';

const Navbar = () => {
  const { aToken, setAToken } = useContext(AdminContext);
  const { dToken, setDToken } = useContext(DoctorContext);
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

  const logout = () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    navigate('/');
    aToken && setAToken('');
    aToken && localStorage.removeItem('aToken');
    dToken && setDToken('');
    dToken && localStorage.removeItem('dToken');
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-sm border-b px-4 sm:px-10 py-3 flex items-center justify-between transition-all duration-300"
    >
      <div className='flex items-center gap-2 text-xs'>
        <img className='w-36 sm:w-40 cursor-pointer' src={assets.utc2_logo} alt="" />
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>
          {aToken ? 'Teacher' : 'Doctor'}
        </p>
      </div>
      <button onClick={logout} className='bg-primary text-white text-sm px-10 py-2 rounded-full'>
        Logout
      </button>
    </div>
  );
};

export default Navbar;
