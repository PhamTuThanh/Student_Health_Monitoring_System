// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   View, 
//   Text, 
//   TouchableOpacity, 
//   ScrollView, 
//   ActivityIndicator, 
//   Image, 
//   TextInput,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import { messageSidebar, sendMessage as apiSendMessage, getMessage } from '../services/api/api';
// import { useSocketContext } from '../context/SocketContext';
// import { useSelector } from 'react-redux';

// interface Doctor {
//   _id: string;
//   name: string;
//   image: string;
// }

// interface Message {
//   _id?: string;
//   id?: number;
//   text?: string;
//   message?: string;
//   content?: string;
//   sender: string;
//   time?: string;
//   createdAt?: string;
//   timestamp?: string;
//   receiverId?: string;
//   senderId?: string;
// }

// const Messages = () => {
//   const [doctors, setDoctors] = useState<Doctor[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
//   const [message, setMessage] = useState('');
//   const [searchText, setSearchText] = useState('');
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [messagesLoading, setMessagesLoading] = useState(false);
//   const {socket, onlineUsers} = useSocketContext();
//   const user = useSelector((state: any) => state.auth.user);
//   const scrollViewRef = useRef<ScrollView>(null);
//   const isOnline = onlineUsers.includes(selectedDoctor?._id || '');

//   useEffect(() => {
//     const fetchDoctors = async () => {
//       setLoading(true);
//       try {
//         const data = await messageSidebar();
//         setDoctors(data.data || data);
//         console.log("data for doctors", data);
//       } catch (error) {
//         console.log("error", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDoctors();
//   }, []);

//   useEffect(() => {
//     const fetchMessages = async () => {
//       if (selectedDoctor) {
//         setMessagesLoading(true);
//         try {
//           const data = await getMessage(selectedDoctor._id);
//           setMessages(data);
//         } catch (error) {
//           console.log("error fetching messages", error);
//         } finally {
//           setMessagesLoading(false);
//         }
//       }
//     };
//     fetchMessages();
//   }, [selectedDoctor]);

//   useEffect(() => {
//     if (socket) {
//       socket.on("newMessage", (message: Message) => {
//         if (selectedDoctor && message.senderId === selectedDoctor._id) {
//           setMessages((prev) => [...prev, message]);
//         }
//       });

//       return () => {
//         socket.off("newMessage");
//       };
//     }
//   }, [socket, selectedDoctor]);

//   useEffect(() => {
//     if (scrollViewRef.current) {
//       scrollViewRef.current.scrollToEnd({ animated: true });
//     }
//   }, [messages]);

//   const handleSendMessage = async () => {
//     if (!message.trim() || !selectedDoctor) return;

//     try {
//         const response = await apiSendMessage(message, selectedDoctor._id);

//         if (response) {
//             setMessages((prev) => [...prev, response]);
//             setMessage("");
            
//             if (socket) {
//                 socket.emit("newMessage", {
//                     message,
//                     receiverId: selectedDoctor._id,
//                     senderId: response.senderId,
//                     _id: response._id,
//                     createdAt: response.createdAt
//                 });
//             }
//         }
//     } catch (error) {
//         console.error("Error sending message:", error);
//     }
//   };

//   const renderAvatar = (doctor: Doctor) => {
//     if (doctor.image) {
//       return (
//         <Image 
//           source={{ uri: doctor.image }} 
//           style={styles.avatar}
//         />
//       );
//     }
//     return (
//       <View style={styles.avatarPlaceholder}>
//         <Text style={styles.avatarText}>
//           {doctor.name.charAt(0).toUpperCase()}
//         </Text>
//       </View>
//     );
//   };

//   const filteredDoctors = doctors.filter(doctor => 
//     doctor.name.toLowerCase().includes(searchText.toLowerCase())
//   );

//   // Xác định bên trái/phải
//   const isSentByUser = (msg: Message) => msg.senderId === user?.id;

