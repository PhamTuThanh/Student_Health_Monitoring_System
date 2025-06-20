import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';

const Sidebar = () => {
  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)
  const [openTrackHealth, setOpenTrackHealth] = useState(false);
  const [openDrugStock, setOpenDrugStock] = useState(false);
  const [openNews, setOpenNews] = useState(false);
  const [openStudent, setOpenStudent] = useState(false);
  const [openDoctor, setOpenDoctor] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const savedState = localStorage.getItem('mainSidebarOpen');
    if (savedState !== null) setIsOpen(savedState === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('mainSidebarOpen', isOpen);
  }, [isOpen]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const StyledNavLink = ({ to, icon, label, onClick }) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-4 py-2 h-12 rounded-lg mb-1 transition-all duration-300 font-medium
        ${isActive
          ? 'bg-primary text-white shadow'
          : 'text-sidebar-text hover:bg-primary hover:text-white'}
        `
      }
    >
      <div className="w-5 h-5 flex-shrink-0">
        {icon && <img src={icon} alt="" className="w-full h-full object-contain" />}
      </div>
      {isOpen && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
    </NavLink>
  );

  const DropdownMenu = ({ isOpen, icon, label, isDropdownOpen, toggleDropdown, children }) => (
    <li className="mb-1">
      <div
        onClick={toggleDropdown}
        className={`flex items-center gap-3 px-4 py-2 h-12 rounded-lg cursor-pointer transition-all duration-300 ${
          isDropdownOpen
            ? 'bg-primary-light text-primary font-medium'
            : 'text-sidebar-text hover:bg-sidebar-hover'
        }`}
      >
        <div className="w-5 h-5 flex-shrink-0">
          {icon && <img src={icon} alt="" className="w-full h-full object-contain" />}
        </div>
        {isOpen && (
          <>
            <span className="flex-1 text-sm">{label}</span>
            <span
              className={`transition-transform duration-300 ${
                isDropdownOpen ? 'rotate-180' : 'rotate-0'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </>
        )}
      </div>
      {isDropdownOpen && isOpen && (
        <div className="ml-4 mt-1 pl-4 border-l border-primary-light animate-fade-in">
          {children}
        </div>
      )}
    </li>
  );

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-sidebar-bg border-r shadow-md transition-all duration-300 ease-in-out z-30 ${
        isOpen ?  'lg:w-54 w-54' : 'w-18'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-white text-primary rounded-full p-1.5 shadow-lg z-10 hover:bg-primary hover:text-white border transition-all"
      >
        <svg
          className={`w-4 h-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Scrollable Content Container */}
      <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent mt-20">
        {/* Admin Sidebar */}
        {aToken && (
          <div className="px-3 py-4">
            <div className="text-xs uppercase font-semibold text-gray-500 mb-3 ml-2">
              {isOpen && 'Administration'}
            </div>
            <ul>
              <StyledNavLink to="/admin-dashboard" icon={assets.home_icon} label="Dashboard" />
              {/* <StyledNavLink to="/all-appoinment" icon={assets.appointment_icon} label="Appointments" /> */}
              <DropdownMenu
                isOpen={isOpen}
                icon={assets.doctors_icon}
                label="Doctor Management"
                isDropdownOpen={openDoctor}
                toggleDropdown={() => setOpenDoctor(!openDoctor)}
              >
                <StyledNavLink to="/add-doctor" icon={assets.add_icon} label="Add Doctor" />
                <StyledNavLink to="/doctor-list" icon={assets.people_icon} label="Doctor List" />
              </DropdownMenu>
              <DropdownMenu
                isOpen={isOpen}
                icon={assets.student_icon}
                label="Student Management"
                isDropdownOpen={openStudent}
                toggleDropdown={() => setOpenStudent(!openStudent)}
              >
                <StyledNavLink to="/add-student" icon={assets.add_icon} label="Add Student" />
                <StyledNavLink to="/student-list" icon={assets.people_icon} label="Students List" />
              </DropdownMenu>
              <DropdownMenu
                isOpen={isOpen}
                icon={assets.news_icon}
                label="News Management"
                isDropdownOpen={openNews}
                toggleDropdown={() => setOpenNews(!openNews)}
              >
                <StyledNavLink to="/add-news" icon={assets.news_icon} label="Add News" />
                <StyledNavLink to="/news-list" icon={assets.news_icon} label="News List" />
              </DropdownMenu>
              <DropdownMenu
                isOpen={isOpen}
                icon={assets.calendar_icon}
                label="Calendar Management"
                isDropdownOpen={openCalendar}
                toggleDropdown={() => setOpenCalendar(!openCalendar)}
              >
                <StyledNavLink to="/add-exam-session" icon={assets.calendar_icon} label="Add Exam Session" />
                <StyledNavLink to="/exam-session-list" icon={assets.calendar_icon} label="Exam Session List" />
              </DropdownMenu>
            </ul>
          </div>
        )}

        {/* Doctor Sidebar */}
        {dToken && (
          <div className="px-3 py-4">
            <div className="text-xs uppercase font-semibold text-gray-500 mb-3 ml-2">
              {isOpen && 'Doctor Panel'}
            </div>
            <ul>
              <StyledNavLink to="/doctor-dashboard" icon={assets.home_icon} label="Dashboard" />
              {/* <StyledNavLink to="/doctor-appoinments" icon={assets.appointment_icon} label="Appointments" /> */}
              <StyledNavLink to="/doctor-profile" icon={assets.people_icon} label="Profile" />
              <DropdownMenu
                isOpen={isOpen}
                icon={assets.add_icon}
                label="Tracking Health"
                isDropdownOpen={openTrackHealth}
                toggleDropdown={() => setOpenTrackHealth(!openTrackHealth)}
              >
               {/* <StyledNavLink to="/add-physical-fitness" label="Physical Fitness" /> */}
                <StyledNavLink to="/physical-fitness-by-session" label="Physical Fitness" />
                <StyledNavLink to="/abnormality" label="Abnormality" />
              </DropdownMenu>
              <DropdownMenu
                isOpen={isOpen}
                icon={assets.drug_stock_icon}
                label="Drug Stock"
                isDropdownOpen={openDrugStock}
                toggleDropdown={() => setOpenDrugStock(!openDrugStock)}
              >
                <StyledNavLink to="/add-drug" label="Add Drug" />
                <StyledNavLink to="/drug_stock" label="Drug Stock" />
              </DropdownMenu>
              {/* <StyledNavLink to="/drug_stock" icon={assets.drug_stock_icon} label="Drug Stock" />   */}
              <StyledNavLink to="/data_analysis" icon={assets.data_analysis_icon} label="Data Analysis" />
              <StyledNavLink to="/doctor_chat" icon={assets.chat_icon} label="Chat" />
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;