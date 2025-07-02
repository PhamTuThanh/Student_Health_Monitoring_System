import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

interface OldDataBannerProps {
  isShowingOldData: boolean;
  latestAvailableHealthData: HealthMetrics | null;
  onScheduleCheckup: () => void;
}

const OldDataBanner: React.FC<OldDataBannerProps> = ({
  isShowingOldData,
  latestAvailableHealthData,
  onScheduleCheckup
}) => {
  if (!isShowingOldData || !latestAvailableHealthData) {
    return null;
  }

  return (
    <View style={styles.oldDataBanner}>
      <View style={styles.oldDataBannerContent}>
        <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
        <View style={styles.oldDataTextContainer}>
          <Text style={styles.oldDataTitle}>Displaying Previous Health Data</Text>
          <Text style={styles.oldDataSubtitle}>
            No health data found for the selected academic year. 
            Showing data from: {latestAvailableHealthData.examSessionId?.examSessionAcademicYear || 'previous session'}
          </Text>
        </View>
      </View>
      <View style={styles.oldDataAction}>
        <TouchableOpacity style={styles.contactHealthCenterButton} onPress={onScheduleCheckup}>
          <Text style={styles.contactHealthCenterText}>Schedule Checkup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  oldDataBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  oldDataBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  oldDataTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  oldDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  oldDataSubtitle: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  oldDataAction: {
    alignItems: 'flex-end',
  },
  contactHealthCenterButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  contactHealthCenterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OldDataBanner;