//   // Màn hình danh sách chat (Sidebar toàn màn hình)
//   const renderChatList = () => (
//     <View style={styles.chatListContainer}>
//       <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
//       {/* Header */}
//       <View style={styles.chatListHeader}>
//         <Text style={styles.chatListTitle}>Chats</Text>
//         <View style={styles.headerButtons}>
//           <TouchableOpacity style={styles.headerButton}>
//             <Text style={styles.headerButtonText}>⋯</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.headerButton}>
//             <Text style={styles.headerButtonText}>✎</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBar}>
//           <Text style={styles.searchIcon}>🔍</Text>
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Tìm kiếm"
//             value={searchText}
//             onChangeText={setSearchText}
//             placeholderTextColor="#65676b"
//           />
//         </View>
//       </View>

//       {/* Loading */}
//       {loading && (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#0084ff" />
//         </View>
//       )}

//       {/* Doctors List */}
//       <ScrollView style={styles.doctorsList} showsVerticalScrollIndicator={false}>
//         {filteredDoctors.map((doctor) => (
//           <TouchableOpacity
//             key={doctor._id}
//             onPress={() => {
//               console.log("Selected doctor:", doctor);
//               setSelectedDoctor(doctor);
//             }}
//             style={styles.doctorItem}
//             activeOpacity={0.7}
//           >
//             <View style={styles.doctorAvatarContainer}>
//               {renderAvatar(doctor)}
//               {isOnline && <View style={styles.onlineIndicator} />}
//             </View>
            
//             <View style={styles.doctorInfo}>
//               <View style={styles.doctorNameRow}>
//                 <Text style={styles.doctorName} numberOfLines={1}>
//                   BS. {doctor.name}
//                 </Text>
//                 <Text style={styles.messageTime}>2 giờ</Text>
//               </View>
//               <Text style={styles.lastMessage} numberOfLines={1}>
//                 Cảm ơn bạn đã tư vấn. Tôi sẽ thực hiện theo...
//               </Text>
//             </View>
//           </TouchableOpacity>
//         ))}
        
//         {/* Empty state khi không có kết quả tìm kiếm */}
//         {!loading && filteredDoctors.length === 0 && (
//           <View style={styles.emptySearchState}>
//             <Text style={styles.emptySearchText}>
//               {searchText ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện nào'}
//             </Text>
//           </View>
//         )}
//       </ScrollView>
//     </View>
//   );

//   // Màn hình chat
//   const renderChatScreen = () => (
//     <View style={styles.chatContainer}>
//       <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
//       {/* Chat Header */}
//       <View style={styles.chatHeader}>
//         <TouchableOpacity 
//           style={styles.backButton}
//           onPress={() => setSelectedDoctor(null)}
//         >
//           <Text style={styles.backButtonText}>←</Text>
//         </TouchableOpacity>
        
//         <View style={styles.chatHeaderInfo}>
//           {renderAvatar(selectedDoctor!)}
//           <View style={styles.chatHeaderText}>
//             <Text style={styles.chatHeaderName}>
//               BS. {selectedDoctor!.name}
//             </Text>
//             <Text style={styles.chatHeaderStatus}>
//               Đang hoạt động
//             </Text>
//           </View>
//         </View>
        
//         <View style={styles.chatHeaderActions}>
//           <TouchableOpacity style={styles.chatActionButton}>
//             <Text style={styles.chatActionText}>📞</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.chatActionButton}>
//             <Text style={styles.chatActionText}>📹</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Messages */}
//       <ScrollView
//         style={styles.messagesContainer}
//         ref={scrollViewRef}
//         showsVerticalScrollIndicator={false}
//         onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
//       >
//         <View style={styles.chatDateHeader}>
//           <Text style={styles.chatDate}>Hôm nay</Text>
//         </View>
        
