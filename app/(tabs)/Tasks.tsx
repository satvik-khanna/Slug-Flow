// app/(tabs)/Tasks.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import SwipeableEventCard, { EventItem } from '../../components/SwipeableEventCard';

/* -------------------------------------------------------
   Task Type With Priority
------------------------------------------------------- */
export type TaskItem = EventItem & {
  type: "task";
  dueDate: string;
  priority: number; // ✔ NEW FIELD
};

/* -------------------------------------------------------
   Pick Recommended Task
------------------------------------------------------- */
function getRecommendedTask(tasks: TaskItem[]) {
  const incomplete = tasks.filter((t) => !t.completed);
  if (incomplete.length === 0) return null;

  const todayISO = new Date().toISOString().slice(0, 10);

  // Tasks due today → highest priority → earliest time
  const dueToday = incomplete.filter(
    (t) => t.dueDate.slice(0, 10) === todayISO
  );

  if (dueToday.length > 0) {
    return dueToday.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })[0];
  }

  // GENERAL CASE:
  // highest priority → earliest due date
  return incomplete.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];
}

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<'incomplete' | 'completed'>('incomplete');

  /* -------------------------------------------------------
     Load tasks
  ------------------------------------------------------- */
  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

      const filtered: TaskItem[] = parsed
        .filter((item: any) => item.type === 'task')
        .map((item: any) => ({
          ...item,
          completed: !!item.completed,
          priority: item.priority ?? 1, // default if missing
          type: "task",
        }));

      // Sort by due date for display
      filtered.sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

      setTasks(filtered);
    } catch (err) {
      console.log('Error loading tasks:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  /* -------------------------------------------------------
     Toggle completion
  ------------------------------------------------------- */
  const handleToggleComplete = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );

    try {
      const stored = await AsyncStorage.getItem('events');
      const allItems = stored ? JSON.parse(stored) : [];

      const updated = allItems.map((item: any) =>
        item.id === taskId && item.type === "task"
          ? { ...item, completed: !item.completed }
          : item
      );

      await AsyncStorage.setItem('events', JSON.stringify(updated));
    } catch (err) {
      console.log('Error toggling task:', err);
    }
  };

  /* -------------------------------------------------------
     Delete task
  ------------------------------------------------------- */
  const handleDeleteTask = async (taskId: string) => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const allItems = stored ? JSON.parse(stored) : [];

      const filtered = allItems.filter((item: any) => item.id !== taskId);

      await AsyncStorage.setItem('events', JSON.stringify(filtered));
      loadTasks();
    } catch (err) {
      console.log('Error deleting task:', err);
    }
  };

  /* -------------------------------------------------------
     Task Lists
  ------------------------------------------------------- */
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const displayedTasks =
    filter === 'incomplete'
      ? [...incompleteTasks].sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
      : [...completedTasks].sort((a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );


  /* -------------------------------------------------------
     Recommended Task
  ------------------------------------------------------- */
  const recommended = getRecommendedTask(tasks);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>📝 My Tasks</Text>

          {/* Recommended Task */}
          {recommended && (
            <View style={styles.recoCard}>
              <Text style={styles.recoTitle}>Recommended Task</Text>
              <Text style={styles.recoName}>Finish {recommended.title}</Text>
              <Text style={styles.recoMeta}>
                Priority: {recommended.priority} • Due:{" "}
                {new Date(recommended.dueDate).toLocaleString()}
              </Text>
            </View>
          )}

          {/* Filter buttons */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                filter === 'incomplete' && styles.toggleButtonActive,
              ]}
              onPress={() => setFilter('incomplete')}
            >
              <Text
                style={[
                  styles.toggleText,
                  filter === 'incomplete' && styles.toggleTextActive,
                ]}
              >
                Incomplete ({incompleteTasks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                filter === 'completed' && styles.toggleButtonActive,
              ]}
              onPress={() => setFilter('completed')}
            >
              <Text
                style={[
                  styles.toggleText,
                  filter === 'completed' && styles.toggleTextActive,
                ]}
              >
                Completed ({completedTasks.length})
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {filter === 'incomplete'
              ? `You still have ${incompleteTasks.length} task${
                  incompleteTasks.length === 1 ? '' : 's'
                } to do.`
              : `You have completed ${completedTasks.length} task${
                  completedTasks.length === 1 ? '' : 's'
                }.`}
          </Text>

          {/* Task list */}
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {displayedTasks.length === 0 ? (
              <Text style={styles.empty}>
                {filter === 'incomplete'
                  ? 'No incomplete tasks.'
                  : 'No completed tasks yet.'}
              </Text>
            ) : (
              displayedTasks.map((task) => (
                <SwipeableEventCard
                  key={task.id}
                  event={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

/* -------------------------------------------------------
   Styles
------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12 },

  /* Recommended Task */
  recoCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fffbe6",
    borderWidth: 1,
    borderColor: "#f1e2a5",
    marginBottom: 20,
  },
  recoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: "#b8860b",
  },
  recoName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  recoMeta: {
    fontSize: 14,
    color: "#555",
  },

  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  toggleText: { fontSize: 14, color: '#333', fontWeight: '500' },
  toggleTextActive: { color: '#fff', fontWeight: '700' },

  empty: { marginTop: 40, fontSize: 16, color: '#777', textAlign: 'center' },
});
