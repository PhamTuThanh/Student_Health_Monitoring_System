# Smart Health Assistant 🤖🏥

Hệ thống AI thông minh cho tư vấn sức khỏe với GPT + Vector Database

## 🌟 Tính năng chính

### 1. AI Chatbot thông minh
- **Xử lý ngôn ngữ tự nhiên**: Hiểu và phân tích câu hỏi sức khỏe
- **Vector Database**: Tìm kiếm thông tin y tế chính xác từ knowledge base
- **Cá nhân hóa**: Lưu trữ và phân tích dữ liệu sức khỏe cá nhân
- **Phát hiện cấp cứu**: Tự động nhận biết triệu chứng nguy hiểm

### 2. Knowledge Base thông minh
- **Dữ liệu y tế chuyên nghiệp**: BMI, huyết áp, nhịp tim, dinh dưỡng
- **Tìm kiếm semantic**: Sử dụng embedding vectors để tìm thông tin liên quan
- **Cập nhật realtime**: Có thể thêm kiến thức mới vào hệ thống

### 3. Phân tích sức khỏe
- **Trích xuất tự động**: Nhận diện các chỉ số từ văn bản
- **Đánh giá thông minh**: So sánh với tiêu chuẩn y tế
- **Khuyến nghị cá nhân**: Đưa ra lời khuyên phù hợp

## 🚀 Cài đặt và Chạy

### 1. Yêu cầu hệ thống
```bash
Python >= 3.8
pip (Python package manager)
```

### 2. Cài đặt tự động
```bash
# Clone repository
cd backend/chatbot

# Chạy script setup tự động
python setup.py
```

### 3. Cài đặt thủ công

#### Bước 1: Cài đặt dependencies
```bash
pip install -r requirements.txt
```

#### Bước 2: Cấu hình API Key
Tạo file `.env`:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
ADMIN_KEY=admin123
SITE_URL=http://localhost:3000
SITE_NAME=Smart Health Assistant
```

#### Bước 3: Khởi động server
```bash
python app.py
```

Server sẽ chạy tại: `http://localhost:5000`

## 📡 API Endpoints

### 1. Chat với AI
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Tôi có cân nặng 65kg, chiều cao 170cm",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "response": "Phân tích sức khỏe của bạn...",
  "confidence": "Cao",
  "has_emergency": false,
  "health_metrics": {
    "weight": 65,
    "height": 170,
    "bmi": 22.5
  },
  "recommendations": ["Duy trì chế độ ăn cân bằng"],
  "status": "success"
}
```

### 2. Phân tích sức khỏe chi tiết
```http
POST /api/health-analysis
Content-Type: application/json

{
  "user_id": "user123",
  "health_data": {
    "height": 170,
    "weight": 65,
    "blood_pressure": "120/80",
    "heart_rate": 72
  }
}
```

### 3. Kiểm tra cấp cứu
```http
POST /api/emergency-check
Content-Type: application/json

