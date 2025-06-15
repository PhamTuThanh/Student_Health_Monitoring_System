from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
from datetime import datetime
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Get API key from environment variable
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
SITE_URL = os.getenv('SITE_URL', 'http://localhost:3000')
SITE_NAME = os.getenv('SITE_NAME', 'Health Chatbot')

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

def analyze_health_info(message):
    assessments = []
    recommendations = []
    
    # Check for health metrics
    for metric, rule in HEALTH_RULES.items():
        if 'pattern' in rule:
            match = re.search(rule['pattern'], message.lower())
            if match:
                value = match.group(1)
                assessment = rule['assessment'](value)
                assessments.append(f"{metric.capitalize()}: {assessment}")
                
                # Add recommendations based on assessment
                if assessment != 'Bình thường':
                    if metric == 'weight':
                        recommendations.append("Khuyến nghị: Duy trì chế độ ăn cân bằng và tập thể dục đều đặn.")
                    elif metric == 'height':
                        recommendations.append("Khuyến nghị: Tham khảo ý kiến bác sĩ về phát triển chiều cao.")
                    elif metric == 'sleep':
                        recommendations.append("Khuyến nghị: Cố gắng ngủ đủ 7-8 tiếng mỗi đêm và duy trì lịch ngủ đều đặn.")
        elif 'response' in rule and re.search(rule['pattern'], message.lower()):
            recommendations.append(rule['response'])

    # If no specific metrics found, provide general advice
    if not assessments:
        return "Tôi không thấy thông tin cụ thể về sức khỏe. Bạn có thể chia sẻ thêm về: cân nặng, chiều cao, thời gian ngủ, hoặc các vấn đề stress không?"

    # Construct response
    response = "Đánh giá sức khỏe của bạn:\n"
    response += "\n".join(assessments)
    
    if recommendations:
        response += "\n\nKhuyến nghị:\n"
        response += "\n".join(recommendations)
    
    return response

def get_gemini_response(message):
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
            },
            data=json.dumps({
                "model": "google/gemma-3n-e4b-it:free",
                "messages": [
                    {
                        "role": "user",
                        "content": message
                    }
                ]
            })
        )
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            print(f"Error calling Gemini API: {response.text}")
            return "Xin lỗi, tôi đang gặp vấn đề kỹ thuật. Vui lòng thử lại sau."
            
    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        return "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn."

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    
    if not message:
        return jsonify({'response': 'Vui lòng nhập thông tin sức khỏe của bạn.'})
    
    response = get_gemini_response(message)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True, port=5000) 