//         {messagesLoading ? (
//           <View style={styles.messagesLoadingContainer}>
//             <ActivityIndicator size="small" color="#0084ff" />
//             <Text style={styles.messagesLoadingText}>Đang tải tin nhắn...</Text>
//           </View>
//         ) : messages.length > 0 ? (
//           messages.map((msg, index) => (
//             <View
//               key={msg._id || msg.id || index}
//               style={[
//                 styles.messageItem,
//                 isSentByUser(msg) ? styles.userMessage : styles.doctorMessage
//               ]}
//             >
//               <View style={[
//                 styles.messageBubble,
//                 isSentByUser(msg) ? styles.userBubble : styles.doctorBubble
//               ]}>
//                 <Text style={[
//                   styles.messageText,
//                   isSentByUser(msg) ? styles.userMessageText : styles.doctorMessageText
//                 ]}>
//                   {msg.text || msg.message || msg.content}
//                 </Text>
//               </View>
//               <Text style={styles.messageTime}>
//                 {msg.time || new Date(msg.createdAt || msg.timestamp || new Date()).toLocaleTimeString('vi-VN', { 
//                   hour: '2-digit', 
//                   minute: '2-digit' 
//                 })}
//               </Text>
//             </View>
//           ))
//         ) : (
//           <View style={styles.emptyMessagesState}>
//             <Text style={styles.emptyMessagesText}>
//               Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
//             </Text>
//           </View>
//         )}
//       </ScrollView>

//       {/* Message Input */}
//       <View style={styles.inputContainer}>
//         <View style={styles.inputWrapper}>
//           <TouchableOpacity style={styles.attachButton}>
//             <Text style={styles.attachButtonText}>+</Text>
//           </TouchableOpacity>
          
//           <TextInput
//             style={styles.textInput}
//             placeholder="Aa"
//             value={message}
//             onChangeText={setMessage}
//             multiline
//             placeholderTextColor="#65676b"
//           />
          
//           {message.trim() ? (
//             <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
//               <Text style={styles.sendButtonText}>➤</Text>
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity style={styles.emojiButton}>
//               <Text style={styles.emojiButtonText}>😊</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       {selectedDoctor ? renderChatScreen() : renderChatList()}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
  
