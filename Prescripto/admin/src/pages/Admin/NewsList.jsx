import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:9000/api/admin'; // Đổi lại nếu backend khác

const NewsList = () => {
  const [news, setNews] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    file: null,
    category: '',
    date: '',
  });

  const aToken = localStorage.getItem('aToken');

  // Fetch news from API
  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/get-news`, {
        headers: { aToken }
      });
      setNews(res.data.news || []);
    } catch (err) {
      setNews([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line
  }, []);

  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (newsItem = null) => {
    if (newsItem) {
      setSelectedNews(newsItem);
      setFormData({
        title: newsItem.title,
        content: newsItem.content,
        file: null,
        category: newsItem.category || '',
        date: newsItem.date ? newsItem.date.split('T')[0] : '',
      });
    } else {
      setSelectedNews(null);
      setFormData({
        title: '',
        content: '',
        file: null,
        category: '',
        date: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedNews(null);
    setFormData({
      title: '',
      content: '',
      file: null,
      category: '',
      date: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      file: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('category', formData.category);
      data.append('date', formData.date);
      if (formData.file) data.append('file', formData.file);

      if (selectedNews) {
        data.append('id', selectedNews._id);
        await axios.post(`${BACKEND_URL}/update-news`, data, {
          headers: { aToken }
        });
      } else {
        await axios.post(`${BACKEND_URL}/add-news`, data, {
          headers: { aToken }
        });
      }
      fetchNews();
      handleCloseDialog();
    } catch (err) {
      alert('Có lỗi xảy ra!');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
      setLoading(true);
      try {
        await axios.post(`${BACKEND_URL}/delete-news`, { id }, {
          headers: { aToken }
        });
        fetchNews();
      } catch (err) {
        alert('Không thể xóa tin tức');
      }
      setLoading(false);
    }
  };

  // Helper: render file (image or PDF)
  const renderFile = (fileUrl, title) => {
    if (!fileUrl) return null;
    if (fileUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
      return (
        <img
          src={fileUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      );
    }
    // Nếu là PDF thì KHÔNG render gì cả (ẩn ô PDF)
    if (fileUrl.match(/\.pdf$/i)) {
      return null;
      // Hoặc nếu muốn hiện icon nhỏ ở góc:
      // return (
      //   <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 text-blue-600 underline text-xs flex items-center gap-1">
      //     <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      //     </svg>
      //     PDF
      //   </a>
      // );
    }
    // fallback
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ml-10">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                News Management
              </h2>
             
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 lg:w-80">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-slate-700 placeholder-slate-400"
                />
              </div>
              
              {/* View Toggle */}
              <div className="flex bg-white/70 backdrop-blur-sm rounded-2xl p-1 border border-white/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 002-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 002-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              {/* Add News Button */}
              {/* <button
                onClick={() => handleOpenDialog()}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm tin tức
              </button> */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        )}

        {/* News Display */}
        {!loading && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredNews.map((item, index) => (
                  <div 
                    key={item._id} 
                    className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* File preview */}
                    {/* <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden flex items-center justify-center">
                      {renderFile(item.file, item.title)}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div> */}
                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {item.category || 'Tin tức'}
                        </span>
                        <span className="text-slate-500 text-sm">
                          {new Date(item.date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 line-clamp-3 leading-relaxed">
                        {item.content}
                      </p>
                      {/* Actions */}
                      <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenDialog(item)}
                          className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300 group/btn hover:scale-110"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 group/btn hover:scale-110"
                          title="Xóa"
                        >
                          <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredNews.map((item, index) => (
                  <div 
                    key={item._id}
                    className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="lg:w-80 lg:flex-shrink-0">
                        <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl overflow-hidden flex items-center justify-center">
                          {renderFile(item.file, item.title)}
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {item.category || 'Tin tức'}
                          </span>
                          <span className="text-slate-500 text-sm">
                            {new Date(item.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <h3 className="font-bold text-2xl text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                          {item.content}
                        </p>
                        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => handleOpenDialog(item)}
                            className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300 group/btn hover:scale-110"
                            title="Chỉnh sửa"
                          >
                            <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 group/btn hover:scale-110"
                            title="Xóa"
                          >
                            <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && filteredNews.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 max-w-lg mx-auto shadow-lg border border-white/30">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có tin tức'}
              </h3>
              <p className="text-slate-600 mb-8">
                {searchTerm 
                  ? `Không có tin tức nào phù hợp với "${searchTerm}"`
                  : 'Bắt đầu bằng cách tạo tin tức mới cho trang web của bạn.'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => handleOpenDialog()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  + Thêm tin tức đầu tiên
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Modal Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30 animate-in zoom-in-95 duration-300 p-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 rounded-2xl mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {selectedNews ? 'Chỉnh sửa tin tức' : 'Thêm tin tức mới'}
                </h2>
                <button
                  onClick={handleCloseDialog}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-2xl transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  Tiêu đề tin tức
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-slate-800 text-lg"
                  placeholder="Nhập tiêu đề hấp dẫn cho tin tức..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  Danh mục
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-slate-800 text-lg"
                  placeholder="Nhập danh mục tin tức..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  Ngày đăng
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-slate-800 text-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  Nội dung
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={8}
                  className="w-full px-6 py-4 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-slate-800 text-lg resize-none"
                  placeholder="Viết nội dung chi tiết cho tin tức của bạn..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  File đính kèm (ảnh hoặc PDF)
                </label>
                <div className="relative">
                  <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="text-center">
                      <svg className="mx-auto h-16 w-16 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-lg font-medium text-slate-700 mb-2">
                        Chọn file ảnh hoặc PDF
                      </div>
                      <div className="text-slate-500 mb-4">
                        PNG, JPG, GIF, PDF tối đa 10MB
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-8 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-8 py-4 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:ring-offset-2 transition-all duration-300 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {selectedNews ? 'Cập nhật tin tức' : 'Tạo tin tức mới'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsList;