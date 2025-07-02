import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

interface WelcomeCardProps {
  studentData: StudentData;
  onContactHealthCenter: () => void;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({
  studentData,
  onContactHealthCenter
}) => {
  return (
    <>
      {/* Welcome Card for New Student */}
      <View style={styles.welcomeCard}>
        <LinearGradient
          colors={['#60A5FA', '#10B981']}
          style={styles.welcomeGradient}
        >
          <View style={styles.welcomeHeader}>
            <Ionicons name="medical-outline" size={48} color="white" />
            <Text style={styles.welcomeTitle}>Welcome to UTC2!</Text>
            <Text style={styles.welcomeSubtitle}>
              Hello {studentData.name}, we haven't found any health data for you.
            </Text>
          </View>
        </LinearGradient>
        
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeMessage}>
            To start tracking your health, you need to perform your first health check at UTC2 Health Department
          </Text>
          
          <View style={styles.instructionSteps}>
            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Register for a health check</Text>
                <Text style={styles.stepDescription}>Contact the Health Department to more information</Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Perform a health check</Text>
                <Text style={styles.stepDescription}>Measure height, weight, blood pressure and other indicators</Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Track results</Text>
                <Text style={styles.stepDescription}>Data will be updated and displayed here</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.contactButton} onPress={onContactHealthCenter}>
            <Ionicons name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.contactButtonText}>Chat with a doctor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoCardsContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#10B981" />
          <Text style={styles.infoCardTitle}>Protect your health</Text>
          <Text style={styles.infoCardDescription}>
            Regular monitoring helps detect health issues early
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <Ionicons name="analytics-outline" size={32} color="#3B82F6" />
          <Text style={styles.infoCardTitle}>Track Progress</Text>
          <Text style={styles.infoCardDescription}>
            Monitor your health trends and improvements over time
          </Text>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.contactInfoCard}>
        <View style={styles.contactHeader}>
          <Ionicons name="medical" size={24} color="#EF4444" />
          <Text style={styles.contactTitle}>Contact Information</Text>
        </View>
        <View style={styles.contactDetails}>
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.contactText}>UTC2 Health Department</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.contactText}>(028).3736.0564</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.contactText}>Monday - Friday: 7:00 - 17:30</Text>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  welcomeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeHeader: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeContent: {
    padding: 24,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionSteps: {
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoCardDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  contactInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  contactDetails: {
    marginLeft: 32,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});

export default WelcomeCard;