//   // Chat List Styles
//   chatListContainer: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   chatListHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e4e6ea',
//   },
//   chatListTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1c1e21',
//   },
//   headerButtons: {
//     flexDirection: 'row',
//   },
//   headerButton: {
//     marginLeft: 16,
//     padding: 8,
//   },
//   headerButtonText: {
//     fontSize: 18,
//     color: '#1c1e21',
//   },
//   searchContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f0f2f5',
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//   },
//   searchIcon: {
//     fontSize: 16,
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#1c1e21',
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   doctorsList: {
//     flex: 1,
//   },
//   doctorItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   doctorAvatarContainer: {
//     position: 'relative',
//     marginRight: 12,
//   },
//   avatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//   },
//   avatarPlaceholder: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#0084ff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarText: {
//     color: '#ffffff',
//     fontWeight: 'bold',
//     fontSize: 20,
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//     backgroundColor: '#42b883',
//     borderWidth: 2,
//     borderColor: '#ffffff',
//   },
//   doctorInfo: {
//     flex: 1,
//   },
//   doctorNameRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   doctorName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1c1e21',
//     flex: 1,
//   },
//   lastMessage: {
//     fontSize: 14,
//     color: '#65676b',
//     flex: 1,
//   },
//   messageTime: {
//     fontSize: 12,
//     color: '#65676b',
//   },
//   emptySearchState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//   },
//   emptySearchText: {
//     fontSize: 16,
//     color: '#65676b',
//   },

//   // Chat Screen Styles
//   chatContainer: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   chatHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e4e6ea',
//     backgroundColor: '#ffffff',
//   },
//   backButton: {
//     padding: 8,
//     marginRight: 8,
//   },
//   backButtonText: {
//     fontSize: 20,
//     color: '#0084ff',
//   },
//   chatHeaderInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   chatHeaderText: {
//     marginLeft: 12,
//     flex: 1,
//   },
//   chatHeaderName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1c1e21',
//   },
//   chatHeaderStatus: {
//     fontSize: 12,
//     color: '#42b883',
//     marginTop: 2,
//   },
//   chatHeaderActions: {
//     flexDirection: 'row',
//   },
//   chatActionButton: {
//     padding: 8,
//     marginLeft: 8,
//   },
//   chatActionText: {
//     fontSize: 18,
//   },
//   messagesContainer: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   chatDateHeader: {
//     alignItems: 'center',
//     paddingVertical: 16,
//   },
//   chatDate: {
//     fontSize: 12,
//     color: '#65676b',
//     backgroundColor: '#f0f2f5',
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   messageItem: {
//     marginBottom: 8,
//   },
//   userMessage: {
//     alignItems: 'flex-end',
//   },
//   doctorMessage: {
//     alignItems: 'flex-start',
//   },
//   messageBubble: {
//     maxWidth: '75%',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 18,
//   },
//   userBubble: {
//     backgroundColor: '#0084ff',
//   },
//   doctorBubble: {
//     backgroundColor: '#f0f2f5',
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 20,
//   },
//   userMessageText: {
//     color: '#ffffff',
//   },
//   doctorMessageText: {
//     color: '#1c1e21',
//   },
//   inputContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#ffffff',
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     backgroundColor: '#f0f2f5',
//     borderRadius: 20,
//     paddingHorizontal: 4,
//     paddingVertical: 4,
//   },
//   attachButton: {
//     padding: 8,
//   },
//   attachButtonText: {
//     fontSize: 18,
//     color: '#0084ff',
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 16,
//     maxHeight: 100,
//     color: '#1c1e21',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//   },
//   sendButton: {
//     padding: 8,
//   },
//   sendButtonText: {
//     fontSize: 16,
//     color: '#0084ff',
//   },
//   emojiButton: {
//     padding: 8,
//   },
//   emojiButtonText: {
//     fontSize: 16,
//   },
//   messagesLoadingContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 20,
//   },
//   messagesLoadingText: {
//     marginTop: 8,
//     fontSize: 14,
//     color: '#65676b',
//   },
//   emptyMessagesState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//   },
//   emptyMessagesText: {
//     fontSize: 16,
//     color: '#65676b',
//   },
// });

// export default Messages;
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Image, 
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { messageSidebar, sendMessage as apiSendMessage, getMessage } from '../services/api/api';
import { useSocketContext } from '../context/SocketContext';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

interface Doctor {
  _id: string;
  name: string;
  image: string;
}

interface Message {
  _id?: string;
  id?: number;
  text?: string;
  message?: string;
  content?: string;
  sender: string;
  time?: string;
  createdAt?: string;
  timestamp?: string;
  receiverId?: string;
  senderId?: string;
}

const Messages = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [message, setMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const {socket, onlineUsers} = useSocketContext();
  const user = useSelector((state: any) => state.auth.user);
  const scrollViewRef = useRef<ScrollView>(null);

  // Check if doctor is online
  const isDoctorOnline = (doctorId: string) => onlineUsers.includes(doctorId);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const data = await messageSidebar();
        setDoctors(data.data || data);
      //  console.log("data for doctors", data);
      } catch (error) {
        console.log("error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedDoctor) {
        setMessagesLoading(true);
        try {
          const data = await getMessage(selectedDoctor._id);
          setMessages(data);
        } catch (error) {
          console.log("error fetching messages", error);
        } finally {
          setMessagesLoading(false);
        }
      }
    };
    fetchMessages();
  }, [selectedDoctor]);

  useEffect(() => {
    if (socket) {
      socket.on("newMessage", (message: Message) => {
        if (selectedDoctor && message.senderId === selectedDoctor._id) {
          setMessages((prev) => [...prev, message]);
        }
      });

      return () => {
        socket.off("newMessage");
      };
    }
  }, [socket, selectedDoctor]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedDoctor) return;

    try {
        const response = await apiSendMessage(message, selectedDoctor._id);

        if (response) {
            setMessages((prev) => [...prev, response]);
            setMessage("");
            
            // if (socket) {
            //     socket.emit("newMessage", {
            //         message,
            //         receiverId: selectedDoctor._id,
            //         senderId: response.senderId,
            //         _id: response._id,
            //         createdAt: response.createdAt
            //     });
            // }
        }
    } catch (error) {
        console.error("Error sending message:", error);
    }
  };

  const renderAvatar = (doctor: Doctor, size = 60) => {
    const isOnline = isDoctorOnline(doctor._id);
    
    return (
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        {doctor.image ? (
          <Image 
            source={{ uri: doctor.image }} 
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { 
            width: size, 
            height: size, 
            borderRadius: size / 2 
          }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>
              {doctor.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Online indicator */}
        <View style={[
          styles.onlineIndicator, 
          { 
            width: size * 0.25, 
            height: size * 0.25,
            borderRadius: size * 0.125,
            bottom: size * 0.05,
            right: size * 0.05,
            backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E',
            borderWidth: size * 0.05,
          }
        ]} />
      </View>
    );
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const isSentByUser = (msg: Message) => msg.senderId === user?.id;

  // Enhanced Chat List Screen
  const renderChatList = () => (
    <View style={styles.chatListContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Enhanced Header with gradient */}
      {/* <View style={styles.chatListHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.chatListTitle}>Tin nhắn</Text>
          <Text style={styles.onlineUsersCount}>
            {onlineUsers.length} đang trực tuyến
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Text style={styles.headerActionIcon}>📝</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Text style={styles.headerActionIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View> */}

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bác sĩ..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#90A4AE"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Online Users Section */}
      {onlineUsers.length > 0 && (
        <View style={styles.onlineSection}>
          <Text style={styles.onlineSectionTitle}>Đang trực tuyến</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.onlineUsersList}>
            {doctors.filter(doctor => isDoctorOnline(doctor._id)).map((doctor) => (
              <TouchableOpacity
                key={`online-${doctor._id}`}
                onPress={() => setSelectedDoctor(doctor)}
                style={styles.onlineUserItem}
              >
                {renderAvatar(doctor, 50)}
                <Text style={styles.onlineUserName} numberOfLines={1}>
                  {doctor.name.split(' ').pop()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
        </View>
      )}

      {/* Enhanced Doctors List */}
      <ScrollView style={styles.doctorsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Tất cả cuộc trò chuyện</Text>
        
        {filteredDoctors.map((doctor) => {
          const isOnline = isDoctorOnline(doctor._id);
          return (
            <TouchableOpacity
              key={doctor._id}
              onPress={() => setSelectedDoctor(doctor)}
              style={[styles.doctorItem, isOnline && styles.onlineDoctorItem]}
              activeOpacity={0.8}
            >
              {renderAvatar(doctor, 60)}
              
              <View style={styles.doctorInfo}>
                <View style={styles.doctorHeader}>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    BS. {doctor.name}
                  </Text>
                  <Text style={styles.messageTime}>2 giờ</Text>
                </View>
                
                <View style={styles.messagePreview}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    Cảm ơn bạn đã tư vấn. Tôi sẽ thực hiện theo...
                  </Text>
                  {isOnline && (
                    <View style={styles.onlineBadge}>
                      <Text style={styles.onlineBadgeText}>Online</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        
        {/* Enhanced Empty State */}
        {!loading && filteredDoctors.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💬</Text>
            <Text style={styles.emptyStateTitle}>
              {searchText ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchText ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu trò chuyện với bác sĩ'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Enhanced Chat Screen
  const renderChatScreen = () => {
    const isOnline = isDoctorOnline(selectedDoctor!._id);
    
    return (
      <View style={styles.chatContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
        
        {/* Enhanced Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedDoctor(null)}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            {renderAvatar(selectedDoctor!, 45)}
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderName}>
                BS. {selectedDoctor!.name}
              </Text>
              <Text style={[styles.chatHeaderStatus, { color: isOnline ? '#4CAF50' : '#9E9E9E' }]}>
                {isOnline ? 'Đang hoạt động' : 'Offline'}
              </Text>
            </View>
          </View>
          
          {/* <View style={styles.chatHeaderActions}>
            <TouchableOpacity style={styles.chatActionButton}>
              <Text style={styles.chatActionIcon}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatActionButton}>
              <Text style={styles.chatActionIcon}>📹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatActionButton}>
              <Text style={styles.chatActionIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View> */}
        </View>

        {/* Enhanced Messages Container */}
        <View style={styles.messagesWrapper}>
          <ScrollView
            style={styles.messagesContainer}
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            <View style={styles.chatDateHeader}>
              <Text style={styles.chatDate}>Hôm nay</Text>
            </View>
            
            {messagesLoading ? (
              <View style={styles.messagesLoadingContainer}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.messagesLoadingText}>Đang tải tin nhắn...</Text>
              </View>
            ) : messages.length > 0 ? (
              messages.map((msg, index) => {
                const isSent = isSentByUser(msg);
                return (
                  <View
                    key={msg._id || msg.id || index}
                    style={[
                      styles.messageItem,
                      isSent ? styles.userMessage : styles.doctorMessage
                    ]}
                  >
                    <View style={[
                      styles.messageBubble,
                      isSent ? styles.userBubble : styles.doctorBubble
                    ]}>
                      <Text style={[
                        styles.messageText,
                        isSent ? styles.userMessageText : styles.doctorMessageText
                      ]}>
                        {msg.text || msg.message || msg.content}
                      </Text>
                    </View>
                    <Text style={[styles.messageTimestamp, isSent && styles.userMessageTimestamp]}>
                      {msg.time || new Date(msg.createdAt || msg.timestamp || new Date()).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyMessagesState}>
                <Text style={styles.emptyMessagesIcon}>💬</Text>
                <Text style={styles.emptyMessagesTitle}>Chưa có tin nhắn</Text>
                <Text style={styles.emptyMessagesSubtitle}>
                  Hãy bắt đầu cuộc trò chuyện với BS. {selectedDoctor!.name}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Enhanced Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Text style={styles.attachButtonIcon}>📎</Text>
            </TouchableOpacity>
            
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập tin nhắn..."
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                placeholderTextColor="#90A4AE"
              />
            </View>
            
            {message.trim() ? (
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Text style={styles.sendButtonIcon}>➤</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.emojiButton}>
                <Text style={styles.emojiButtonIcon}>😊</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {selectedDoctor ? renderChatScreen() : renderChatList()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    marginTop: 30,
  },
  
  // Enhanced Chat List Styles
  chatListContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  chatListHeader: {
    backgroundColor: '#2196F3',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  chatListTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  onlineUsersCount: {
    fontSize: 14,
    color: '#E3F2FD',
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerActionIcon: {
    fontSize: 16,
  },
  
  // Enhanced Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0  },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#90A4AE',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#263238',
  },
  clearSearchIcon: {
    fontSize: 14,
    color: '#90A4AE',
    padding: 4,
  },
  
  // Online Section Styles
  onlineSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  onlineSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  onlineUsersList: {
    paddingLeft: 20,
  },
  onlineUserItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  onlineUserName: {
    fontSize: 12,
    color: '#546E7A',
    marginTop: 6,
    textAlign: 'center',
  },
  
  // Enhanced Doctor List Styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#546E7A',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  doctorsList: {
    flex: 1,
  },
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  onlineDoctorItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    backgroundColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#263238',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: '#90A4AE',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#78909C',
    flex: 1,
  },
  onlineBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  onlineBadgeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  
  // Enhanced Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#546E7A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#90A4AE',
    textAlign: 'center',
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#90A4AE',
  },

  // Enhanced Chat Screen Styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    elevation: 4,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatHeaderStatus: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  chatHeaderActions: {
    flexDirection: 'row',
  },
  chatActionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chatActionIcon: {
    fontSize: 16,
  },
  
  // Enhanced Messages Styles
  messagesWrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatDateHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  chatDate: {
    fontSize: 12,
    color: '#90A4AE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    fontWeight: '500',
    elevation: 1,
  },
  messageItem: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  doctorMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 6,
  },
  doctorBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  doctorMessageText: {
    color: '#263238',
  },
  messageTimestamp: {
    fontSize: 11,
    color: '#90A4AE',
    marginTop: 4,
    marginHorizontal: 4,
  },
  userMessageTimestamp: {
    textAlign: 'right',
  },
  
  // Enhanced Input Styles
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F7FA',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 60,
  },
  attachButton: {
    padding: 8,
  },
  attachButtonIcon: {
    fontSize: 18,
    color: '#90A4AE',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  
  },
  textInput: {
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    color: '#263238',
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  sendButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  emojiButton: {
    padding: 10,
  },
  emojiButtonIcon: {
    fontSize: 18,
  },
  
  // Enhanced Loading and Empty States
  messagesLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  messagesLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#90A4AE',
  },
  emptyMessagesState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyMessagesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyMessagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#546E7A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessagesSubtitle: {
    fontSize: 14,
    color: '#90A4AE',
    textAlign: 'center',
  },
});

export default Messages;