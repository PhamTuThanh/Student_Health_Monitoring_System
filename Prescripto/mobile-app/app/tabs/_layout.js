const { Tabs } = require("expo-router");
import { FontAwesome } from "@expo/vector-icons";
export default function RootLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="home" options={{headerShown: false, title: "Home",
                tabBarIcon: ({ color}) => (
                    <FontAwesome name="home" color={color} size={24} />
                ),
            }} />
            <Tabs.Screen name="messages" options={{headerShown: false, title: "Messages",
                tabBarIcon: ({ color}) => (
                    <FontAwesome name="comments" color={color} size={24} />
                ),
            }} />
            <Tabs.Screen name="chatbot" options={{headerShown: false, title: "Chatbot",
                tabBarIcon: ({ color}) => (
                    <FontAwesome name="comments" color={color} size={24} />
                ),
            }} />
            <Tabs.Screen name="profile" options={{headerShown: false, title: "Profile",
                tabBarIcon: ({ color}) => (
                    <FontAwesome name="user" color={color} size={24} />
                ),
            }} />
            <Tabs.Screen name="announcements" options={{headerShown: false, title: "Announcements",
                tabBarIcon: ({ color}) => (
                    <FontAwesome name="bullhorn" color={color} size={24} />
                ),
            }} />
            <Tabs.Screen name="settings" options={{headerShown: false, title: "Settings",
                tabBarIcon: ({ color}) => (
                    <FontAwesome name="gear" color={color} size={24} />
                ),
            }} />
        </Tabs>
    )
}