{
  "symptoms": "đau ngực dữ dội, khó thở"
}
```

### 4. Lấy tips sức khỏe
```http
GET /api/health-tips?category=nutrition
```

### 5. Kiểm tra trạng thái hệ thống
```http
GET /api/system-status
```

## 🧠 Kiến trúc hệ thống

```
Smart Health Assistant/
├── app.py                 # Flask API server
├── ai_assistant.py        # AI logic chính
├── vector_store.py        # Vector database
├── data/
│   └── health_knowledge.json  # Knowledge base
├── chroma_db/            # ChromaDB vector storage
└── requirements.txt      # Dependencies
```

### Luồng xử lý:
1. **Input**: Người dùng gửi tin nhắn
2. **Emergency Check**: Kiểm tra triệu chứng cấp cứu
3. **Extract Metrics**: Trích xuất chỉ số sức khỏe
4. **Vector Search**: Tìm kiếm thông tin liên quan
5. **AI Processing**: GPT phân tích và tạo phản hồi
6. **Personalization**: Lưu trữ dữ liệu cá nhân
7. **Response**: Trả về kết quả chi tiết

## 📊 Vector Database

### ChromaDB Features:
- **Persistent Storage**: Dữ liệu được lưu trữ cố định
- **Semantic Search**: Tìm kiếm dựa trên nghĩa, không chỉ từ khóa
- **Cosine Similarity**: Đo độ tương tự giữa các documents
- **Metadata Filtering**: Lọc theo danh mục, loại dữ liệu

### Knowledge Base Structure:
```json
{
  "id": "unique_id",
  "category": "nutrition|cardiovascular|lifestyle",
  "title": "Tiêu đề",
  "content": "Nội dung chi tiết",
  "tags": ["tag1", "tag2"],
  "symptoms": ["triệu chứng"],
  "recommendations": ["khuyến nghị"]
}
```

## 🤖 AI Models

### Hiện tại:
- **Model**: Google Gemma 2 9B (miễn phí qua OpenRouter)
- **Temperature**: 0.7 (cân bằng creativity và accuracy)
- **Max Tokens**: 1000

### Tùy chỉnh:
Có thể thay đổi model trong `ai_assistant.py`:
```python
"model": "anthropic/claude-3-sonnet:beta"  # Model khác
```

## 🔧 Tùy chỉnh và Mở rộng

### 1. Thêm Knowledge mới
Chỉnh sửa `data/health_knowledge.json`:
```json
{
  "medical_knowledge": [
    {
      "id": "new_topic",
      "category": "new_category",
      "title": "Chủ đề mới",
      "content": "Nội dung...",
      "tags": ["tag"],
      "symptoms": ["triệu chứng"],
      "recommendations": ["khuyến nghị"]
    }
  ]
}
```

### 2. Thêm Health Metrics mới
Trong `ai_assistant.py`, thêm pattern:
```python
patterns = {
    'new_metric': r'new_pattern (\d+)',
    # ... existing patterns
}
```

### 3. Tùy chỉnh AI Prompt
Chỉnh sửa `system_prompt` trong `ai_assistant.py`

## 🛡️ Bảo mật

### API Security:
- **API Key validation**: Kiểm tra OpenRouter API key
- **Admin authentication**: Bảo vệ admin endpoints
- **Input validation**: Validate tất cả input
- **Rate limiting**: Cần implement cho production

### Data Privacy:
- **User data encryption**: Khuyến nghị mã hóa dữ liệu nhạy cảm
- **GDPR compliance**: Cần tuân thủ quy định bảo vệ dữ liệu
- **Data retention**: Chính sách lưu trữ dữ liệu người dùng

## 📈 Performance

### Optimization:
- **Vector caching**: Cache kết quả tìm kiếm
- **Model caching**: Cache AI responses cho queries phổ biến
- **Async processing**: Xử lý bất đồng bộ cho requests lớn

### Monitoring:
- **Logging**: Chi tiết logs cho debugging
- **Metrics**: Theo dõi response time, accuracy
- **Health checks**: `/api/system-status` endpoint

## 🔮 Phát triển tương lai

### Planned Features:
- [ ] **Multi-language support**: Hỗ trợ nhiều ngôn ngữ
- [ ] **Voice interface**: Giao diện giọng nói
- [ ] **Image analysis**: Phân tích hình ảnh y tế
- [ ] **Integration**: Kết nối với EMR systems
- [ ] **Mobile app**: Ứng dụng di động
- [ ] **Real-time monitoring**: Theo dõi sức khỏe realtime

### Advanced AI:
- [ ] **Fine-tuning**: Train model trên dữ liệu y tế Việt Nam
- [ ] **Multi-modal**: Xử lý text + image + audio
- [ ] **Federated learning**: Học từ nhiều nguồn dữ liệu

## 🆘 Troubleshooting

### Common Issues:

1. **ImportError với ChromaDB**:
   ```bash
   pip install --upgrade chromadb
   ```

2. **API Key Error**:
   - Kiểm tra file `.env`
   - Verify OpenRouter API key

3. **Vector Store Error**:
   ```bash
   rm -rf chroma_db/
   python setup.py  # Rebuild vector store
   ```

4. **Memory Issues**:
   - Giảm `max_tokens` trong config
   - Sử dụng model nhỏ hơn

## 📞 Support

- **Issues**: Tạo issue trên GitHub
- **Documentation**: README.md này
- **API Docs**: Swagger UI (coming soon)

---

**Developed with ❤️ for healthcare innovation** 