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
import * as Notifications from 'expo-notifications';

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

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log("sent notification", message);
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message: Message) => {
      // Nếu không phải đang chat với người gửi, gửi notification
      if (!selectedDoctor || message.senderId !== selectedDoctor._id) {
          console.log("sent notification", message);
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'New message',
            body: message.text || message.message || message.content || 'You have a new message!',
            data: { senderId: message.senderId },
          },
          trigger: null,
        });
      }
    };
    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, selectedDoctor]);

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

  const filteredDoctors = doctors
    .filter(doctor => 
      doctor.name.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      const aIsOnline = isDoctorOnline(a._id);
      const bIsOnline = isDoctorOnline(b._id);
      
     
      if (aIsOnline && !bIsOnline) return -1;
      if (!aIsOnline && bIsOnline) return 1;
      return a.name.localeCompare(b.name);
    });

  const isSentByUser = (msg: Message) => msg.senderId === user?.id;

  const renderChatList = () => (
    <View style={styles.chatListContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctor..."
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

      {onlineUsers.length > 0 && (
        <View style={styles.onlineSection}>
          <Text style={styles.onlineSectionTitle}>Online</Text>
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

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading doctor list...</Text>
        </View>
      )}

      <ScrollView style={styles.doctorsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>All conversations</Text>
        
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
                    {doctor.name}
                  </Text>
                  <Text style={styles.messageTime}>2 hours</Text>
                </View>
                
                <View style={styles.messagePreview}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    Thank you for your consultation. I will follow up...
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
        
        {!loading && filteredDoctors.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💬</Text>
            <Text style={styles.emptyStateTitle}>
              {searchText ? 'No results found' : 'No conversation yet'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchText ? 'Try searching with a different keyword' : 'Start a conversation with a doctor'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderChatScreen = () => {
    const isOnline = isDoctorOnline(selectedDoctor!._id);
    
    return (
      <View style={styles.chatContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
        
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
                {selectedDoctor!.name}
              </Text>
              <Text style={[styles.chatHeaderStatus, { color: isOnline ? '#4CAF50' : '#9E9E9E' }]}>
                {isOnline ? 'Active' : 'Offline'}
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

        <View style={styles.messagesWrapper}>
          <ScrollView
            style={styles.messagesContainer}
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            <View style={styles.chatDateHeader}>
              <Text style={styles.chatDate}>Today</Text>
            </View>
            
            {messagesLoading ? (
              <View style={styles.messagesLoadingContainer}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.messagesLoadingText}>Loading messages...</Text>
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
                <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
                <Text style={styles.emptyMessagesSubtitle}>
                  Start a conversation with {selectedDoctor!.name}
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
                placeholder="Enter message..."
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