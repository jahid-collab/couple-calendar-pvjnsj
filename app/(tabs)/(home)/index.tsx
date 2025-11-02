
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
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { mockEvents } from '@/data/mockData';
import { Event } from '@/types/Event';
import { useTheme } from '@react-navigation/native';

export default function CalendarScreen() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'date' as Event['type'],
    description: '',
  });

  const markedDates = events.reduce((acc, event) => {
    acc[event.date] = {
      marked: true,
      dotColor: event.color,
      selected: event.date === selectedDate,
      selectedColor: colors.accent,
    };
    return acc;
  }, {} as any);

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: colors.accent,
    };
  }

  const selectedEvents = events.filter(e => e.date === selectedDate);

  const handleAddEvent = () => {
    if (!newEvent.title || !selectedDate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const eventColors = {
      vacation: '#FFD180',
      date: '#E91E63',
      trip: '#9C27B0',
      event: '#F48FB1',
    };

    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: selectedDate,
      type: newEvent.type,
      description: newEvent.description,
      color: eventColors[newEvent.type],
    };

    setEvents([...events, event]);
    setShowAddModal(false);
    setNewEvent({ title: '', type: 'date', description: '' });
    Alert.alert('Success', 'Event added successfully!');
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => {
        if (!selectedDate) {
          Alert.alert('Select a Date', 'Please select a date first to add an event');
          return;
        }
        setShowAddModal(true);
      }}
      style={styles.headerButton}
    >
      <IconSymbol name="plus" color={colors.primary} size={24} />
    </Pressable>
  );

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
              onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
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

          {selectedDate && (
            <View style={styles.eventsSection}>
              <Text style={styles.sectionTitle}>
                Events on {new Date(selectedDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric' 
                })}
              </Text>
              
              {selectedEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol name="calendar.badge.plus" color={colors.textSecondary} size={48} />
                  <Text style={styles.emptyText}>No events on this day</Text>
                  <Text style={styles.emptySubtext}>Tap + to add an event</Text>
                </View>
              ) : (
                selectedEvents.map(event => (
                  <View key={event.id} style={[styles.eventCard, { borderLeftColor: event.color }]}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventEmoji}>{event.emoji || '📅'}</Text>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventType}>{event.type.toUpperCase()}</Text>
                      </View>
                    </View>
                    {event.description && (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {events
              .filter(e => new Date(e.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map(event => (
                <Pressable 
                  key={event.id} 
                  style={[styles.eventCard, { borderLeftColor: event.color }]}
                  onPress={() => setSelectedDate(event.date)}
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
          </View>
        </ScrollView>

        {Platform.OS !== 'ios' && (
          <Pressable
            style={styles.floatingButton}
            onPress={() => {
              if (!selectedDate) {
                Alert.alert('Select a Date', 'Please select a date first to add an event');
                return;
              }
              setShowAddModal(true);
            }}
          >
            <IconSymbol name="plus" color="#FFFFFF" size={28} />
          </Pressable>
        )}
      </View>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Event title"
              placeholderTextColor={colors.textSecondary}
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
            />

            <View style={styles.typeSelector}>
              {(['date', 'vacation', 'trip', 'event'] as const).map(type => (
                <Pressable
                  key={type}
                  style={[
                    styles.typeButton,
                    newEvent.type === type && styles.typeButtonActive
                  ]}
                  onPress={() => setNewEvent({ ...newEvent, type })}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newEvent.type === type && styles.typeButtonTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newEvent.description}
              onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
              multiline
              numberOfLines={3}
            />

            <Pressable style={styles.addButton} onPress={handleAddEvent}>
              <Text style={styles.addButtonText}>Add Event</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  eventsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
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
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
