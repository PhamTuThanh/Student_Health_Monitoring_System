import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSocket } from "../socket/socket";
const { BACKEND_URL, BACKEND_URL_CHATBOT } = require('../../../ngrok-urls.json');
import store from '../../redux/store';
import { logoutAction } from '../../redux/authSlice';


const loginUser = async (values) => {
    const response = await axios.post(`${BACKEND_URL}/api/user/login`, values, {
        headers: { "Content-Type": "application/json" }
    });
    const { token } = response.data;
    if (token) {
        await AsyncStorage.setItem("token", token);
    }
    console.log("response", response.data);
    return response.data;
}

const registerUser = async (values) => {
    const response = await axios.post(`${BACKEND_URL}/api/user/register`,
     values,
     {headers: { "Content-Type": "application/json" }}
    )
    return response.data
}
const forgotPassword = async (email) => {
    const response = await axios.post(`${BACKEND_URL}/api/user/forgot-password`, {email})
    return response.data
}
const changePassword = async (passwordData) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }
    const response = await axios.post(`${BACKEND_URL}/api/user/change-password`, passwordData, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return response.data;
}
const getChatbot = async (message, studentId, studentName) => {
    const response = await axios.post(`${BACKEND_URL_CHATBOT}/api/chat`, {
        message,
        studentId,
        studentName
    })
    return response.data
}
//lấy dữ liệu từ bảng physical của mỗi user
const getDataPhysical = async (studentId) => {
    const response = await axios.get(`${BACKEND_URL}/api/user/data-physical/${studentId}`)
    return response.data
}
const messageSidebar = async () => {
    const token = await AsyncStorage.getItem("token");
    console.log("token", token);
    const response = await axios.get(`${BACKEND_URL}/api/user/doctors-for-chat`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    console.log("response", response.data);
    return response.data
}
const getMessage = async (_id) => {
    const token = await AsyncStorage.getItem("token");
    const response = await axios.get(`${BACKEND_URL}/api/messages/${_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    return response.data
}
const sendMessage = async (message, _id) => {
    try {
        const token = await AsyncStorage.getItem("token");
        
        const response = await axios.post(
            `${BACKEND_URL}/api/messages/send/${_id}`, 
            {message}, 
            {
                headers: { "Authorization": `Bearer ${token}` }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}
// Thêm vào api.js
const saveChatHistory = async (chatData) => { 
    try {
        const token = await AsyncStorage.getItem("token");
        console.log("Token for saveChatHistory:", token); // Debug log
        if (!token) {
            throw new Error("No authentication token found");
        }

        // Format lại dữ liệu trước khi gửi
        const formattedData = {
            studentId: chatData.studentId,
            studentName: chatData.studentName,
            messages: chatData.messages.map(msg => ({
                sender: msg.sender,
                content: msg.content,
                timestamp: new Date(msg.timestamp).toISOString() // Chuyển đổi Date thành string
            }))
        };
        
        console.log("Formatted data for saveChatHistory:", formattedData); // Debug log
        
        const response = await axios.post(
            `${BACKEND_URL}/api/user/save-chat-history`,
            formattedData,
            {
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("Save chat history response:", response.data); // Debug log
        return response.data;
    } catch (error) {
        console.error("Error in saveChatHistory:", error.response?.data || error.message);
        console.error("Full error object:", error); // Debug log
        // Nếu có lỗi từ server, ném lỗi để xử lý ở nơi gọi
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || "Error saving chat history");
        }
        // Nếu không có lỗi từ server, ném lỗi chung
        console.error("Error saving chat history:", error);
        console.error("Error details:", error.response ? error.response.data : error.message);
        throw error;
    }
};
const getChatHistory = async (studentId) => {
    try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
            throw new Error("No authentication token found");
        }

        const response = await axios.get(
            `${BACKEND_URL}/api/user/get-chat-history/${studentId}`,
            {
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // Nếu response.data là object, không phải mảng
        if (response.data && response.data.messages) {
            response.data.messages = response.data.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
        }

        return response.data;
    } catch (error) {
     //   console.error("Error in getChatHistory:", error.response?.data || error.message);
        throw error;
    }
};
const getAnnouncements = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }
    const response = await axios.get(
        `${BACKEND_URL}/api/user/get-announcements`,
        {
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    return response.data;
};
const getInfoUser = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found"); 
    }
    const response = await axios.get(`${BACKEND_URL}/api/user/get-profile`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return response.data;
};
const getPhysicalData = async (studentId, examSessionId) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }
    let url = `${BACKEND_URL}/api/user/data-physical/${studentId}`;
    if (examSessionId) {
        url += `?examSessionId=${examSessionId}`;
    }
    const response = await axios.get(url, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return response.data;
};

// New API to get exam sessions for a student
const getExamSessions = async (studentId) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }
    const response = await axios.get(`${BACKEND_URL}/api/user/get-exam-sessions/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return response.data;
};

// New API to compare health data between exam sessions
const compareHealthData = async (studentId, examSessionId1, examSessionId2) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }
    const response = await axios.get(`${BACKEND_URL}/api/user/compare-health-data/${studentId}?examSessionId1=${examSessionId1}&examSessionId2=${examSessionId2}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return response.data;
};
const getAbnormality = async (studentId) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }
    const response = await axios.get(`${BACKEND_URL}/api/user/get-abnormality/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return response.data;
};
const getPrescription = async (studentId) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }
    const response = await axios.get(`${BACKEND_URL}/api/user/get-prescription/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return response.data;
};
const getHealthScores = async (studentId) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }
    const response = await axios.get(`${BACKEND_URL}/api/user/get-health-scores/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return response.data;
};
axios.interceptors.response.use(
    response => response,
    async error => {
        if (
            error.response?.status === 401 &&
            (error.response?.data?.message?.includes("token") ||
             error.response?.data?.message?.toLowerCase().includes("auth"))
        ) {
            // Xóa token và user info
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("userInfo");
            
            // Dispatch logout action để update Redux state
            store.dispatch(logoutAction());
            
            console.log("Token expired - User logged out automatically");
        }
        return Promise.reject(error);
    }
);
export {loginUser, registerUser, getChatbot, getDataPhysical, messageSidebar, getMessage, sendMessage, saveChatHistory, getChatHistory, getAnnouncements, getInfoUser, getPhysicalData, getExamSessions, compareHealthData, forgotPassword, changePassword, getAbnormality, getPrescription, getHealthScores};
