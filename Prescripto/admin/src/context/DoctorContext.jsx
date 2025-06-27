import { createContext, useState, useContext, useEffect } from "react";
import axios from 'axios'
import {toast} from 'react-toastify'

export const DoctorContext = createContext();

export const useDoctorContext = () => {
    return useContext(DoctorContext)
}

const DoctorContextProvider = ({ children }) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [dToken, setDToken] = useState(false)
    const [appoinments, setAppoinments] = useState([])
    const [dashData, setDashData]= useState(false)
    const [profileData, setProfileData]= useState(false)

    useEffect(() => {
        axios.defaults.withCredentials = true;
    }, []);

    const checkAuthStatus = async () => {
        try {
            const {data} = await axios.get(backendUrl + '/api/doctor/dashboard');
            if(data.success){
                setDToken(true);
                setDashData(data.dashData);
            }else{
                setDToken(false);
                setDashData(false);
            }
        } catch (error) {
            setDToken(false);
            setDashData(false);
        }
    };

    const getAppoinments = async () =>{
        try {
            const {data} = await axios.get(backendUrl + '/api/doctor/appoinments')
            if (data.success) {
                setAppoinments(data.appoinments)
                console.log(data.appoinments)
            } else {
                toast.error(data.message)  
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const completeAppoinment = async (appoinmentId)=>{
        try {
            const {data} = await axios.post(backendUrl+'/api/doctor/complete-appoinment', {appoinmentId})
            if(data.success){
                toast.success(data.message)
                getAppoinments()
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const cancelAppoinment = async (appoinmentId)=>{
        try {
            const {data} = await axios.post(backendUrl+'/api/doctor/cancel-appoinment', {appoinmentId})
            if(data.success){
                toast.success(data.message)
                getAppoinments()
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const refundStatus = async (appoinmentId)=>{
        try {
            const {data} = await axios.post(backendUrl+'/api/doctor/refund-status', {appoinmentId})
            if(data.success){
                toast.success(data.message)
                getAppoinments()
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const getDashData = async ()=>{
        try {
            const {data} = await axios.get(backendUrl + '/api/doctor/dashboard')
            if (data.success) {
                setDashData(data.dashData)
                console.log(data.dashData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const getProfileData = async()=>{
        try {
           const {data} = await axios.get(backendUrl+'/api/doctor/profile')
           if(data.success){
            setProfileData(data.profileData)
            console.log(data.profileData)
           } 
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const logout = async () => {
        try {
            await axios.post(backendUrl + '/api/doctor/logout');
            setDToken(false);
            toast.success('Logged out successfully!');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        dToken, setDToken, 
        backendUrl, appoinments, setAppoinments,
        getAppoinments,completeAppoinment
        , cancelAppoinment, dashData,
        setDashData, getDashData, profileData,
        setProfileData, getProfileData, refundStatus,
        checkAuthStatus, logout
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    return (
        <DoctorContext.Provider value={value}>
            {children}
        </DoctorContext.Provider>
    );
};

export default DoctorContextProvider;