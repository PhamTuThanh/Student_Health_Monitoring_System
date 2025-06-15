import { createContext, useState, useContext } from "react";
import axios from 'axios'
import {toast} from 'react-toastify'

export const DoctorContext = createContext();

export const useDoctorContext = () => {
    return useContext(DoctorContext)
}

const DoctorContextProvider = ({ children }) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [dToken, setDToken] = useState(localStorage.getItem('dToken')?localStorage.getItem('dToken'):'')
    const [appoinments, setAppoinments] = useState([])
    const [dashData, setDashData]= useState(false)
    const [profileData, setProfileData]= useState(false)

    const getAppoinments = async () =>{
        try {
            const {data} = await axios.get(backendUrl + '/api/doctor/appoinments', {headers:{dToken}})
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
            const {data} = await axios.post(backendUrl+'/api/doctor/complete-appoinment', {appoinmentId}, {headers:{dToken}})
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
            const {data} = await axios.post(backendUrl+'/api/doctor/cancel-appoinment', {appoinmentId}, {headers:{dToken}})
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
            const {data} = await axios.post(backendUrl+'/api/doctor/refund-status', {appoinmentId}, {headers:{dToken}})
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
            const {data} = await axios.get(backendUrl + '/api/doctor/dashboard', {headers:{dToken}})
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
           const {data} = await axios.get(backendUrl+'/api/doctor/profile', {headers:{dToken}})
           if(data.success){
            setProfileData(data.profileData)
            console.log(data.profileData)
           } 
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const value = {
        dToken, setDToken, 
        backendUrl, appoinments, setAppoinments,
        getAppoinments,completeAppoinment
        , cancelAppoinment, dashData,
        setDashData, getDashData, profileData,
        setProfileData, getProfileData, refundStatus
    };

    return (
        <DoctorContext.Provider value={value}>
            {children}
        </DoctorContext.Provider>
    );
};

export default DoctorContextProvider;
