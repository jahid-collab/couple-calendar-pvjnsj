
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

type AddItemType = 'event' | 'goal' | 'reminder';

export default function CalendarScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { couple } = useCouple(user?.id);
  const { events, loading: eventsLoading, addEvent } = useEvents(couple?.id);
  const { goals, loading: goalsLoading, addGoal } = useGoals(couple?.id);
  const { reminders, loading: remindersLoading, addReminder } = useReminders(couple?.id);
  const [selectedDate, setSelectedDate] = useState('');
  const [showTypeSelectionModal, setShowTypeSelectionModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDateDetailsModal, setShowDateDetailsModal] = useState(false);
  const [addItemType, setAddItemType] = useState<AddItemType>('event');
  const [saving, setSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'date' as Event['type'],
    description: '',
  });
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
  });
  const [newReminder, setNewReminder] = useState({
    title: '',
    dueDate: '',
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
      dates[selectedDate].selectedColor = colors.primary;
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
        vacation: colors.lavender,
        date: colors.peach,
        trip: colors.yellow,
        event: colors.pink,
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

  const handleAddGoal = async () => {
    console.log('=== handleAddGoal called ===');
    console.log('newGoal:', newGoal);
    console.log('selectedDate:', selectedDate);

    if (!newGoal.title || !newGoal.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add goals');
      return;
    }

    if (!couple?.id) {
      Alert.alert('Error', 'You must be connected with a partner to add goals');
      return;
    }

    setSaving(true);

    try {
      const goalColors = [colors.mint, colors.lavender, colors.pink, colors.yellow];
      const goal = {
        title: newGoal.title,
        description: newGoal.description,
        targetDate: newGoal.targetDate || selectedDate || undefined,
        color: goalColors[Math.floor(Math.random() * goalColors.length)],
        emoji: '🎯',
      };

      console.log('Adding goal:', goal);
      await addGoal(goal, user.id);
      
      setShowAddModal(false);
      setNewGoal({ title: '', description: '', targetDate: '' });
      Alert.alert('Success', 'Goal added successfully!');
    } catch (error: any) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', error.message || 'Failed to add goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReminder = async () => {
    console.log('=== handleAddReminder called ===');
    console.log('newReminder:', newReminder);
    console.log('selectedDate:', selectedDate);

    if (!newReminder.title) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    if (!user || !couple) {
      Alert.alert('Error', 'You must be connected with a partner to add reminders');
      return;
    }

    setSaving(true);

    try {
      console.log('Attempting to add reminder...');
      await addReminder(
        {
          title: newReminder.title,
          dueDate: newReminder.dueDate || selectedDate || undefined,
          shared: true,
        },
        user.id
      );

      console.log('Reminder added successfully');
      setShowAddModal(false);
      setNewReminder({ title: '', dueDate: '' });
      Alert.alert('Success', 'Reminder added successfully!');
    } catch (error: any) {
      console.error('=== Error adding reminder ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      Alert.alert('Error', error.message || 'Failed to add reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (addItemType === 'event') {
      await handleAddEvent();
    } else if (addItemType === 'goal') {
      await handleAddGoal();
    } else if (addItemType === 'reminder') {
      await handleAddReminder();
    }
  };

  const handleOpenTypeSelection = () => {
    console.log('=== handleOpenTypeSelection called ===');
    console.log('couple:', couple);
    console.log('user:', user);
    
    if (!couple) {
      Alert.alert('Connect with Partner', 'Please connect with your partner first to add items');
      return;
    }
    console.log('Opening type selection modal...');
    setShowTypeSelectionModal(true);
  };

  const handleSelectType = (type: AddItemType) => {
    console.log('Type selected:', type);
    setAddItemType(type);
    setShowTypeSelectionModal(false);
    
    // Get today's date if no date is selected
    if (!selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
    
    setShowAddModal(true);
  };

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={handleOpenTypeSelection}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <IconSymbol name="plus" color={colors.text} size={24} />
    </TouchableOpacity>
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'vacation': return '🏖️';
      case 'date': return '💕';
      case 'trip': return '✈️';
      case 'event': return '🎉';
      default: return '📅';
    }
  };

  const getEventBackgroundColor = (type: string) => {
    switch (type) {
      case 'vacation': return colors.lightLavender;
      case 'date': return colors.lightPeach;
      case 'trip': return colors.lightYellow;
      case 'event': return colors.lightPink;
      default: return colors.lightPeach;
    }
  };

  const getEventIconColor = (type: string) => {
    switch (type) {
      case 'vacation': return colors.lavender;
      case 'date': return colors.peach;
      case 'trip': return colors.yellow;
      case 'event': return colors.pink;
      default: return colors.peach;
    }
  };

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
            title: 'November',
            headerRight: renderHeaderRight,
            headerLargeTitle: false,
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
          {/* Header with Month and Icons */}
          {Platform.OS !== 'ios' && (
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>November</Text>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.headerIconButton}>
                  <IconSymbol name="calendar" color={colors.text} size={22} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconButton}>
                  <IconSymbol name="bell" color={colors.text} size={22} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Schedule in your</Text>
            <Text style={styles.pageTitle}>calendar 📬</Text>
          </View>

          {/* Calendar Week View */}
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary + '60',
                dotColor: colors.primary,
                selectedDotColor: '#FFFFFF',
                arrowColor: colors.text,
                monthTextColor: colors.text,
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
              style={styles.calendar}
              hideExtraDays={true}
            />
          </View>

          {/* Events List */}
          <View style={styles.eventsSection}>
            {/* Upcoming Events */}
            {events
              .filter(e => new Date(e.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map((event, index) => (
                <Pressable 
                  key={event.id} 
                  style={[
                    styles.eventCard,
                    { backgroundColor: getEventBackgroundColor(event.type) }
                  ]}
                  onPress={() => {
                    setSelectedDate(event.date);
                    setShowDateDetailsModal(true);
                  }}
                >
                  <View style={styles.eventTime}>
                    <Text style={styles.eventTimeText}>
                      {new Date(event.date).toLocaleTimeString('en-US', { 
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </Text>
                  </View>
                  <View style={styles.eventContent}>
                    <View style={[
                      styles.eventIconCircle,
                      { backgroundColor: getEventIconColor(event.type) }
                    ]}>
                      <Text style={styles.eventIconText}>{getEventIcon(event.type)}</Text>
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventSubtitle}>
                        {event.description || `Today ${new Date(event.date).toLocaleTimeString('en-US', { 
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true 
                        })}`}
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
              .map((goal, index) => (
                <Pressable 
                  key={goal.id} 
                  style={[
                    styles.eventCard,
                    { backgroundColor: colors.lightMint }
                  ]}
                  onPress={() => {
                    if (goal.targetDate) {
                      setSelectedDate(goal.targetDate);
                      setShowDateDetailsModal(true);
                    }
                  }}
                >
                  <View style={styles.eventTime}>
                    <Text style={styles.eventTimeText}>
                      {goal.targetDate && new Date(goal.targetDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </Text>
                  </View>
                  <View style={styles.eventContent}>
                    <View style={[
                      styles.eventIconCircle,
                      { backgroundColor: colors.mint }
                    ]}>
                      <Text style={styles.eventIconText}>{goal.emoji || '🎯'}</Text>
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{goal.title}</Text>
                      <Text style={styles.eventSubtitle}>
                        {goal.progress}% complete
                      </Text>
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
              .map((reminder, index) => (
                <Pressable 
                  key={reminder.id} 
                  style={[
                    styles.eventCard,
                    { backgroundColor: colors.lightYellow }
                  ]}
                  onPress={() => {
                    if (reminder.dueDate) {
                      setSelectedDate(reminder.dueDate);
                      setShowDateDetailsModal(true);
                    }
                  }}
                >
                  <View style={styles.eventTime}>
                    <Text style={styles.eventTimeText}>
                      {reminder.dueDate && new Date(reminder.dueDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </Text>
                  </View>
                  <View style={styles.eventContent}>
                    <View style={[
                      styles.eventIconCircle,
                      { backgroundColor: colors.yellow }
                    ]}>
                      <Text style={styles.eventIconText}>⏰</Text>
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{reminder.title}</Text>
                      <Text style={styles.eventSubtitle}>
                        {reminder.dueDate && `Due ${new Date(reminder.dueDate).toLocaleTimeString('en-US', { 
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true 
                        })}`}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}

            {events.length === 0 && goals.length === 0 && reminders.length === 0 && (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.lightPeach }]}>
                  <IconSymbol name="calendar.badge.plus" color={colors.peach} size={32} />
                </View>
                <Text style={styles.emptyText}>No upcoming events</Text>
                <Text style={styles.emptySubtext}>Tap + to add your first event, goal, or reminder</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {Platform.OS !== 'ios' && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleOpenTypeSelection}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" color="#FFFFFF" size={28} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeSelectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypeSelectionModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowTypeSelectionModal(false)}
        >
          <Pressable 
            style={styles.typeSelectionModal}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>What would you like to add?</Text>
              <TouchableOpacity onPress={() => setShowTypeSelectionModal(false)}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeOptionsContainer}>
              <TouchableOpacity
                style={[styles.typeOptionCard, { backgroundColor: colors.lightPeach }]}
                onPress={() => handleSelectType('event')}
                activeOpacity={0.7}
              >
                <View style={[styles.typeOptionIcon, { backgroundColor: colors.peach }]}>
                  <Text style={styles.typeOptionEmoji}>📅</Text>
                </View>
                <Text style={styles.typeOptionTitle}>Event</Text>
                <Text style={styles.typeOptionDescription}>
                  Add a date, vacation, trip, or special event
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOptionCard, { backgroundColor: colors.lightMint }]}
                onPress={() => handleSelectType('goal')}
                activeOpacity={0.7}
              >
                <View style={[styles.typeOptionIcon, { backgroundColor: colors.mint }]}>
                  <Text style={styles.typeOptionEmoji}>🎯</Text>
                </View>
                <Text style={styles.typeOptionTitle}>Goal</Text>
                <Text style={styles.typeOptionDescription}>
                  Create a shared goal with progress tracking
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOptionCard, { backgroundColor: colors.lightYellow }]}
                onPress={() => handleSelectType('reminder')}
                activeOpacity={0.7}
              >
                <View style={[styles.typeOptionIcon, { backgroundColor: colors.yellow }]}>
                  <Text style={styles.typeOptionEmoji}>⏰</Text>
                </View>
                <Text style={styles.typeOptionTitle}>Reminder</Text>
                <Text style={styles.typeOptionDescription}>
                  Set a reminder for something important
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
                  {selectedEvents.map((event, index) => (
                    <View 
                      key={event.id} 
                      style={[
                        styles.detailCard,
                        { backgroundColor: getEventBackgroundColor(event.type) }
                      ]}
                    >
                      <View style={styles.detailHeader}>
                        <View style={[
                          styles.detailIconCircle,
                          { backgroundColor: getEventIconColor(event.type) }
                        ]}>
                          <Text style={styles.detailIconText}>{getEventIcon(event.type)}</Text>
                        </View>
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
                  {selectedGoals.map((goal, index) => (
                    <View 
                      key={goal.id} 
                      style={[
                        styles.detailCard,
                        { backgroundColor: colors.lightMint }
                      ]}
                    >
                      <View style={styles.detailHeader}>
                        <View style={[
                          styles.detailIconCircle,
                          { backgroundColor: colors.mint }
                        ]}>
                          <Text style={styles.detailIconText}>{goal.emoji || '🎯'}</Text>
                        </View>
                        <View style={styles.detailInfo}>
                          <Text style={styles.detailTitle}>{goal.title}</Text>
                          <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                              <View 
                                style={[
                                  styles.progressFill, 
                                  { width: `${goal.progress}%`, backgroundColor: colors.mint }
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
                  {selectedReminders.map((reminder, index) => (
                    <View 
                      key={reminder.id} 
                      style={[
                        styles.detailCard,
                        { backgroundColor: colors.lightYellow }
                      ]}
                    >
                      <View style={styles.detailHeader}>
                        <View style={[
                          styles.detailIconCircle,
                          { backgroundColor: colors.yellow }
                        ]}>
                          <Text style={styles.detailIconText}>⏰</Text>
                        </View>
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
                  <View style={[styles.emptyIconCircle, { backgroundColor: colors.lightPeach }]}>
                    <IconSymbol name="calendar" color={colors.peach} size={32} />
                  </View>
                  <Text style={styles.emptyText}>No events on this day</Text>
                  <Text style={styles.emptySubtext}>Tap + to add an event, goal, or reminder</Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Item Modal */}
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
              <Text style={styles.modalTitle}>
                {addItemType === 'event' && 'Add Event'}
                {addItemType === 'goal' && 'Add Goal'}
                {addItemType === 'reminder' && 'Add Reminder'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            {addItemType === 'event' && (
              <>
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
                  {(['date', 'vacation', 'trip', 'event'] as const).map((type, index) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        newEvent.type === type && styles.typeButtonActive,
                        newEvent.type === type && { backgroundColor: getEventIconColor(type) }
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
              </>
            )}

            {addItemType === 'goal' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Goal title"
                  placeholderTextColor={colors.textSecondary}
                  value={newGoal.title}
                  onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description"
                  placeholderTextColor={colors.textSecondary}
                  value={newGoal.description}
                  onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
                  multiline
                  numberOfLines={3}
                />

                <TextInput
                  style={styles.input}
                  placeholder={`Target date (${selectedDate || 'YYYY-MM-DD'})`}
                  placeholderTextColor={colors.textSecondary}
                  value={newGoal.targetDate}
                  onChangeText={(text) => setNewGoal({ ...newGoal, targetDate: text })}
                />
              </>
            )}

            {addItemType === 'reminder' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="What do you need to remember?"
                  placeholderTextColor={colors.textSecondary}
                  value={newReminder.title}
                  onChangeText={(text) => {
                    console.log('Title changed:', text);
                    setNewReminder({ ...newReminder, title: text });
                  }}
                />

                <TextInput
                  style={styles.input}
                  placeholder={`Due date (${selectedDate || 'YYYY-MM-DD'})`}
                  placeholderTextColor={colors.textSecondary}
                  value={newReminder.dueDate}
                  onChangeText={(text) => {
                    console.log('Due date changed:', text);
                    setNewReminder({ ...newReminder, dueDate: text });
                  }}
                />
              </>
            )}

            <TouchableOpacity 
              style={[styles.addButton, saving && styles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>
                  {addItemType === 'event' && 'Add Event'}
                  {addItemType === 'goal' && 'Add Goal'}
                  {addItemType === 'reminder' && 'Add Reminder'}
                </Text>
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
    paddingBottom: 160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 8,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  calendarContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  calendar: {
    borderRadius: 0,
  },
  eventsSection: {
    paddingHorizontal: 20,
  },
  eventCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    marginRight: 16,
    minWidth: 70,
  },
  eventTimeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  eventContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventIconText: {
    fontSize: 24,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
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
    bottom: 140,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    minHeight: 400,
  },
  typeSelectionModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '70%',
  },
  dateDetailsModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    fontWeight: '700',
    color: colors.text,
  },
  typeOptionsContainer: {
    gap: 16,
  },
  typeOptionCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  typeOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeOptionEmoji: {
    fontSize: 32,
  },
  typeOptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  typeOptionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  detailCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailIconText: {
    fontSize: 24,
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
    color: colors.textSecondary,
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
    color: colors.mint,
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
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonActive: {
    borderColor: 'transparent',
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
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
