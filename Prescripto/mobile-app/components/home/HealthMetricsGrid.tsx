import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HealthMetrics {
  height: number;
  weight: number;
  bmi: string;
  heartRate: number;
  followDate: string;
  examSessionId?: {
    _id: string;
    examSessionName: string;
    examSessionAcademicYear: string;
    examSessionDate: string;
  };
}

interface HealthMetricsGridProps {
  healthMetrics: HealthMetrics;
}

const HealthMetricsGrid: React.FC<HealthMetricsGridProps> = ({ healthMetrics }) => {
  const getBMIStatus = (bmi: string) => {
    const bmiNum = parseFloat(bmi);
  
    if (isNaN(bmiNum)) {
      return { status: 'Invalid BMI', color: '#808080' }; 
    }
  
    if (bmiNum < 18.5) {
      return { status: 'Underweight', color: '#3B82F6' }; 
    } else if (18.5 <= bmiNum && bmiNum < 23) { 
      return { status: 'Normal', color: '#10B981' }; 
    } else if (23 <= bmiNum && bmiNum < 25) { 
      return { status: 'Overweight (Pre-obese)', color: '#F59E0B' }; 
    } else if (25 <= bmiNum && bmiNum < 30) { 
      return { status: 'Obese Class I', color: '#EF4444' }; 
    } else { 
      return { status: 'Obese Class II', color: '#CC0000' }; 
    }
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 90 && score <= 100) return '#10B981'; 
    if (75 <= score && score < 90) return '#3B82F6'; 
    if (60 <= score && score < 75) return '#F59E0B'; 
    if (score < 60) return '#EF4444'; 
    return '#EF4444'; 
  };

  const getHealthScoreStatus = (score: number) => {
    if (score >= 90) return 'High';
    if (75 <= score && score < 90) return 'Medium';
    if (60 <= score && score < 75) return 'Low';
    return 'Low';
  };

  const renderHealthMetricCard = (
    icon: keyof typeof Ionicons.glyphMap, 
    title: string,
    value: string,
    subtitle: string,
    color: string
  ) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.metricsGrid}>
      {renderHealthMetricCard(
        'resize-outline',
        'Height',
        `${healthMetrics?.height} cm`,
        'Normal range',
        '#3B82F6'
      )}
      {renderHealthMetricCard(
        'fitness-outline',
        'Weight',
        `${healthMetrics?.weight} kg`,
        'Normal range',
        '#10B981'
      )}
      {renderHealthMetricCard(
        'bar-chart-outline',
        'BMI',
        `${healthMetrics?.bmi}`,
        getBMIStatus(healthMetrics?.bmi || '0').status,
        getBMIStatus(healthMetrics?.bmi || '0').color
      )}
      {renderHealthMetricCard(
        'heart-outline', 
        'Heart Rate',
        `${healthMetrics?.heartRate} bpm`,
        getHealthScoreStatus(healthMetrics?.heartRate || 0),
        getHealthScoreColor(healthMetrics?.heartRate || 0)
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '48%', 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right', 
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default HealthMetricsGrid; 