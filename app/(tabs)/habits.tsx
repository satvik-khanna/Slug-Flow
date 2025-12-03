import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HabitHeatmap from '@/components/HabitHeatmap';

type Habit = {
  id: string;
  name: string;
  timesPerWeek: number;
  endDate?: string;
  months?: number;
  completions: Record<string, number>;
  createdAt: string;
};

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem('habits');
      setHabits(stored ? JSON.parse(stored) : []);
    } catch (err) {
      console.error('Failed loading habits:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadHabits();
    }, [])
  );

  const handleDayPress = async (habitId: string, dateKey: string) => {
    try {
      const stored = await AsyncStorage.getItem('habits');
      const all: Habit[] = stored ? JSON.parse(stored) : [];

      const habitIndex = all.findIndex((h) => h.id === habitId);
      if (habitIndex === -1) return;

      const habit = all[habitIndex];
      const currentCount = habit.completions[dateKey] || 0;

      if (currentCount === 0) {
        habit.completions[dateKey] = 1;
      } else {
        delete habit.completions[dateKey];
      }

      await AsyncStorage.setItem('habits', JSON.stringify(all));
      // Create a new array to trigger React re-render
      setHabits([...all]);
    } catch (err) {
      console.error('Failed to update habit:', err);
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      const stored = await AsyncStorage.getItem('habits');
      const all: Habit[] = stored ? JSON.parse(stored) : [];
      const filtered = all.filter((h) => h.id !== habitId);
      await AsyncStorage.setItem('habits', JSON.stringify(filtered));
      setHabits(filtered);
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const getWeeklyProgress = (habit: Habit) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let completedThisWeek = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      if (habit.completions[dateKey]) {
        completedThisWeek++;
      }
    }

    return { completed: completedThisWeek, target: habit.timesPerWeek };
  };

  const isTodayCompleted = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    return !!habit.completions[today];
  };

  const toggleTodayCompletion = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    handleDayPress(habitId, today);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.iconSquare}>
            <Ionicons name="flame" size={28} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Habits</Text>
        </View>
        <Text style={styles.headerSubtitle}>Build better routines</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Add Habit Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-habit')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Habit</Text>
        </TouchableOpacity>

        {/* Streak Heatmap Card - Always visible */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <View style={styles.streakHeaderLeft}>
              <Ionicons name="flame" size={24} color="#FF6B35" />
              <Text style={styles.streakTitle}>Your Streak</Text>
            </View>
            {habits.length > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakBadgeText}>
                  {habits.length} habit{habits.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.streakSubtitle}>
            {habits.length === 0
              ? 'Add your first habit to start tracking your streak'
              : 'Keep the momentum going!'}
          </Text>
          <View style={styles.heatmapContainer}>
            <HabitHeatmap
              habit={
                habits.length > 0
                  ? habits[0]
                  : {
                      id: 'empty',
                      name: '',
                      timesPerWeek: 0,
                      completions: {},
                      createdAt: new Date().toISOString(),
                    }
              }
              onDayPress={(dateKey) => {
                if (habits.length > 0) {
                  handleDayPress(habits[0].id, dateKey);
                }
              }}
            />
          </View>
        </View>

        {/* Habits List */}
        {habits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="add-circle-outline" size={48} color="#E0E0E0" />
            <Text style={styles.emptyCardTitle}>Ready to build a habit?</Text>
            <Text style={styles.emptyCardSubtitle}>
              Tap the button above to get started
            </Text>
          </View>
        ) : (
          habits.map((habit) => {
            const progress = getWeeklyProgress(habit);
            const progressPercent = (progress.completed / progress.target) * 100;

            return (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitHeader}>
                  <View style={styles.habitTitleRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#00C853" />
                    <Text style={styles.habitName}>{habit.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteHabit(habit.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>

                <View style={styles.habitStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.statText}>
                      {progress.completed}/{progress.target} this week
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          progressPercent >= 100
                            ? '#00C853'
                            : progressPercent >= 50
                            ? '#FF9800'
                            : '#F44336',
                      },
                    ]}
                  />
                </View>

                {/* Log Today Button */}
                <TouchableOpacity
                  style={[
                    styles.logTodayButton,
                    isTodayCompleted(habit) && styles.logTodayButtonCompleted,
                  ]}
                  onPress={() => toggleTodayCompletion(habit.id)}
                >
                  <Ionicons
                    name={isTodayCompleted(habit) ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={24}
                    color={isTodayCompleted(habit) ? '#fff' : '#00C853'}
                  />
                  <Text
                    style={[
                      styles.logTodayText,
                      isTodayCompleted(habit) && styles.logTodayTextCompleted,
                    ]}
                  >
                    {isTodayCompleted(habit) ? 'Completed Today!' : 'Log Today'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 60,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addButton: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  streakCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  streakBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00C853',
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyCardSubtitle: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
  },
  habitCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  deleteButton: {
    padding: 4,
  },
  habitStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  heatmapContainer: {
    marginTop: 8,
  },
  logTodayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#00C853',
  },
  logTodayButtonCompleted: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },
  logTodayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C853',
  },
  logTodayTextCompleted: {
    color: '#fff',
  },
});
