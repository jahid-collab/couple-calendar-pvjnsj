
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
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';
import { useReminders } from '@/hooks/useReminders';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375;

export default function RemindersScreen() {
  const { user } = useAuth();
  const { couple } = useCouple(user?.id);
  const { reminders, loading, addReminder, toggleReminder, deleteReminder: deleteReminderFromDb } = useReminders(couple?.id);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    dueDate: '',
  });

  const handleAddReminder = async () => {
    console.log('=== handleAddReminder called ===');
    console.log('newReminder:', newReminder);
    console.log('user:', user);
    console.log('couple:', couple);

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
          dueDate: newReminder.dueDate || undefined,
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

  const handleToggleReminder = async (id: string, completed: boolean) => {
    try {
      await toggleReminder(id, !completed);
    } catch (error: any) {
      console.error('Error toggling reminder:', error);
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const handleDeleteReminder = (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminderFromDb(id);
            } catch (error: any) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          }
        },
      ]
    );
  };

  const handleOpenModal = () => {
    console.log('=== handleOpenModal called ===');
    console.log('couple:', couple);
    console.log('user:', user);
    
    if (!couple) {
      Alert.alert('Connect with Partner', 'Please connect with your partner first to add reminders');
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
      <IconSymbol name="plus" color={colors.lavender} size={26} />
    </TouchableOpacity>
  );

  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading reminders...</Text>
      </View>
    );
  }

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
                    onPress={() => handleToggleReminder(reminder.id, reminder.completed)}
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
                        <IconSymbol name="calendar" color={colors.lavender} size={14} />
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
                    onPress={() => handleDeleteReminder(reminder.id)}
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
                    onPress={() => handleToggleReminder(reminder.id, reminder.completed)}
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
                    onPress={() => handleDeleteReminder(reminder.id)}
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
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleOpenModal}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" color="#FFFFFF" size={30} />
          </TouchableOpacity>
        )}
      </View>

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
              <Text style={styles.modalTitle}>Add Reminder</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

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
              placeholder="Due date (optional, YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              value={newReminder.dueDate}
              onChangeText={(text) => {
                console.log('Due date changed:', text);
                setNewReminder({ ...newReminder, dueDate: text });
              }}
            />

            <TouchableOpacity 
              style={[styles.addButton, saving && styles.buttonDisabled]} 
              onPress={handleAddReminder}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>Add Reminder</Text>
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
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 16,
    paddingBottom: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 180,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: isSmallScreen ? 16 : 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    minHeight: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: isSmallScreen ? 28 : 36,
    fontWeight: 'bold',
    color: colors.lavender,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  reminderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
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
    backgroundColor: colors.lavender,
    borderColor: colors.lavender,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: isSmallScreen ? 14 : 16,
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
    color: colors.lavender,
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
    marginRight: 8,
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
    zIndex: 9999,
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
    backgroundColor: colors.lavender,
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
