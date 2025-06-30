import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext();
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

const AppContextProvider = ({ children }) => {
    const currency = '$';
    const [userData, setUserData] = useState(null);
    const [doctors, setDoctors] = useState(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);

    const fetchUserData = async () => {
        try {
            // The dToken cookie will be sent automatically
            const { data } = await axios.get(`${backendUrl}/api/doctor/profile`);
            if (data.success) {
                setUserData(data.profileData);
            }
        } catch (error) {
            // It's normal for this to fail if not logged in as a doctor
            console.log("Could not fetch doctor profile, probably not logged in.");
        }
    };

    useEffect(() => {
        // Configure axios to send cookies with requests
        axios.defaults.withCredentials = true;
        fetchUserData();
    }, [backendUrl]);

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

    const hideNavbar = () => setIsNavbarVisible(false);
    const showNavbar = () => setIsNavbarVisible(true);

    const value = {
        calculateAge, 
        slotDateFormat, 
        currency, 
        userData, 
        setUserData, 
        doctors, 
        setDoctors, 
        backendUrl,
        isNavbarVisible,
        hideNavbar,
        showNavbar,
        fetchUserData
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;