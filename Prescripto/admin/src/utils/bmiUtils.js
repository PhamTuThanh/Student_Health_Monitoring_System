/**
 * BMI Utility Functions
 * Chuẩn hóa tính toán và phân loại BMI theo tiêu chuẩn Việt Nam/Châu Á
 */

// Tính toán BMI
export const calculateBMI = (weight, height) => {
  if (!weight || !height || weight <= 0 || height <= 0) return "";
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
};

// Phân loại BMI theo tiêu chuẩn Việt Nam/Châu Á (sử dụng thống nhất)
export const getBMIClassification = (bmi) => {
  if (!bmi) return "";
  const bmiValue = parseFloat(bmi);
  
  if (isNaN(bmiValue)) return "";
  
  if (bmiValue < 18.5) return "G"; // Gầy (Underweight)
  if (bmiValue >= 18.5 && bmiValue < 22.9) return "BT"; // Bình thường (Normal)
  if (bmiValue >= 22.9 && bmiValue < 24.9) return "TC"; // Thể chất tốt (Good physical condition)
  if (bmiValue >= 24.9 && bmiValue < 29.9) return "BP I"; // Béo phì độ I (Overweight/Obese Class I)
  if (bmiValue >= 29.9 && bmiValue < 35.0) return "BP II"; // Béo phì độ II (Obese Class II)
  return "BP III"; // Béo phì độ III (Obese Class III)
};

// Chuyển đổi mã phân loại thành tiếng Việt
export const getBMIClassificationVN = (classification) => {
  const classifications = {
    "G": "Gầy",
    "BT": "Bình thường", 
    "TC": "Thể chất tốt",
    "BP I": "Béo phì độ I",
    "BP II": "Béo phì độ II", 
    "BP III": "Béo phì độ III"
  };
  return classifications[classification] || "";
};

// Chuyển đổi mã phân loại thành tiếng Anh (cho analytics)
export const getBMIClassificationEN = (classification) => {
  const classifications = {
    "G": "Underweight",
    "BT": "Normal",
    "TC": "Good", 
    "BP I": "Overweight",
    "BP II": "Obese",
    "BP III": "Severely Obese"
  };
  return classifications[classification] || "";
};

// Nhóm phân loại BMI cho analytics (4 nhóm chính)
export const getBMICategory = (bmi) => {
  if (!bmi) return "";
  const bmiValue = parseFloat(bmi);
  
  if (isNaN(bmiValue)) return "";
  
  if (bmiValue < 18.5) return "Underweight";
  if (bmiValue >= 18.5 && bmiValue < 24.9) return "Normal"; // Kết hợp BT + TC
  if (bmiValue >= 24.9 && bmiValue < 30.0) return "Overweight"; // BP I
  return "Obese"; // BP II + BP III
};

// Kiểm tra BMI có nằm trong ngưỡng khỏe mạnh không
export const isHealthyBMI = (bmi) => {
  if (!bmi) return false;
  const bmiValue = parseFloat(bmi);
  
  if (isNaN(bmiValue)) return false;
  
  // Coi BT và TC đều là khỏe mạnh (18.5 - 24.9)
  return bmiValue >= 18.5 && bmiValue < 24.9;
};

// Lấy màu sắc cho hiển thị BMI
export const getBMIColor = (bmi) => {
  const classification = getBMIClassification(bmi);
  
  const colors = {
    "G": "#3B82F6", // Blue - Underweight
    "BT": "#10B981", // Green - Normal
    "TC": "#059669", // Dark Green - Good
    "BP I": "#F59E0B", // Yellow - Overweight
    "BP II": "#EF4444", // Red - Obese
    "BP III": "#DC2626" // Dark Red - Severely Obese
  };
  
  return colors[classification] || "#6B7280";
};

// Lấy trạng thái rủi ro sức khỏe
export const getBMIRiskLevel = (bmi) => {
  const classification = getBMIClassification(bmi);
  
  const riskLevels = {
    "G": "Medium", // Underweight có rủi ro
    "BT": "Low", // Normal - rủi ro thấp
    "TC": "Low", // Good - rủi ro thấp  
    "BP I": "Medium", // Overweight - rủi ro trung bình
    "BP II": "High", // Obese - rủi ro cao
    "BP III": "Very High" // Severely Obese - rủi ro rất cao
  };
  
  return riskLevels[classification] || "Unknown";
};

// Validation cho BMI
export const isValidBMI = (bmi) => {
  if (!bmi) return false;
  const bmiValue = parseFloat(bmi);
  return !isNaN(bmiValue) && bmiValue > 0 && bmiValue < 100;
};

// Tính BMI trung bình từ một mảng các giá trị BMI
export const calculateAverageBMI = (bmiArray) => {
  if (!Array.isArray(bmiArray) || bmiArray.length === 0) return 0;
  
  const validBMIs = bmiArray
    .map(bmi => parseFloat(bmi))
    .filter(bmi => !isNaN(bmi) && bmi > 0 && bmi < 100);
    
  if (validBMIs.length === 0) return 0;
  
  const sum = validBMIs.reduce((acc, bmi) => acc + bmi, 0);
  return Math.round((sum / validBMIs.length) * 10) / 10;
}; 