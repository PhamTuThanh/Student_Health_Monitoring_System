import React, { useContext, useState, useEffect } from 'react'
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Route, Routes } from 'react-router-dom';
import DoctorsList from './pages/Admin/DoctorsList';
import AddDoctor from './pages/Admin/AddDoctor';
import Dashboard from './pages/Admin/Dashboard';
import AllApoinments from './pages/Admin/AllApoinments';
import { DoctorContext } from './context/DoctorContext';
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

const App = () => {
  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Lắng nghe thay đổi sidebar từ localStorage
  useEffect(() => {
    // Khởi tạo state từ localStorage
    const saved = localStorage.getItem('mainSidebarOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }

    // Lắng nghe thay đổi trong cùng tab (vì localStorage event không trigger trong cùng tab)
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
      
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <Navbar />
      </div>

      {/* Layout with Sidebar and Main Content */}
      <div className="fixed left-0 top-16 bottom-0 z-30"> {/* pt-16 để tránh navbar che khuất */}
        {/* Fixed Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            sidebarOpen 
              ? 'ml-[210px]' 
              : 'ml-[70px]'
          }`}
        >
          <div className="min-h-screen p-4 "> 
            <Routes>
              {/* admin route */}
              <Route path='/' element={<></>}/>
              <Route path='/admin-dashboard' element={<Dashboard/>}/>
              <Route path='/all-appoinment' element={<AllApoinments/>}/>
              <Route path='/add-doctor' element={<AddDoctor/>}/>
              <Route path='/doctor-list' element={<DoctorsList/>}/>
              <Route path='/add-student' element={<AddStudent/>}/>
              <Route path='/student-list' element={<StudentList/>}/>
              <Route path='/add-news' element={<AddNews/>}/>
              <Route path='/news-list' element={<NewsList/>}/>
              <Route path='/add-exam-session' element={<AddExamSession/>}/>

              {/* doctor route */}
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