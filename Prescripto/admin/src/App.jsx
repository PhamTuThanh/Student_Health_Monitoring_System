import React, { useContext, useState, useEffect } from 'react'
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdminContext } from './context/AdminContext';
import { DoctorContext } from './context/DoctorContext';
import { useAppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Route, Routes, Navigate } from 'react-router-dom';
import DoctorsList from './pages/Admin/DoctorsList';
import AddDoctor from './pages/Admin/AddDoctor';
import Dashboard from './pages/Admin/Dashboard';
import AllApoinments from './pages/Admin/AllApoinments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorAppoinments from './pages/Doctor/DoctorAppoinments';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import AddStudent from './pages/Admin/AddStudent';
import StudentList from './pages/Admin/StudentList';
import PhysicalFitness from './pages/Doctor/PhysicalFitness';
import Abnormality from './pages/Doctor/Abnormality';
import AbnormalityDetail from './pages/Doctor/AbnormalityDetail';
import DataAnalysis from './pages/Doctor/DataAnalysis';
import DrugStock from './pages/Doctor/DrugStock';
import AddDrug from './pages/Doctor/AddDrug';
import AddNews from './pages/Admin/AddNews';
import DoctorChat from './pages/Doctor/DoctorChat';
import NewsList from './pages/Admin/NewsList';
import AddExamSession from './pages/Admin/AddExamSession';
import ExamSessionManager from './pages/Admin/ExamSessionManager';
import MyEditRequests from './pages/Doctor/MyEditRequests';
import HealthDataManager from './pages/Admin/HealthDataManager';
import BackupManagement from './pages/Admin/BackupManagement';

const App = () => {
  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)
  const { isNavbarVisible } = useAppContext()
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Component để redirect tự động đến dashboard phù hợp
  const DefaultRoute = () => {
    if (aToken) {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (dToken) {
      return <Navigate to="/doctor-dashboard" replace />;
    }
    return <Navigate to="/admin-dashboard" replace />;
  };

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

    return () => {
      clearInterval(interval);
    };
  }, [sidebarOpen]);

  return aToken || dToken ? (
    <div className='min-h-screen bg-[#f8f9fd]'>
      <ToastContainer />
      
      {/* Navbar với visibility conditional */}
      <Navbar />

      <div className={`fixed left-0 bottom-0 z-30 transition-all duration-300 ${
        isNavbarVisible ? 'top-16' : 'top-0'
      }`}>
        <Sidebar />
        
        <div 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            sidebarOpen 
              ? 'ml-[210px]' 
              : 'ml-[70px]'
          }`}
        >
          <div className={`min-h-screen p-4 transition-all duration-300 ${
            isNavbarVisible ? 'pt-4' : 'pt-4'
          }`}> 
            <Routes>
              <Route path='/' element={<DefaultRoute />}/>
              <Route path='/admin-dashboard' element={<Dashboard/>}/>
              <Route path='/all-appoinment' element={<AllApoinments/>}/>
              <Route path='/add-doctor' element={<AddDoctor/>}/>
              <Route path='/doctor-list' element={<DoctorsList/>}/>
              <Route path='/add-student' element={<AddStudent/>}/>
              <Route path='/student-list' element={<StudentList/>}/>
              <Route path='/add-news' element={<AddNews/>}/>
              <Route path='/news-list' element={<NewsList/>}/>
              <Route path='/add-exam-session' element={<AddExamSession/>}/>
              <Route path='/exam-session-manager' element={<ExamSessionManager/>}/>
              <Route path='/health-data-manager' element={<HealthDataManager/>}/>
              <Route path='/backup-management' element={<BackupManagement/>}/>
              <Route path='/doctor' element={<Navigate to="/doctor-dashboard" replace />}/>
              <Route path='/doctor-dashboard' element={<DoctorDashboard/>}/>
              <Route path='/doctor-appoinments' element={<DoctorAppoinments/>}/>
              <Route path='/doctor-profile' element={<DoctorProfile/>}/>
              <Route path='/physical-fitness-by-session' element={<PhysicalFitness/>}/>
              <Route path="/abnormality" element={<Abnormality />} />
              <Route path="/doctor/abnormality/:id" element={<AbnormalityDetail />} />
              <Route path="/data_analysis" element={<DataAnalysis/>}/>
              <Route path="/drug_stock" element={<DrugStock/>}/>
              <Route path="/add-drug" element={<AddDrug/>}/>
              <Route path="/doctor_chat" element={<DoctorChat/>}/>
              <Route path="/my-edit-requests" element={<MyEditRequests/>}/>

            </Routes>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <>
      <Login/>
      <ToastContainer/>
    </>
  )
}

export default App