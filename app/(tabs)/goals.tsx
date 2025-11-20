
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
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Goal } from '@/types/Event';
import Svg, { Circle, G } from 'react-native-svg';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';
import { useGoals } from '@/hooks/useGoals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375;

export default function GoalsScreen() {
  const { user } = useAuth();
  const { couple } = useCouple(user?.id);
  const { goals, loading, addGoal, updateGoalProgress } = useGoals(couple?.id);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
  });

  const handleAddGoal = async () => {
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

    try {
      const goalColors = ['#E91E63', '#9C27B0', '#F48FB1', '#FFD180'];
      const goal: Omit<Goal, 'id' | 'progress'> = {
        title: newGoal.title,
        description: newGoal.description,
        targetDate: newGoal.targetDate || undefined,
        color: goalColors[Math.floor(Math.random() * goalColors.length)],
        emoji: '🎯',
      };

      console.log('Adding goal:', goal);
      await addGoal(goal, user.id);
      
      setShowAddModal(false);
      setNewGoal({ title: '', description: '', targetDate: '' });
      Alert.alert('Success', 'Goal added successfully!');
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal. Please try again.');
    }
  };

  const updateProgress = async (id: string, increment: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const newProgress = Math.max(0, Math.min(100, goal.progress + increment));
    
    try {
      await updateGoalProgress(id, newProgress);
    } catch (error) {
      console.error('Error updating goal progress:', error);
      Alert.alert('Error', 'Failed to update progress. Please try again.');
    }
  };

  const handleOpenModal = () => {
    console.log('=== handleOpenModal called ===');
    console.log('couple:', couple);
    console.log('user:', user);
    
    if (!couple) {
      Alert.alert('Connect with Partner', 'Please connect with your partner first to add goals');
      return;
    }
    console.log('Opening modal...');
    setShowAddModal(true);
  };

  const ProgressCircle = ({ progress, size = 120, color }: { progress: number; size?: number; color: string }) => {
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.progressCircleContainer}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.background}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>
    );
  };

  const overallProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading goals...</Text>
      </View>
    );
  }

  if (!couple) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: 'Shared Goals',
            }}
          />
        )}
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 10 }]}>Connect with Your Partner</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            You need to be connected with a partner to create shared goals. Go to the Profile tab to send or accept an invitation.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Shared Goals',
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
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Our Journey Together</Text>
            <View style={styles.overallProgressCard}>
              <ProgressCircle 
                progress={overallProgress} 
                size={isSmallScreen ? 120 : 140} 
                color={colors.lavender} 
              />
              <View style={styles.overallProgressInfo}>
                <Text style={styles.overallProgressLabel}>Overall Progress</Text>
                <Text style={styles.overallProgressText}>{overallProgress}%</Text>
                <Text style={styles.goalsCount}>{goals.length} Active Goals</Text>
              </View>
            </View>
          </View>

          {/* Add Button */}
          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleOpenModal}
              activeOpacity={0.8}
            >
              <IconSymbol name="plus" color="#FFFFFF" size={20} />
              <Text style={styles.addButtonText}>Add Goal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            {goals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No goals yet. Tap the Add Goal button to create your first goal!</Text>
              </View>
            ) : (
              goals.map(goal => (
                <View key={goal.id} style={[styles.goalCard, { borderLeftColor: goal.color }]}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalEmoji}>{goal.emoji || '🎯'}</Text>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalDescription}>{goal.description}</Text>
                      {goal.targetDate && (
                        <Text style={styles.goalDate}>
                          Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric' 
                          })}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { width: `${goal.progress}%`, backgroundColor: goal.color }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressLabel}>{goal.progress}%</Text>
                  </View>

                  <View style={styles.goalActions}>
                    <Pressable 
                      style={[styles.actionButton, { backgroundColor: colors.background }]}
                      onPress={() => updateProgress(goal.id, -5)}
                    >
                      <IconSymbol name="minus" color={colors.text} size={16} />
                    </Pressable>
                    <Pressable 
                      style={[styles.actionButton, { backgroundColor: goal.color }]}
                      onPress={() => updateProgress(goal.id, 5)}
                    >
                      <IconSymbol name="plus" color="#FFFFFF" size={16} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
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
              <Text style={styles.modalTitle}>Add Goal</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </Pressable>
            </View>

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
              placeholder="Target date (optional, YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              value={newGoal.targetDate}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetDate: text })}
            />

            <Pressable style={styles.submitButton} onPress={handleAddGoal}>
              <Text style={styles.submitButtonText}>Add Goal</Text>
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
    paddingTop: Platform.OS === 'android' ? 60 : 0,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  headerSection: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 16,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 22 : 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  overallProgressCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: isSmallScreen ? 20 : 28,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  progressCircleContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  overallProgressInfo: {
    alignItems: 'center',
  },
  overallProgressLabel: {
    fontSize: isSmallScreen ? 14 : 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  overallProgressText: {
    fontSize: isSmallScreen ? 32 : 36,
    fontWeight: 'bold',
    color: colors.lavender,
    marginBottom: 8,
  },
  goalsCount: {
    fontSize: isSmallScreen ? 12 : 14,
    color: colors.textSecondary,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: colors.lavender,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  goalHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  goalEmoji: {
    fontSize: isSmallScreen ? 32 : 40,
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  goalDescription: {
    fontSize: isSmallScreen ? 13 : 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  goalDate: {
    fontSize: 12,
    color: colors.lavender,
    fontWeight: '600',
    marginTop: 4,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  submitButton: {
    backgroundColor: colors.lavender,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
