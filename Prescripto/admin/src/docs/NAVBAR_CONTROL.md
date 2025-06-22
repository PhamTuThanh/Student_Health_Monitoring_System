# Navbar Control Documentation

## Tổng quan
Tính năng này cho phép ẩn/hiện navbar khi mở các popup/modal để tạo trải nghiệm người dùng tốt hơn.

## Cách sử dụng

### 1. Sử dụng AppContext trực tiếp
```jsx
import { useAppContext } from '../context/AppContext';

const MyComponent = () => {
  const { hideNavbar, showNavbar } = useAppContext();

  const handleOpenModal = () => {
    hideNavbar();
    // Mở modal
  };

  const handleCloseModal = () => {
    showNavbar();
    // Đóng modal
  };

  return (
    // Component content
  );
};
```

### 2. Sử dụng hook useNavbarControl
```jsx
import { useNavbarControl } from '../hooks/useNavbarControl';

const MyComponent = () => {
  const { hideNavbar, showNavbar } = useNavbarControl(false); // false = ẩn navbar

  // Hook sẽ tự động ẩn navbar khi component mount và hiện lại khi unmount
  return (
    // Component content
  );
};
```

### 3. Sử dụng ModalWrapper component
```jsx
import ModalWrapper from '../components/ModalWrapper';

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Open Modal</button>
      
      <ModalWrapper isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white rounded-xl p-6">
          <h2>Modal Content</h2>
          <button onClick={() => setIsModalOpen(false)}>Close</button>
        </div>
      </ModalWrapper>
    </>
  );
};
```

## Z-index Hierarchy
- Navbar: `z-50`
- Popup/Modal: `z-[60]` (cao hơn navbar)
- Sidebar: `z-30` (thấp hơn navbar)

## Lưu ý
1. Luôn đảm bảo hiện lại navbar khi đóng modal
2. Sử dụng cleanup function trong useEffect để hiện navbar khi component unmount
3. Z-index của modal phải cao hơn navbar (z-50)
4. Transition animation được áp dụng cho navbar để tạo hiệu ứng mượt mà

## Ví dụ thực tế
Xem các file:
- `components/AddPrescription.jsx`
- `pages/Doctor/AbnormalityDetail.jsx`
- `pages/Doctor/DrugStock.jsx`
- `components/DrugDetail.jsx`
- `components/ImportExcelModal.jsx`
- `components/Navbar.jsx`

## Các modal đã được cập nhật
1. **AddPrescription** - Modal thêm đơn thuốc
2. **AbnormalityDetail** - Modal thêm bản ghi bất thường và đơn thuốc
3. **DrugStock** - Modal thêm thuốc và import Excel
4. **DrugDetail** - Modal xem và chỉnh sửa chi tiết thuốc
5. **ImportExcelModal** - Modal import dữ liệu từ Excel 