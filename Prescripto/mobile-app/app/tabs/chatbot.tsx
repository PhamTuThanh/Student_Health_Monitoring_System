import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from "react-native";
import { getChatbot, getDataPhysical, saveChatHistory, getChatHistory } from "../services/api/api";
import { useSelector } from "react-redux";
import Markdown from "react-native-markdown-display";

// Type definitions
interface Message {
  id: string;
  sender: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface ChatbotResponse {
  response?: string;
}

interface PhysicalDataResponse {
  data: Array<Record<string, any>>;
}

interface RootState {
  auth: {
    user: {
      studentId: string;
      studentName: string;
    };
  };
}

const { width: screenWidth } = Dimensions.get("window");

const Chatbot: React.FC = () => {
  // const [messages, setMessages] = useState<Message[]>([
  //   {
  //     id: "1",
  //     sender: "bot",
  //     content: "Xin chào! Tôi là trợ lý sức khỏe AI của bạn. Tôi có thể giúp gì cho bạn hôm nay? 🏥✨",
  //     timestamp: new Date(),
  //   },
  // ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [inputHeight, setInputHeight] = useState<number>(50);
  const flatListRef = useRef<FlatList<Message>>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;

    const timestamp = Date.now();
    const userMessage: Message = {
      id: `${timestamp}-user-${Math.random().toString(36).substr(2, 9)}`,
      sender: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setInputHeight(50);
    setLoading(true);

    try {
      const res: ChatbotResponse = await getChatbot(input.trim());
      const botMessage: Message = {
        id: `${timestamp}-bot-${Math.random().toString(36).substr(2, 9)}`,
        sender: "bot",
        content: res.response || "Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể diễn đạt lại được không? 🤔",
        timestamp: new Date(),
      };
      
      const updatedMessages = [...messages, userMessage, botMessage];
      setMessages(updatedMessages);

      // Lưu lịch sử chat
      if (user?.studentId) {
        console.log("User object:", user); // Debug log
        if (!user.studentName) {
          console.error("studentName is missing in user object");
          return;
        }
        try {
          await saveChatHistory({
            studentId: user.studentId,
            studentName: user.studentName,
            messages: updatedMessages
          });
        } catch (error) {
          console.error("Error saving chat history:", error);
          // Thêm thông báo lỗi cho người dùng nếu cần
        }
      }
    } catch (err) {
      console.error("Error in sendMessage:", err);
      const errorMessage: Message = {
        id: `${timestamp}-error-${Math.random().toString(36).substr(2, 9)}`,
        sender: "bot",
        content: "Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau! 🔄",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const sendPhysicalData = async (): Promise<void> => {
    if (!user?.studentId) {
      const timestamp = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: `${timestamp}-error-${Math.random().toString(36).substring(2, 9)}`,
          sender: "bot",
          content: "Không tìm thấy mã số sinh viên để lấy dữ liệu sức khỏe.",
          timestamp: new Date(),
        },
      ]);
      return;
    }
    setLoading(true);
    try {
      const res: PhysicalDataResponse = await getDataPhysical(user.studentId);
      let physicalText = "";
      if (Array.isArray(res.data) && res.data.length > 0) {
        const latest = res.data[res.data.length - 1];
        physicalText = "Hãy đánh giá sức khỏe dựa trên thông số sau:\n*Lưu ý: CN là cân nặng, CC là chiều cao, HA là huyết áp, NT là nhịp tim\n" +
        Object.entries(latest)
          .filter(([key]) => key !== "_id" && key !== "__v" && key !== "studentId" && key !== "followDate")
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
      } else {
        physicalText = "Không có dữ liệu sức khỏe.";
      }
      
      const timestamp = Date.now();
      const userMessage: Message = {
        id: `${timestamp}-user-physical-${Math.random().toString(36).substr(2, 9)}`,
        sender: "user",
        content: physicalText,
        timestamp: new Date(),
      };
      
      const botRes: ChatbotResponse = await getChatbot(physicalText);
      const botMessage: Message = {
        id: `${timestamp}-bot-physical-${Math.random().toString(36).substring(2, 9)}`,
        sender: "bot",
        content: botRes.response || "Xin lỗi, tôi không hiểu dữ liệu sức khỏe này.",
        timestamp: new Date(),
      };

      // Cập nhật messages và lưu vào lịch sử
      const updatedMessages = [...messages, userMessage, botMessage];
      setMessages(updatedMessages);

      // Lưu lịch sử chat
      if (user?.studentId && user?.studentName) {
        try {
          await saveChatHistory({
            studentId: user.studentId,
            studentName: user.studentName,
            messages: updatedMessages
          });
        } catch (error) {
          console.error("Error saving chat history:", error);
        }
      }
    } catch (err) {
      const timestamp = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: `${timestamp}-error-physical-${Math.random().toString(36).substr(2, 9)}`,
          sender: "bot",
          content: "Không thể lấy dữ liệu sức khỏe. Vui lòng thử lại sau!",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

 useEffect(() => {
  const loadChatHistory = async () => {
    if (user?.studentId) {
      try {
        const response = await getChatHistory(user.studentId);
        if (response && Array.isArray(response.messages) && response.messages.length > 0) {
          const messagesWithId = response.messages.map((msg: { sender: string; content: string; timestamp: Date; id?: string }) => ({
            ...msg,
            id: msg.id || `${Date.now()}-${msg.sender}-${Math.random().toString(36).substring(2, 9)}`
          }));
          setMessages(messagesWithId);
          return;
        }
        // Nếu không có lịch sử, set tin nhắn chào mừng mặc định
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: "bot",
          content: "Xin chào! Tôi là trợ lý sức khỏe AI của bạn. Tôi có thể giúp gì cho bạn hôm nay? 🏥✨",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (error: unknown) {
        // Nếu lỗi là 404 hoặc "No chat history found" thì cũng set tin nhắn mặc định
        if (
          error && 
          typeof error === 'object' && 
          'response' in error && 
          error.response && 
          typeof error.response === 'object' && 
          ('status' in error.response || 'data' in error.response)
        ) {
          const response = error.response as { status?: number; data?: { message?: string } };
          if (
            response.status === 404 ||
            response.data?.message === "No chat history found"
          ) {
            const welcomeMessage: Message = {
              id: `welcome-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              sender: "bot",
              content: "Xin chào! Tôi là trợ lý sức khỏe AI của bạn. Tôi có thể giúp gì cho bạn hôm nay? 🏥✨",
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
            return;
          }
        }
        console.error("Error loading chat history:", error);
      }
    }
  };
  loadChatHistory();
}, [user?.studentId]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleInputChange = (text: string): void => {
    setInput(text);
  };

  const handleContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ): void => {
    const newHeight = Math.max(50, Math.min(120, event.nativeEvent.contentSize.height + 20));
    setInputHeight(newHeight);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={styles.messageWrapper}>
        <View
          style={[
            styles.messageContainer,
            item.sender === "user" ? styles.userMsg : styles.botMsg,
          ]}
        >
          {item.sender === "bot" && (
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>🤖</Text>
            </View>
          )}
          
          <View style={styles.messageContent}>
            {item.sender === "bot" ? (
              <Markdown 
                style={{
                  body: { 
                    color: "#2d3748", 
                    fontSize: 15,
                    lineHeight: 22,
                    fontWeight: "400"
                  },
                  strong: { color: "#1a202c", fontWeight: "600" },
                  em: { fontStyle: "italic", color: "#4a5568" }
                }}
              >
                {item.content}
              </Markdown>
            ) : (
              <Text style={[styles.messageText, styles.userText]}>
                {item.content} 
              </Text>
            )}
            
            <Text
              style={[
                styles.timestamp,
                item.sender === "user" ? styles.userTimestamp : styles.botTimestamp,
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );

  const renderTypingIndicator = () => (
    <View style={[styles.messageWrapper, { opacity: 0.8 }]}>
      <View style={[styles.messageContainer, styles.botMsg, styles.typingContainer]}>
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>🤖</Text>
        </View>
        <View style={styles.messageContent}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
          <Text style={styles.typingText}>Đang soạn tin...</Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.aiIcon}>
                  <Text style={styles.aiIconText}>🏥</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>Health AI Assistant</Text>
                  <Text style={styles.headerSubtitle}>Trợ lý sức khỏe thông minh</Text>
                </View>
              </View>
              
              <View style={styles.statusContainer}>
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Messages List with improved styling */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={loading ? renderTypingIndicator : null}
          style={styles.messagesContainer}
          extraData={messages}
        />

        {/* Modern Input Container */}
        <View style={styles.inputContainer}>
          <View style={styles.inputInnerContainer}>
            <View style={[styles.inputWrapper, { minHeight: inputHeight }]}>
              <TouchableOpacity
                style={styles.healthDataButton}
                onPress={sendPhysicalData}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.healthDataButtonText}>📊</Text>
              </TouchableOpacity>
              
              <TextInput
                style={[styles.input, { height: Math.max(40, inputHeight - 10) }]}
                placeholder="Nhập câu hỏi về sức khỏe..."
                placeholderTextColor="#9ca3af"
                value={input}
                onChangeText={handleInputChange}
                onSubmitEditing={sendMessage}
                onContentSizeChange={handleContentSizeChange}
                editable={!loading}
                multiline
                maxLength={500}
                returnKeyType="send"
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    opacity: input.trim() && !loading ? 1 : 0.5,
                    transform: [{ scale: input.trim() && !loading ? 1 : 0.9 }],
                  },
                ]}
                onPress={sendMessage}
                disabled={!input.trim() || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.sendButtonText}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Character counter */}
            <Text style={styles.characterCounter}>
              {input.length}/500
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    backgroundColor: "#667eea",
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 55 : 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  aiIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  aiIconText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "400",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  onlineText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 20,
    paddingBottom: 10,
  },
  messageWrapper: {
    marginBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    maxWidth: screenWidth * 0.85,
    alignItems: "flex-start",
  },
  userMsg: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  botMsg: {
    alignSelf: "flex-start",
  },
  botAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#c7d2fe",
  },
  botAvatarText: {
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
    fontWeight: "400",
  },
  userText: {
    color: "#1f2937",
  },
  timestamp: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
  userTimestamp: {
    color: "#6b7280",
    textAlign: "right",
  },
  botTimestamp: {
    color: "#9ca3af",
  },
  typingContainer: {
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#667eea",
    marginHorizontal: 3,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  typingText: {
    color: "#6b7280",
    fontSize: 14,
    fontStyle: "italic",
  },
  inputContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === "ios" ? 35 : 15,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  inputInnerContainer: {
    alignItems: "flex-end",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f8fafc",
    borderRadius: 25,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    width: "100%",
  },
  healthDataButton: {
    width: 40,
    height: 40,
    backgroundColor: "#f0f9ff",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  healthDataButtonText: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
    backgroundColor: "transparent",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: "#667eea",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  characterCounter: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 8,
    marginRight: 12,
  },
});

export default Chatbot;