import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

export const AdminContext = createContext();

const AdminContextProvider = ({children}) => {
    
    const [aToken, setAToken] = useState(false)
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [doctors, setDoctors] = useState([])
    const [appoinments, setAppoinments] = useState([])
    const [dashData, setDashData] = useState(false)

    useEffect(() => {
        axios.defaults.withCredentials = true;
    }, []);

    const checkAuthStatus = async () => {
        try {
            const {data} = await axios.get(backendUrl + '/api/admin/dashboard');
            if(data.success){
                setAToken(true);
                setDashData(data.dashData);
            }else{
                setAToken(false);
                setDashData(false);
            }
        } catch (error) {
            setAToken(false);
            setDashData(false);
        }
    };

    const getAllDoctors = async ()=>{
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/all-doctors', {})
            if (data.success) {
                setDoctors(data.doctors)
                console.log(data.doctors)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
                toast.error(error.message)
        }
    }

    const changeAvailability = async (docId)=>{
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/change-availability', {docId})
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
                
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getAllAppoinments = async ()=>{
        try {
            const {data} = await axios.get(backendUrl+'/api/admin/appoinments')
            if(data.success){
                setAppoinments(data.appoinments)
                console.log(data.appoinments)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    const cancelAppoinment = async (appoinmentId)=>{
        try {
            const {data} = await axios.post(backendUrl+'/api/admin/cancel-appoinment',{appoinmentId})
            if (data.success) {
                toast.success(data.message)
                getAllAppoinments()
            } else {
                toast.error(data.message)
                
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    const getDashData = async ()=>{
        try {
            const {data} = await axios.get(backendUrl + '/api/admin/dashboard')
            if(data.success){
                setDashData(data.dashData)
                console.log(data.dashData)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    const deleteDoctor = async (docId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/delete-doctor', { docId });
            if (data.success) {
                toast.success(data.message);
                getAllDoctors(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const logout = async () => {
        try {
            await axios.post(backendUrl + '/api/admin/logout');
            setAToken(false);
            toast.success('Logged out successfully!');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
    
   
    const value = {
        aToken, setAToken,
        backendUrl,doctors,
        getAllDoctors, changeAvailability,
        appoinments, setAppoinments,
        getAllAppoinments, cancelAppoinment,
        dashData, getDashData, deleteDoctor,
        checkAuthStatus, logout
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};

export default AdminContextProvider;