from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import requests
from datetime import datetime
from google import genai
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Get API key from environment variable
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
SITE_URL = os.getenv('SITE_URL', 'http://localhost:3000')
SITE_NAME = os.getenv('SITE_NAME', 'Health Chatbot')
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/prescripto')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:9000')

# Initialize Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

# Initialize MongoDB client
mongo_client = MongoClient(MONGODB_URI)
db = mongo_client.prescripto
chat_collection = db.chatbots
users_collection = db.users
physical_fitness_collection = db.physicalfitnesses

# Health assessment rules and responses
HEALTH_RULES = {
    'weight': {
        'pattern': r'cân nặng (\d+)',
        'assessment': lambda x: 'Bình thường' if 45 <= float(x) <= 80 else 'Cần điều chỉnh'
    },
    'height': {
        'pattern': r'chiều cao (\d+)',
        'assessment': lambda x: 'Bình thường' if 150 <= float(x) <= 190 else 'Cần kiểm tra'
    },
    'sleep': {
        'pattern': r'ngủ (\d+)',
        'assessment': lambda x: 'Đủ giấc' if 6 <= float(x) <= 9 else 'Thiếu ngủ'
    },
    'stress': {
        'pattern': r'stress|căng thẳng|lo lắng',
        'response': 'Bạn nên thử các phương pháp giảm stress như: thiền, tập thể dục, nghe nhạc thư giãn.'
    }
}

def get_conversation_history(student_id):
    """Lấy lịch sử hội thoại từ MongoDB"""
    try:
        chat_record = chat_collection.find_one({"studentId": student_id})
        if chat_record and "messages" in chat_record:
            return chat_record["messages"][-10:]  # Lấy 10 tin nhắn gần nhất
        return []
    except Exception as e:
        print(f"Error getting conversation history: {str(e)}")
        return []

def get_student_health_data(student_id):
    """Lấy dữ liệu sức khỏe của sinh viên"""
    try:
        # Lấy thông tin sinh viên
        student = users_collection.find_one({"studentId": student_id})
        if not student:
            return None
            
        # Lấy dữ liệu physical fitness gần nhất
        physical_data = list(physical_fitness_collection.find(
            {"studentId": student_id}
        ).sort("_id", -1).limit(3))  # 3 bản ghi gần nhất
        
        return {
            "student_info": {
                "name": student.get("name", ""),
                "age": student.get("age", ""),
                "gender": student.get("gender", ""),
                "major": student.get("major", ""),
                "cohort": student.get("cohort", "")
            },
            "physical_data": physical_data
        }
    except Exception as e:
        print(f"Error getting health data: {str(e)}")
        return None

def save_message_to_db(student_id, student_name, user_message, bot_response):
    """Lưu tin nhắn vào MongoDB"""
    try:
        # Tìm hoặc tạo chat record
        chat_record = chat_collection.find_one({"studentId": student_id})
        
        current_time = datetime.now()
        
        user_msg = {
            "sender": "user",
            "content": user_message,
            "timestamp": current_time
        }
        
        bot_msg = {
            "sender": "bot", 
            "content": bot_response,
            "timestamp": current_time
        }
        
        if chat_record:
            # Cập nhật chat hiện có
            chat_collection.update_one(
                {"studentId": student_id},
                {
                    "$push": {
                        "messages": {"$each": [user_msg, bot_msg]}
                    },
                    "$set": {
                        "lastMessageTime": current_time,
                        "lastMessageSender": "bot",
                        "lastMessageContent": bot_response
                    }
                }
            )
        else:
            # Tạo chat record mới
            new_chat = {
                "studentId": student_id,
                "studentName": student_name or "Unknown",
                "messages": [user_msg, bot_msg],
                "lastMessageTime": current_time,
                "lastMessageSender": "bot",
                "lastMessageContent": bot_response
            }
            chat_collection.insert_one(new_chat)
            
    except Exception as e:
        print(f"Error saving message to DB: {str(e)}")

