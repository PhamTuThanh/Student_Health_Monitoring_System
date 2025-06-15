import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const AppContextProvider = ({ children }) => {
    const currency = '$';
    const [userData, setUserData] = useState(null);
    const [doctors, setDoctors] = useState(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const dToken = localStorage.getItem('dToken');

    useEffect(() => {
        const fetchUserData = async () => {
            if (dToken) {
                try {
                    const { data } = await axios.get(`${backendUrl}/api/doctor/profile`, {
                        headers: { dToken }
                    });
                    if (data.success) {
                        setUserData(data.profileData);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        };

        fetchUserData();
    }, [dToken, backendUrl]);

    const calculateAge = (dob) => {
        const today = new Date();
        const birtDate = new Date(dob);
        let age = today.getFullYear() - birtDate.getFullYear();
        return age;
    };

    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_');
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2];
    };

    const value = {
        calculateAge, 
        slotDateFormat, 
        currency, 
        userData, 
        setUserData, 
        doctors, 
        setDoctors, 
        backendUrl
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
