import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import MyProfile from './pages/MyProfile';
import MyAppoinments from './pages/MyAppoinments';
import Appoinment from './pages/Appoinment';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StudentChat from './pages/StudentChat';
import ChatBot from './pages/ChatBot';
// import jwt_decode from 'jwt-decode';
// import { useAppContext } from './context/AppContext';
// export function isTokenExpired(token) {
//   try {
//     const decoded = jwt_decode(token);
//     const currentTime = Date.now() / 1000;
//     return decoded.exp < currentTime;
//   } catch (err) {
//     return true;
//   }
// }
const App = () => {
 // const {token} = useAppContext();
  return (
        <div className='mx-4 sm:mx-[7%] '>
          {/* {isTokenExpired(token) && <Navigate to="/login" />} */}
          <ToastContainer/>
          <Navbar />
          <Routes>
            <Route path='/' element={<Home />}/>
            <Route path='/doctors' element={<Doctors />}/>
            <Route path='/doctors/:speciality' element={<Doctors />}/>
            <Route path='/login' element={<Login />}/>
            <Route path='/about' element={<About />}/>
            <Route path='/contact' element={<Contact />}/>
            <Route path='/my-profile' element={<MyProfile />}/>
            <Route path='/my-appoinments' element={<MyAppoinments />}/>
            <Route path='/appoinment/:docId' element={<Appoinment />}/>
            <Route path='/student_chat' element={<StudentChat />}/>
            <Route path='/chatbot' element={<ChatBot />}/>
          </Routes>
          <Footer />
        </div>
  );
};

export default App;