import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface StudentData {
  name: string;
  studentId: string;
  cohort: string;
  major: string;
  email: string;
  phone: string;
  address: any;
  dob: string;
  gender: string;
  image?: string;
}

interface ProfileCardProps {
  studentData: StudentData;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ studentData }) => {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <LinearGradient
          colors={['#60A5FA', '#10B981']}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{studentData?.name?.charAt(0)}</Text>
        </LinearGradient>
        <View style={styles.profileInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.studentName}>{studentData?.name}</Text>
            <View style={styles.classBadge}>
              <Text style={styles.classBadgeText}>{studentData?.cohort}</Text>
            </View>
          </View>
          <View style={styles.studentDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="book-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>ID: {studentData?.studentId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>Major: {studentData?.major}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>DOB: {studentData?.dob}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{studentData?.phone}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 12,
  },
  classBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  classBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  studentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
    width: '45%', 
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
});

export default ProfileCard; 