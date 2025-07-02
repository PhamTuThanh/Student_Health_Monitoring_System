import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExamSession {
  _id: string;
  examSessionName: string;
  examSessionAcademicYear: string;
  examSessionDate: string;
}

interface ExamSessionSelectorProps {
  examSessions: ExamSession[];
  selectedSession: string;
  onSessionSelect: (sessionId: string) => void;
  onCompare: () => void;
}

const ExamSessionSelector: React.FC<ExamSessionSelectorProps> = ({
  examSessions,
  selectedSession,
  onSessionSelect,
  onCompare
}) => {
  if (examSessions.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name="school-outline" size={20} color="#374151" />
          <Text style={styles.cardTitle}>Academic Year</Text>
        </View>
        {examSessions.length > 1 && (
          <TouchableOpacity style={styles.compareButton} onPress={onCompare}>
            <Ionicons name="analytics-outline" size={16} color="white" />
            <Text style={styles.compareButtonText}>Compare</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionScrollView}>
        {examSessions.map((session) => (
          <TouchableOpacity
            key={session._id}
            style={[
              styles.sessionCard,
              selectedSession === session._id && styles.selectedSessionCard
            ]}
            onPress={() => onSessionSelect(session._id)}
          >
            <Text style={[
              styles.sessionYear,
              selectedSession === session._id && styles.selectedSessionText
            ]}>
              {session.examSessionAcademicYear}
            </Text>
            <Text style={[
              styles.sessionName,
              selectedSession === session._id && styles.selectedSessionSubText
            ]}>
              {session.examSessionName}
            </Text>
            <Text style={[
              styles.sessionDate,
              selectedSession === session._id && styles.selectedSessionSubText
            ]}>
              {new Date(session.examSessionDate).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compareButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  sessionScrollView: {
    marginTop: 16,
  },
  sessionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSessionCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  sessionYear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedSessionText: {
    color: '#1D4ED8',
  },
  sessionName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  selectedSessionSubText: {
    color: '#3B82F6',
  },
  sessionDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});

export default ExamSessionSelector; 