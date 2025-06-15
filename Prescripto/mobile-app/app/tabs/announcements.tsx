import React, { useState, useEffect, FC, ReactElement, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  ColorValue,
} from 'react-native';
import { getAnnouncements } from '../services/api/api';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
  isRead?: boolean; // Thêm trạng thái đã đọc
}

interface PriorityConfig {
  colors: readonly [ColorValue, ColorValue];
  icon: string;
  label: string;
}

const Announcements: FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [errorShown, setErrorShown] = useState(false);


  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Memoize priority configs để tránh tạo lại object
  const priorityConfigs = useMemo(() => ({
    high: {
      colors: ['#ff6b6b', '#ee5a52'] as const,
      icon: 'warning',
      label: 'KHẨN CẤP'
    },
    medium: {
      colors: ['#ffd93d', '#ffcd02'] as const,
      icon: 'info',
      label: 'QUAN TRỌNG'
    },
    low: {
      colors: ['#6bcf7f', '#4CAF50'] as const,
      icon: 'check-circle',
      label: 'THÔNG TIN'
    },
    default: {
      colors: ['#74b9ff', '#0984e3'] as const,
      icon: 'info',
      label: 'THÔNG BÁO'
    }
  }), []);

  const fetchAnnouncements = useCallback( async () => {
    try {
      const data = await getAnnouncements();
      // Ensure data is an array
      const announcementsArray = Array.isArray(data.news) ? data.news : [];
      setAnnouncements(announcementsArray);
      
      // Animation when data loads
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
      if (!errorShown) {
        setErrorShown(true);
      }
      Alert.alert(
        'Lỗi',
        'Không thể tải thông báo. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim, slideAnim, errorShown]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const getPriorityConfig = useCallback((priority: string): PriorityConfig => {
    switch (priority) {
      case 'high':
        return priorityConfigs.high;
      case 'medium':
        return priorityConfigs.medium;
      case 'low':
        return priorityConfigs.low;
      default:
        return priorityConfigs.default;
    }
  }, [priorityConfigs]);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }, []);

  // Thêm function để mark as read
  const markAsRead = useCallback((announcementId: string) => {
    setAnnouncements(prev => 
      prev.map(ann => 
        ann._id === announcementId ? { ...ann, isRead: true } : ann
      )
    );
  }, []);

  const handleAnnouncementPress = useCallback((announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    if (!announcement.isRead) {
      markAsRead(announcement._id);
    }
  }, [markAsRead]);

  // Memoize filtered announcements
  const { unreadCount, sortedAnnouncements } = useMemo(() => {
    const unread = announcements.filter(ann => !ann.isRead).length;
    const sorted = announcements.sort((a, b) => {
      // Priority sorting
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Date sorting
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return { unreadCount: unread, sortedAnnouncements: sorted };
  }, [announcements]);

  const renderHeader = useCallback((): ReactElement => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Icon name="campaign" size={32} color="#ffffff" />
            <Text style={styles.headerTitle}>Thông Báo</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  ), [unreadCount]);

  const renderAnnouncementCard = useCallback((announcement: Announcement, index: number): ReactElement => {
    const priorityConfig = getPriorityConfig(announcement.priority);
    
    return (
      <Animated.View
        key={announcement._id}
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 50],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.announcementCard,
            announcement.isRead && styles.readCard // Style cho card đã đọc
          ]}
          onPress={() => handleAnnouncementPress(announcement)}
          activeOpacity={0.95}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.priorityContainer}>
                <LinearGradient
                  colors={priorityConfig.colors}
                  style={styles.priorityBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon 
                    name={priorityConfig.icon} 
                    size={12} 
                    color="#ffffff" 
                    style={styles.priorityIcon}
                  />
                  <Text style={styles.priorityText}>
                    {priorityConfig.label}
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.rightHeader}>
                {!announcement.isRead && (
                  <View style={styles.unreadDot} />
                )}
                <Text style={styles.dateText}>
                  {formatDate(announcement.createdAt)}
                </Text>
              </View>
            </View>
            
            <Text 
              style={[
                styles.cardTitle,
                announcement.isRead && styles.readTitle
              ]} 
              numberOfLines={2}
            >
              {announcement.title}
            </Text>
            
            <Text 
              style={[
                styles.cardContentText,
                announcement.isRead && styles.readContent
              ]} 
              numberOfLines={3}
            >
              {announcement.content}
            </Text>
            
            <View style={styles.cardFooter}>
              <Text style={styles.readMoreText}>Đọc thêm</Text>
              <Icon name="arrow-forward-ios" size={14} color="#a0a0a0" />
            </View>
          </View>
          
          <View style={[styles.cardAccent, { backgroundColor: priorityConfig.colors[0] }]} />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [fadeAnim, slideAnim, getPriorityConfig, formatDate, handleAnnouncementPress]);

  const renderAnnouncementList = useCallback((): ReactElement => (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      >
        <View style={styles.cardsContainer}>
          {sortedAnnouncements.map((announcement, index) => 
            renderAnnouncementCard(announcement, index)
          )}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  ), [renderHeader, refreshing, onRefresh, sortedAnnouncements, renderAnnouncementCard]);

  const renderAnnouncementDetail = useCallback((): ReactElement => {
    if (!selectedAnnouncement) return <View />;
    
    const priorityConfig = getPriorityConfig(selectedAnnouncement.priority);
    
    return (
      <View style={styles.detailContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.detailHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView>
            <View style={styles.detailHeaderContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedAnnouncement(null)}
              >
                <Icon name="arrow-back-ios" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>Chi tiết</Text>
              <View style={styles.headerSpacer} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        
        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailCard}>
            <View style={styles.detailPriorityContainer}>
              <LinearGradient
                colors={priorityConfig.colors}
                style={styles.detailPriorityBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon 
                  name={priorityConfig.icon} 
                  size={16} 
                  color="#ffffff" 
                  style={styles.priorityIcon}
                />
                <Text style={styles.detailPriorityText}>
                  {priorityConfig.label}
                </Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.detailTitle}>
              {selectedAnnouncement.title}
            </Text>
            
            <View style={styles.detailDateContainer}>
              <Icon name="schedule" size={16} color="#a0a0a0" />
              <Text style={styles.detailDate}>
                {formatDate(selectedAnnouncement.createdAt)}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.detailContentText}>
              {selectedAnnouncement.content}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }, [selectedAnnouncement, getPriorityConfig, formatDate]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#f8f9fa' }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </LinearGradient>
      </View>
    );
  }

  // Empty state
  if (!loading && announcements.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#f8f9fa' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.emptyContainer}>
          <Icon name="notifications-none" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
          <Text style={styles.emptySubtitle}>Các thông báo mới sẽ hiển thị tại đây</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchAnnouncements}>
            <Text style={styles.refreshButtonText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#f8f9fa' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      {selectedAnnouncement ? renderAnnouncementDetail() : renderAnnouncementList()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    height: 140,
    marginBottom: 16,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  scrollContainer: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 16,
  },
  cardContainer: {
    marginBottom: 16,
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  readCard: {
    opacity: 0.8,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardContentText: {
    fontSize: 15,
    color: '#636e72',
    lineHeight: 22,
    marginBottom: 16,
  },
  readContent: {
    color: '#9a9a9a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityContainer: {
    flex: 1,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
    marginRight: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  priorityIcon: {
    marginRight: 4,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 13,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    lineHeight: 24,
    marginBottom: 8,
  },
  readTitle: {
    color: '#7a7a7a',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  readMoreText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginRight: 4,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  detailHeader: {
    paddingBottom: 16,
  },
  detailHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  detailContent: {
    flex: 1,
    paddingTop: 16,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  detailPriorityContainer: {
    marginBottom: 16,
  },
  detailPriorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  detailPriorityText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    lineHeight: 32,
    marginBottom: 12,
  },
  detailDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailDate: {
    fontSize: 15,
    color: '#a0a0a0',
    marginLeft: 6,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginBottom: 20,
  },
  detailContentText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 26,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: 200,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Announcements;