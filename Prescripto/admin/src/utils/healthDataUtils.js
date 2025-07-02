/**
 * Health Data Processing Utilities  
 * Chuẩn hóa xử lý dữ liệu sức khỏe sử dụng BMI utils thống nhất
 */

import { getBMICategory, isHealthyBMI, isValidBMI, calculateBMI } from './bmiUtils';

// Process analytics data with standardized BMI classification
export const processAnalyticsData = (physicalData, abnormalityData, examSessions = []) => {
  // BMI Distribution - sử dụng getBMICategory từ bmiUtils
  const bmiRanges = { 'Underweight': 0, 'Normal': 0, 'Overweight': 0, 'Obese': 0 };
  
  // Only process if we have physical data
  if (physicalData && physicalData.length > 0) {
    physicalData.forEach(item => {
      const bmi = parseFloat(item.bmi);
      
      // Only count valid BMI values using standardized validation
      if (isValidBMI(bmi)) {
        const category = getBMICategory(bmi);
        if (bmiRanges[category] !== undefined) {
          bmiRanges[category]++;
        }
      }
    });
  }

  // Health trends (based on available data in selected year)
  const healthTrends = [];
  
  if (physicalData && physicalData.length > 0) {
    // Get all unique months from the physical data
    const monthsInData = {};
    physicalData.forEach(item => {
      if (item.followDate) {
        const itemDate = new Date(item.followDate);
        const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
        const monthLabel = itemDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthsInData[monthKey]) {
          monthsInData[monthKey] = {
            date: itemDate,
            label: monthLabel,
            data: []
          };
        }
        
        // Only add valid BMI data using standardized validation
        if (isValidBMI(item.bmi)) {
          monthsInData[monthKey].data.push(item);
        }
      }
    });
    
    // Sort months and take last 6 months available in data
    const sortedMonths = Object.values(monthsInData)
      .sort((a, b) => a.date - b.date)
      .slice(-6); // Take last 6 months of available data
    
    sortedMonths.forEach(monthInfo => {
      const validMonthData = monthInfo.data;
      const healthyCount = validMonthData.filter(item => {
        return isHealthyBMI(item.bmi); // Sử dụng isHealthyBMI từ bmiUtils
      }).length;
      
      healthTrends.push({
        month: monthInfo.label,
        healthy: healthyCount,
        total: validMonthData.length,
        healthyRate: validMonthData.length > 0 ? Math.round((healthyCount / validMonthData.length) * 100) : 0
      });
    });
  }

  // Abnormality breakdown
  const symptomCounts = {};
  if (abnormalityData && abnormalityData.length > 0) {
    abnormalityData.forEach(item => {
      // Only process if symptoms array exists and is not empty
      if (item.symptoms && Array.isArray(item.symptoms) && item.symptoms.length > 0) {
        item.symptoms.forEach(symptom => {
          if (symptom && symptom.trim()) { // Only count non-empty symptoms
            symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
          }
        });
      }
    });
  }
  
  const abnormalityBreakdown = Object.entries(symptomCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([symptom, count]) => ({ symptom, count }));

  // Cohort comparison
  const cohortData = {};
  if (physicalData && physicalData.length > 0) {
    physicalData.forEach(item => {
      // Only process records with valid BMI and cohort data
      if (item.cohort && isValidBMI(item.bmi)) {
        if (!cohortData[item.cohort]) {
          cohortData[item.cohort] = { total: 0, healthy: 0 };
        }
        cohortData[item.cohort].total++;
        
        if (isHealthyBMI(item.bmi)) { // Sử dụng isHealthyBMI từ bmiUtils
          cohortData[item.cohort].healthy++;
        }
      }
    });
  }
  
  const cohortComparison = Object.entries(cohortData).map(([cohort, data]) => ({
    cohort,
    healthyRate: data.total > 0 ? Math.round((data.healthy / data.total) * 100) : 0,
    totalStudents: data.total
  }));

  return {
    bmiDistribution: Object.entries(bmiRanges).map(([category, count]) => ({ category, count })),
    healthTrends,
    abnormalityBreakdown,
    cohortComparison
  };
};

// Calculate health status with standardized BMI logic
export const calculateHealthStatus = (latestFitness, abnormalityCount = 0) => {
  let healthStatus = 'Normal';
  
  if (latestFitness) {
    const bmi = parseFloat(latestFitness.bmi);
    const systolic = parseFloat(latestFitness.systolic);
    const diastolic = parseFloat(latestFitness.diastolic);
    
    // Sử dụng logic BMI chuẩn hóa
    const isHealthyBMIValue = isHealthyBMI(bmi);
    const isValidBMIValue = isValidBMI(bmi);
    
    // Alert level - BMI không khỏe mạnh hoặc các chỉ số khác bất thường
    if ((!isValidBMIValue || !isHealthyBMIValue) || 
        systolic > 140 || diastolic > 90 || abnormalityCount > 0) {
      healthStatus = 'Alert';
    } 
    // Warning level - gần ngưỡng cảnh báo
    else if (systolic > 120 || diastolic > 80) {
      healthStatus = 'Warning';
    }
  }
  
  return healthStatus;
};

// Filter students with valid health data using standardized validation
export const filterValidHealthData = (physicalData) => {
  return physicalData.filter(item => {
    return item.studentId && isValidBMI(item.bmi);
  });
};

// Calculate healthy students rate using standardized BMI logic
export const calculateHealthyStudentsRate = (physicalData) => {
  const validData = filterValidHealthData(physicalData);
  if (validData.length === 0) return 0;
  
  const healthyStudents = validData.filter(item => isHealthyBMI(item.bmi));
  return Math.round((healthyStudents.length / validData.length) * 100);
};