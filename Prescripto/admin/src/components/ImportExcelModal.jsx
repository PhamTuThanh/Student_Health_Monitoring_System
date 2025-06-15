import React, { useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ImportExcelModal = ({ open, onClose, templateUrl, type = 'students' }) => {
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFileName(e.target.files[0]?.name || '');
  };

  const handleDownloadTemplate = () => {
    window.open(templateUrl, '_blank');
  };

  const handleUpload = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      toast.error('Vui lòng chọn file!');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      let endpoint, headers = { 'Content-Type': 'multipart/form-data' };
      
      if (type === 'students') {
        const aToken = localStorage.getItem('aToken');
        headers.aToken = aToken;
        endpoint = 'http://localhost:9000/api/admin/import-students-excel';
      } else  {
        const dToken = localStorage.getItem('dToken');
        headers.dToken = dToken;
        endpoint = 'http://localhost:9000/api/doctor/import-drug-excel';
      }

      const res = await axios.post(endpoint, formData, { headers });
      toast.success(res.data.message);
      onClose();
    } catch (err) {
      toast.error('Lỗi import: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const getInstructions = () => {
    if (type === 'students') {
      return {
        title: 'Hướng dẫn nhập dữ liệu học sinh',
        fields: [
          'Mã học sinh (studentId)',
          'Họ và tên (fullName)',
          'Ngày sinh (dob) - định dạng: YYYY-MM-DD',
          'Giới tính (gender) - Nam/Nữ',
          'Lớp (class)',
          'Địa chỉ (address)',
          'Số điện thoại (phone)',
          'Email (email)'
        ]
      };
    } else if (type === 'drugs') {
      return {
        title: 'Hướng dẫn nhập dữ liệu thuốc',
        fields: [
          'Tên thuốc (drugName)',
          'Mã thuốc (drugCode)',
          'Loại thuốc (drugType)',
          'Đơn vị (drugUnit)',
          'Số lượng (inventoryQuantity)',
          'Hạn sử dụng (expiryDate)',
          'Nhà cung cấp (supplierName)',
          'Ghi chú (notes)'
        ]
      };
    }
  };

  const instructions = getInstructions();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
        <button className="absolute top-2 right-3 text-xl" onClick={onClose}>×</button>
        <div className="mb-4 flex gap-2">
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleDownloadTemplate}>
            Tải file mẫu
          </button>
          <label className="bg-gray-200 px-4 py-2 rounded cursor-pointer">
            Chọn file
            <input
              type="file"
              accept=".xls,.xlsx,.xlsm,.xlsb,.xltx,.xltm"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <span className="ml-2">{fileName}</span>
        </div>
        <div className="mb-4 text-gray-700">
          <b>{instructions.title}</b>
          <ol className="list-decimal ml-5 mt-2 text-sm">
            <li>Tải file mẫu (template) về máy của bạn.</li>
            <li>Mở file mẫu và điền thông tin theo đúng các cột:</li>
            <ul className="list-disc ml-8 mt-1">
              {instructions.fields.map((field, idx) => (
                <li key={idx}>{field}</li>
              ))}
            </ul>
            <li>Chọn file và nhấn <b>Lưu</b> để tải lên hệ thống.</li>
          </ol>
          <div className="mt-2 text-xs text-gray-500">
            <b>Lưu ý:</b> Hỗ trợ các định dạng: .xls, .xlsx, .xlsm, .xlsb, .xltx, .xltm.<br />
            Số bản ghi tối đa cho mỗi lần nhập: 3000.<br />
            Kiểm tra kỹ dữ liệu trước khi lưu để giảm thiểu lỗi.
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExcelModal;