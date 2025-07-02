/**
 * BMI Utility Functions for Backend
 * Chuẩn hóa tính toán và phân loại BMI theo tiêu chuẩn Việt Nam/Châu Á
 */

// Tính toán BMI
export function calculateBMI(weight, height) {
  if (!weight || !height || weight <= 0 || height <= 0) return "";
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
}

// Phân loại BMI theo tiêu chuẩn Việt Nam/Châu Á (chuẩn hóa)
export function getDanhGiaBMI(bmi) {
  if (!bmi) return "";
  const bmiValue = parseFloat(bmi);
  
  if (isNaN(bmiValue)) return "";
  
  if (bmiValue < 18.5) return "G"; // Gầy (Underweight)
  if (bmiValue >= 18.5 && bmiValue < 22.9) return "BT"; // Bình thường (Normal)
  if (bmiValue >= 22.9 && bmiValue < 24.9) return "TC"; // Thể chất tốt (Good physical condition)
  if (bmiValue >= 24.9 && bmiValue < 29.9) return "BP I"; // Béo phì độ I (Overweight/Obese Class I)
  if (bmiValue >= 29.9 && bmiValue < 35.0) return "BP II"; // Béo phì độ II (Obese Class II)
  return "BP III"; // Béo phì độ III (Obese Class III)
}

// Validation cho BMI
export function isValidBMI(bmi) {
  if (!bmi) return false;
  const bmiValue = parseFloat(bmi);
  return !isNaN(bmiValue) && bmiValue > 0 && bmiValue < 100;
}

// Kiểm tra BMI có nằm trong ngưỡng khỏe mạnh không
export function isHealthyBMI(bmi) {
  if (!bmi) return false;
  const bmiValue = parseFloat(bmi);
  
  if (isNaN(bmiValue)) return false;
  
  // Coi BT và TC đều là khỏe mạnh (18.5 - 24.9)
  return bmiValue >= 18.5 && bmiValue < 24.9;
}

// Nhóm phân loại BMI cho analytics (4 nhóm chính)
export function getBMICategory(bmi) {
  if (!bmi) return "";
  const bmiValue = parseFloat(bmi);
  
  if (isNaN(bmiValue)) return "";
  
  if (bmiValue < 18.5) return "Underweight";
  if (bmiValue >= 18.5 && bmiValue < 24.9) return "Normal"; // Kết hợp BT + TC
  if (bmiValue >= 24.9 && bmiValue < 30.0) return "Overweight"; // BP I
  return "Obese"; // BP II + BP III
} 