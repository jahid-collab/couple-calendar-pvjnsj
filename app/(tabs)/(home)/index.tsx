
import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Event } from '@/types/Event';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';
import { useEvents } from '@/hooks/useEvents';
import { useGoals } from '@/hooks/useGoals';
import { useReminders } from '@/hooks/useReminders';

export default function CalendarScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { couple } = useCouple(user?.id);
  const { events, loading: eventsLoading, addEvent } = useEvents(couple?.id);
  const { goals, loading: goalsLoading } = useGoals(couple?.id);
  const { reminders, loading: remindersLoading } = useReminders(couple?.id);
  const [selectedDate, setSelectedDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDateDetailsModal, setShowDateDetailsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'date' as Event['type'],
    description: '',
  });

  const loading = eventsLoading || goalsLoading || remindersLoading;

  // Combine events, goals, and reminders for calendar marking
  const markedDates = React.useMemo(() => {
    const dates: any = {};
    
    // Mark events
    events.forEach(event => {
      if (!dates[event.date]) {
        dates[event.date] = { dots: [] };
      }
      dates[event.date].dots.push({
        color: event.color,
      });
    });

    // Mark goals with target dates
    goals.forEach(goal => {
      if (goal.targetDate) {
        if (!dates[goal.targetDate]) {
          dates[goal.targetDate] = { dots: [] };
        }
        dates[goal.targetDate].dots.push({
          color: goal.color,
        });
      }
    });

    // Mark reminders with due dates
    reminders.forEach(reminder => {
      if (reminder.dueDate) {
        if (!dates[reminder.dueDate]) {
          dates[reminder.dueDate] = { dots: [] };
        }
        dates[reminder.dueDate].dots.push({
          color: colors.accent,
        });
      }
    });

    // Add selection styling
    if (selectedDate) {
      if (!dates[selectedDate]) {
        dates[selectedDate] = {};
      }
      dates[selectedDate].selected = true;
      dates[selectedDate].selectedColor = colors.accent;
    }

    // Convert dots array to marking format
    Object.keys(dates).forEach(date => {
      if (dates[date].dots && dates[date].dots.length > 0) {
        dates[date].marked = true;
        dates[date].dotColor = dates[date].dots[0].color;
      }
    });

    return dates;
  }, [events, goals, reminders, selectedDate]);

  const selectedEvents = events.filter(e => e.date === selectedDate);
  const selectedGoals = goals.filter(g => g.targetDate === selectedDate);
  const selectedReminders = reminders.filter(r => r.dueDate === selectedDate);

  const handleDayPress = (day: DateData) => {
    console.log('Day pressed:', day.dateString);
    setSelectedDate(day.dateString);
    
    // Check if there are events, goals, or reminders on this date
    const hasEvents = events.some(e => e.date === day.dateString);
    const hasGoals = goals.some(g => g.targetDate === day.dateString);
    const hasReminders = reminders.some(r => r.dueDate === day.dateString);
    
    if (hasEvents || hasGoals || hasReminders) {
      setShowDateDetailsModal(true);
    }
  };

  const handleAddEvent = async () => {
    console.log('=== handleAddEvent called ===');
    console.log('newEvent:', newEvent);
    console.log('selectedDate:', selectedDate);
    console.log('user:', user);
    console.log('couple:', couple);

    if (!newEvent.title || !selectedDate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user || !couple) {
      Alert.alert('Error', 'You must be connected with a partner to add events');
      return;
    }

    setSaving(true);

    try {
      const eventColors = {
        vacation: '#FFD180',
        date: '#E91E63',
        trip: '#9C27B0',
        event: '#F48FB1',
      };

      const event: Omit<Event, 'id'> = {
        title: newEvent.title,
        date: selectedDate,
        type: newEvent.type,
        description: newEvent.description,
        color: eventColors[newEvent.type],
      };

      console.log('Attempting to add event:', event);
      console.log('User ID:', user.id);

      const result = await addEvent(event, user.id);
      console.log('Event added successfully:', result);

      setShowAddModal(false);
      setNewEvent({ title: '', type: 'date', description: '' });
      Alert.alert('Success', 'Event added successfully!');
    } catch (error: any) {
      console.error('=== Error adding event ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      Alert.alert('Error', error.message || 'Failed to add event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenModal = () => {
    console.log('=== handleOpenModal called ===');
    console.log('selectedDate:', selectedDate);
    console.log('couple:', couple);
    console.log('user:', user);
    
    if (!selectedDate) {
      Alert.alert('Select a Date', 'Please select a date first to add an event');
      return;
    }
    if (!couple) {
      Alert.alert('Connect with Partner', 'Please connect with your partner first to add events');
      return;
    }
    console.log('Opening modal...');
    setShowAddModal(true);
  };

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={handleOpenModal}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <IconSymbol name="plus" color={colors.primary} size={24} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Joint Calendar',
            headerRight: renderHeaderRight,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary,
                dotColor: colors.primary,
                selectedDotColor: '#FFFFFF',
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>

          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>Upcoming Events, Goals & Reminders</Text>
            
            {/* Upcoming Events */}
            {events
              .filter(e => new Date(e.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 3)
              .map(event => (
                <Pressable 
                  key={event.id} 
                  style={[styles.eventCard, { borderLeftColor: event.color }]}
                  onPress={() => {
                    setSelectedDate(event.date);
                    setShowDateDetailsModal(true);
                  }}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventEmoji}>{event.emoji || '📅'}</Text>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDate}>
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}

            {/* Upcoming Goals with target dates */}
            {goals
              .filter(g => g.targetDate && new Date(g.targetDate) >= new Date())
              .sort((a, b) => {
                if (!a.targetDate || !b.targetDate) return 0;
                return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
              })
              .slice(0, 3)
              .map(goal => (
                <Pressable 
                  key={goal.id} 
                  style={[styles.goalCard, { borderLeftColor: goal.color }]}
                  onPress={() => {
                    if (goal.targetDate) {
                      setSelectedDate(goal.targetDate);
                      setShowDateDetailsModal(true);
                    }
                  }}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventEmoji}>{goal.emoji || '🎯'}</Text>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{goal.title}</Text>
                      <Text style={styles.goalProgress}>{goal.progress}% complete</Text>
                      {goal.targetDate && (
                        <Text style={styles.eventDate}>
                          Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric' 
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}

            {/* Upcoming Reminders with due dates */}
            {reminders
              .filter(r => r.dueDate && new Date(r.dueDate) >= new Date() && !r.completed)
              .sort((a, b) => {
                if (!a.dueDate || !b.dueDate) return 0;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              })
              .slice(0, 3)
              .map(reminder => (
                <Pressable 
                  key={reminder.id} 
                  style={[styles.reminderCard, { borderLeftColor: colors.accent }]}
                  onPress={() => {
                    if (reminder.dueDate) {
                      setSelectedDate(reminder.dueDate);
                      setShowDateDetailsModal(true);
                    }
                  }}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventEmoji}>⏰</Text>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{reminder.title}</Text>
                      {reminder.dueDate && (
                        <Text style={styles.eventDate}>
                          Due: {new Date(reminder.dueDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric' 
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}

            {events.length === 0 && goals.length === 0 && reminders.length === 0 && (
              <View style={styles.emptyState}>
                <IconSymbol name="calendar.badge.plus" color={colors.textSecondary} size={48} />
                <Text style={styles.emptyText}>No upcoming events, goals, or reminders</Text>
                <Text style={styles.emptySubtext}>Tap + to add an event</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {Platform.OS !== 'ios' && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleOpenModal}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" color="#FFFFFF" size={28} />
          </TouchableOpacity>
        )}
      </View>

      {/* Date Details Modal */}
      <Modal
        visible={showDateDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateDetailsModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDateDetailsModal(false)}
        >
          <Pressable 
            style={styles.dateDetailsModal}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric' 
                })}
              </Text>
              <TouchableOpacity onPress={() => setShowDateDetailsModal(false)}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.dateDetailsContent} showsVerticalScrollIndicator={false}>
              {/* Events Section */}
              {selectedEvents.length > 0 && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Events</Text>
                  {selectedEvents.map(event => (
                    <View key={event.id} style={[styles.detailCard, { borderLeftColor: event.color }]}>
                      <View style={styles.detailHeader}>
                        <Text style={styles.detailEmoji}>{event.emoji || '📅'}</Text>
                        <View style={styles.detailInfo}>
                          <Text style={styles.detailTitle}>{event.title}</Text>
                          <Text style={styles.detailType}>{event.type.toUpperCase()}</Text>
                          {event.description && (
                            <Text style={styles.detailDescription}>{event.description}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Goals Section */}
              {selectedGoals.length > 0 && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Goals</Text>
                  {selectedGoals.map(goal => (
                    <View key={goal.id} style={[styles.detailCard, { borderLeftColor: goal.color }]}>
                      <View style={styles.detailHeader}>
                        <Text style={styles.detailEmoji}>{goal.emoji || '🎯'}</Text>
                        <View style={styles.detailInfo}>
                          <Text style={styles.detailTitle}>{goal.title}</Text>
                          <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                              <View 
                                style={[
                                  styles.progressFill, 
                                  { width: `${goal.progress}%`, backgroundColor: goal.color }
                                ]} 
                              />
                            </View>
                            <Text style={styles.progressText}>{goal.progress}%</Text>
                          </View>
                          {goal.description && (
                            <Text style={styles.detailDescription}>{goal.description}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Reminders Section */}
              {selectedReminders.length > 0 && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Reminders</Text>
                  {selectedReminders.map(reminder => (
                    <View key={reminder.id} style={[styles.detailCard, { borderLeftColor: colors.accent }]}>
                      <View style={styles.detailHeader}>
                        <Text style={styles.detailEmoji}>⏰</Text>
                        <View style={styles.detailInfo}>
                          <Text style={styles.detailTitle}>{reminder.title}</Text>
                          {reminder.completed && (
                            <Text style={styles.completedBadge}>✓ Completed</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {selectedEvents.length === 0 && selectedGoals.length === 0 && selectedReminders.length === 0 && (
                <View style={styles.emptyState}>
                  <IconSymbol name="calendar" color={colors.textSecondary} size={48} />
                  <Text style={styles.emptyText}>No events, goals, or reminders on this day</Text>
                  <Text style={styles.emptySubtext}>Tap + to add an event</Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            console.log('Modal overlay pressed, closing modal');
            setShowAddModal(false);
          }}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => {
              console.log('Modal content pressed, stopping propagation');
              e.stopPropagation();
            }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Event title"
              placeholderTextColor={colors.textSecondary}
              value={newEvent.title}
              onChangeText={(text) => {
                console.log('Title changed:', text);
                setNewEvent({ ...newEvent, title: text });
              }}
            />

            <View style={styles.typeSelector}>
              {(['date', 'vacation', 'trip', 'event'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newEvent.type === type && styles.typeButtonActive
                  ]}
                  onPress={() => {
                    console.log('Type selected:', type);
                    setNewEvent({ ...newEvent, type });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newEvent.type === type && styles.typeButtonTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newEvent.description}
              onChangeText={(text) => {
                console.log('Description changed:', text);
                setNewEvent({ ...newEvent, description: text });
              }}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity 
              style={[styles.addButton, saving && styles.buttonDisabled]} 
              onPress={handleAddEvent}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>Add Event</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  calendarContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  calendar: {
    borderRadius: 16,
  },
  upcomingSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  reminderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  eventDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(233, 30, 99, 0.4)',
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  dateDetailsModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  dateDetailsContent: {
    maxHeight: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  detailType: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  completedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.textSecondary + '30',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
