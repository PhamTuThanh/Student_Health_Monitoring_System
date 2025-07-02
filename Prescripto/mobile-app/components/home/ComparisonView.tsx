import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ComparisonData {
  session1: {
    _id: string;
    name: string;
    academicYear: string;
    date: string;
    height: number;
    weight: number;
    bmi: string;
    systolic: number;
    diastolic: number;
    heartRate: number;
    danhGiaBMI: string;
    danhGiaTTH: string;
    [key: string]: any;
  };
  session2: {
    _id: string;
    name: string;
    academicYear: string;
    date: string;
    height: number;
    weight: number;
    bmi: string;
    systolic: number;
    diastolic: number;
    heartRate: number;
    danhGiaBMI: string;
    danhGiaTTH: string;
    [key: string]: any;
  };
  differences: {
    height: number;
    weight: number;
    bmi: string;
    systolic: number;
    diastolic: number;
    heartRate: number;
    [key: string]: any;
  };
}

interface ComparisonViewProps {
  showComparison: boolean;
  comparisonData: ComparisonData | null;
  onClose: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  showComparison,
  comparisonData,
  onClose
}) => {
  if (!showComparison || !comparisonData) {
    return null;
  }

  const comparisonMetrics = [
    { key: 'height', label: 'Height', unit: 'cm', precision: 1 },
    { key: 'weight', label: 'Weight', unit: 'kg', precision: 1 },
    { key: 'bmi', label: 'BMI', unit: '', precision: 2 },
    { key: 'systolic', label: 'Systolic', unit: 'mmHg', precision: 0 },
    { key: 'diastolic', label: 'Diastolic', unit: 'mmHg', precision: 0 },
    { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', precision: 0 },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name="bar-chart-outline" size={20} color="#374151" />
          <Text style={styles.cardTitle}>Health Data Comparison</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonHeader}>
          <Text style={styles.comparisonTitle}>
            {comparisonData.session1.academicYear} (Cũ) vs {comparisonData.session2.academicYear} (Mới)
          </Text>
          <Text style={styles.comparisonSubtitle}>
            So sánh dữ liệu sức khỏe giữa hai năm học
          </Text>
        </View>
        
        <View style={styles.comparisonMetrics}>
          {comparisonMetrics.map((metric) => (
            <View key={metric.key} style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>{metric.label}</Text>
              <View style={styles.comparisonValues}>
                <View style={styles.comparisonValueWrapper}>
                  <Text style={styles.valueLabel}>Cũ</Text>
                  <Text style={styles.oldValue}>
                    {metric.precision === 0 
                      ? Math.round(comparisonData.session1[metric.key]) 
                      : Number(comparisonData.session1[metric.key]).toFixed(metric.precision)
                    } {metric.unit}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#6B7280" />
                <View style={styles.comparisonValueWrapper}>
                  <Text style={styles.valueLabel}>Mới</Text>
                  <Text style={styles.newValue}>
                    {metric.precision === 0 
                      ? Math.round(comparisonData.session2[metric.key]) 
                      : Number(comparisonData.session2[metric.key]).toFixed(metric.precision)
                    } {metric.unit}
                  </Text>
                </View>
                <View style={[
                  styles.changeBadge,
                  { backgroundColor: Number(comparisonData.differences[metric.key]) >= 0 ? '#FEE2E2' : '#D1FAE5' }
                ]}>
                  <Text style={[
                    styles.changeText,
                    { color: Number(comparisonData.differences[metric.key]) >= 0 ? '#991B1B' : '#065F46' }
                  ]}>
                    {Number(comparisonData.differences[metric.key]) >= 0 ? '+' : ''}
                    {metric.precision === 0 
                      ? Math.round(Number(comparisonData.differences[metric.key])) 
                      : Number(comparisonData.differences[metric.key]).toFixed(metric.precision)
                    }
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  comparisonContainer: {
    marginTop: 16,
  },
  comparisonHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  comparisonSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  comparisonMetrics: {},
  comparisonRow: {
    marginBottom: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonValueWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  valueLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
    fontWeight: '500',
  },
  oldValue: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  newValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default ComparisonView;
