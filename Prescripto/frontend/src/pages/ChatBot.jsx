import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { assets } from '../assets/assets';
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
  </svg>
);

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const backendUrl = 'http://localhost:9000';
  const studentId = localStorage.getItem('studentId');
  console.log(studentId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  };
const getDataPhysical = async () => {
  const response = await axios.get(`${backendUrl}/api/user/data-physical/${studentId}`);
  console.log(response.data);
}

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: input
      });

      // Add bot response
      const botMessage = {
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message
      const errorMessage = {
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleGetDataPhysical = async () => {
    const response = await getDataPhysical();
    console.log(response.data);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f5f3]">
      <div className="w-full max-w-xl flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-800">What can I help with?</h1>
        <div className="w-full flex flex-col items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full bg-white rounded-2xl shadow-xl border border-gray-200 flex items-center px-6 py-4 gap-3 mb-6"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything"
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none text-lg text-gray-800 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-500 hover:text-white transition disabled:bg-gray-100 disabled:text-gray-400"
            >
              <SendIcon />
            </button>
            <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-500 hover:text-white transition disabled:bg-gray-100 disabled:text-gray-400" onClick={getDataPhysical}>
                <img src={assets.PushData} alt="PushData" className='w-6 h-6'/>
              {/* <PushDataHeath /> */}
            </button>
          </form>
          {/* Gợi ý nút nếu muốn */}
          {/* <div className="flex gap-2 mb-6">
            <button className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 border">Deep Search</button>
            <button className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 border">Reason</button>
          </div> */}
        </div>
        {/* Hiển thị lịch sử chat nếu có tin nhắn */}
        {messages.length > 0 && (
          <div className="w-full mt-4 flex flex-col gap-4 max-h-[50vh] overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-5 py-3 rounded-2xl shadow text-base whitespace-pre-line leading-relaxed font-medium max-w-[80%] ${
                    message.sender === 'user'
                      ? 'bg-green-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md border border-gray-200'
                  }`}
                >
                  <p>{message.text}</p>
                  <span className="block text-xs opacity-60 mt-1 text-right">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-5 py-3 rounded-2xl shadow text-base bg-gray-100 text-gray-900 rounded-bl-md border border-gray-200 max-w-[80%]">
                  <p>Đang xử lý...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        {/* Thông báo dưới cùng nếu muốn */}
        {/* <div className="mt-8 text-center text-xs text-gray-500">AI can make mistakes. Please double-check responses.</div> */}
      </div>
    </div>
  );
};

export default ChatBot; 

