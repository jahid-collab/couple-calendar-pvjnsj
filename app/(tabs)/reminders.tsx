
import React, { useState } from 'react';
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
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { mockReminders } from '@/data/mockData';
import { Reminder } from '@/types/Event';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    dueDate: '',
  });

  const handleAddReminder = () => {
    if (!newReminder.title) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      completed: false,
      dueDate: newReminder.dueDate,
      shared: true,
    };

    setReminders([...reminders, reminder]);
    setShowAddModal(false);
    setNewReminder({ title: '', dueDate: '' });
    Alert.alert('Success', 'Reminder added successfully!');
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(reminder => 
      reminder.id === id 
        ? { ...reminder, completed: !reminder.completed }
        : reminder
    ));
  };

  const deleteReminder = (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setReminders(reminders.filter(r => r.id !== id))
        },
      ]
    );
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => setShowAddModal(true)}
      style={styles.headerButton}
    >
      <IconSymbol name="plus" color={colors.primary} size={24} />
    </Pressable>
  );

  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Reminders',
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
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{activeReminders.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completedReminders.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reminders.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {activeReminders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Reminders</Text>
              {activeReminders.map(reminder => (
                <View key={reminder.id} style={styles.reminderCard}>
                  <Pressable 
                    style={styles.checkboxContainer}
                    onPress={() => toggleReminder(reminder.id)}
                  >
                    <View style={[
                      styles.checkbox,
                      reminder.completed && styles.checkboxChecked
                    ]}>
                      {reminder.completed && (
                        <IconSymbol name="checkmark" color="#FFFFFF" size={16} />
                      )}
                    </View>
                  </Pressable>

                  <View style={styles.reminderContent}>
                    <Text style={[
                      styles.reminderTitle,
                      reminder.completed && styles.reminderTitleCompleted
                    ]}>
                      {reminder.title}
                    </Text>
                    {reminder.dueDate && (
                      <View style={styles.dueDateContainer}>
                        <IconSymbol name="calendar" color={colors.primary} size={14} />
                        <Text style={styles.dueDate}>
                          {new Date(reminder.dueDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric' 
                          })}
                        </Text>
                      </View>
                    )}
                    {reminder.shared && (
                      <View style={styles.sharedBadge}>
                        <IconSymbol name="person.2.fill" color={colors.secondary} size={12} />
                        <Text style={styles.sharedText}>Shared</Text>
                      </View>
                    )}
                  </View>

                  <Pressable 
                    style={styles.deleteButton}
                    onPress={() => deleteReminder(reminder.id)}
                  >
                    <IconSymbol name="trash" color={colors.textSecondary} size={20} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {completedReminders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completed</Text>
              {completedReminders.map(reminder => (
                <View key={reminder.id} style={styles.reminderCard}>
                  <Pressable 
                    style={styles.checkboxContainer}
                    onPress={() => toggleReminder(reminder.id)}
                  >
                    <View style={[
                      styles.checkbox,
                      reminder.completed && styles.checkboxChecked
                    ]}>
                      {reminder.completed && (
                        <IconSymbol name="checkmark" color="#FFFFFF" size={16} />
                      )}
                    </View>
                  </Pressable>

                  <View style={styles.reminderContent}>
                    <Text style={[
                      styles.reminderTitle,
                      reminder.completed && styles.reminderTitleCompleted
                    ]}>
                      {reminder.title}
                    </Text>
                    {reminder.dueDate && (
                      <View style={styles.dueDateContainer}>
                        <IconSymbol name="calendar" color={colors.textSecondary} size={14} />
                        <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
                          {new Date(reminder.dueDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric' 
                          })}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Pressable 
                    style={styles.deleteButton}
                    onPress={() => deleteReminder(reminder.id)}
                  >
                    <IconSymbol name="trash" color={colors.textSecondary} size={20} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {reminders.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="checklist" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyText}>No reminders yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first reminder</Text>
            </View>
          )}
        </ScrollView>

        {Platform.OS !== 'ios' && (
          <Pressable
            style={styles.floatingButton}
            onPress={() => setShowAddModal(true)}
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
              <Text style={styles.modalTitle}>Add Reminder</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="What do you need to remember?"
              placeholderTextColor={colors.textSecondary}
              value={newReminder.title}
              onChangeText={(text) => setNewReminder({ ...newReminder, title: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Due date (optional, YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              value={newReminder.dueDate}
              onChangeText={(text) => setNewReminder({ ...newReminder, dueDate: text })}
            />

            <Pressable style={styles.addButton} onPress={handleAddReminder}>
              <Text style={styles.addButtonText}>Add Reminder</Text>
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
    padding: 16,
    paddingBottom: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  reminderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reminderTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  sharedText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
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
    minHeight: 300,
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