def build_context_prompt(conversation_history, health_data, current_message):
    """Xây dựng prompt với context đầy đủ"""
    
    prompt = """Bạn là một AI trợ lý sức khỏe thông minh tại trường đại học. Nhiệm vụ của bạn là:
1. Phân tích và theo dõi sức khỏe sinh viên theo thời gian
2. Đưa ra lời khuyên cá nhân hóa dựa trên lịch sử hội thoại và dữ liệu sức khỏe
3. Ghi nhớ các cuộc trò chuyện trước đó để có thể theo dõi tiến triển
4. Đưa ra cảnh báo nếu phát hiện xu hướng xấu về sức khỏe

"""
    
    # Thêm thông tin sinh viên
    if health_data and health_data.get("student_info"):
        student_info = health_data["student_info"]
        prompt += f"""
THÔNG TIN SINH VIÊN:
- Tên: {student_info.get('name', 'N/A')}
- Giới tính: {student_info.get('gender', 'N/A')}
- Ngành học: {student_info.get('major', 'N/A')}
- Lớp: {student_info.get('cohort', 'N/A')}

"""
    
    # Thêm dữ liệu sức khỏe gần đây
    if health_data and health_data.get("physical_data"):
        prompt += "DỮ LIỆU SỨC KHỎE GẦN ĐÂY:\n"
        for i, data in enumerate(health_data["physical_data"]):
            prompt += f"""
Lần đo {i+1}:
- Chiều cao: {data.get('height', 'N/A')} cm
- Cân nặng: {data.get('weight', 'N/A')} kg  
- BMI: {data.get('bmi', 'N/A')} ({data.get('danhGiaBMI', 'N/A')})
- Huyết áp: {data.get('systolic', 'N/A')}/{data.get('diastolic', 'N/A')} mmHg
- Nhịp tim: {data.get('heartRate', 'N/A')} bpm
- Ngày đo: {data.get('followDate', 'N/A')}
"""

    # Thêm lịch sử hội thoại
    if conversation_history:
        prompt += "\nLỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:\n"
        for msg in conversation_history[-5:]:  # 5 tin nhắn gần nhất
            sender = "Sinh viên" if msg["sender"] == "user" else "AI"
            prompt += f"{sender}: {msg['content']}\n"
    
    prompt += f"""

TIN NHẮN HIỆN TẠI CỦA SINH VIÊN: {current_message}

Hãy trả lời một cách thân thiện, chuyên nghiệp và có tính cá nhân hóa. Nếu có thể, hãy:
- So sánh với dữ liệu trước đó để đưa ra nhận xét về xu hướng
- Đưa ra lời khuyên cụ thể dựa trên profile của sinh viên
- Ghi nhớ các vấn đề đã thảo luận trước đó
- Khuyến khích sinh viên duy trì thói quen tốt hoặc cải thiện nếu cần
"""
    
    return prompt

def get_gemini_response_with_context(message, student_id, student_name=""):
    """Lấy response từ Gemini với context đầy đủ"""
    try:
        # Lấy conversation history
        conversation_history = get_conversation_history(student_id)
        
        # Lấy health data
        health_data = get_student_health_data(student_id)
        
        # Xây dựng prompt với context
        context_prompt = build_context_prompt(conversation_history, health_data, message)
        
        # Gọi Gemini API
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=context_prompt
        )
        
        bot_response = response.text
        
        # Lưu tin nhắn vào database
        save_message_to_db(student_id, student_name, message, bot_response)
        
        return bot_response
            
    except Exception as e:
        print(f"Error calling Gemini API with context: {str(e)}")
        return "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau."

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    student_id = data.get('studentId', '')
    student_name = data.get('studentName', '')
    
    if not message:
        return jsonify({'response': 'Vui lòng nhập tin nhắn của bạn.'})
    
    if not student_id:
        return jsonify({'response': 'Thiếu thông tin sinh viên. Vui lòng đăng nhập lại.'})
    
    # Sử dụng Gemini với context
    response = get_gemini_response_with_context(message, student_id, student_name)
    
    return jsonify({'response': response})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'mongodb': 'connected' if mongo_client.admin.command('ping') else 'disconnected'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000) 