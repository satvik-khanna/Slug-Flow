import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
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
import { Ionicons } from '@expo/vector-icons';

import { EventItem } from '../../components/SwipeableEventCard';

/* -------------------------------------------------------
   Task Type With Priority
------------------------------------------------------- */
export type TaskItem = EventItem & {
  type: "task";
  dueDate: string;
  priority?: number;
};

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
          priority: item.priority ?? 1,
          type: "task",
        }));

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
     Task Lists
  ------------------------------------------------------- */
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const displayedTasks =
    filter === 'incomplete'
      ? [...incompleteTasks].sort((a, b) => {
          if ((b.priority || 1) !== (a.priority || 1)) return (b.priority || 1) - (a.priority || 1);
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
      : [...completedTasks].sort((a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );

  const getPriorityLabel = (priority?: number) => {
    if (!priority || priority === 1) return 'Low';
    if (priority === 2) return 'Medium';
    return 'High';
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority || priority === 1) return '#4CAF50';
    if (priority === 2) return '#FF9800';
    return '#F44336';
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.iconSquare}>
                <Ionicons name="checkbox" size={28} color="#fff" />
              </View>
              <Text style={styles.headerTitle}>My Tasks</Text>
            </View>
            <Text style={styles.headerSubtitle}>Organize your work</Text>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                filter === 'incomplete' && styles.tabActive,
              ]}
              onPress={() => setFilter('incomplete')}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === 'incomplete' && styles.tabTextActive,
                ]}
              >
                Incomplete ({incompleteTasks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                filter === 'completed' && styles.tabActive,
              ]}
              onPress={() => setFilter('completed')}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === 'completed' && styles.tabTextActive,
                ]}
              >
                Completed ({completedTasks.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Message */}
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              {filter === 'incomplete' ? (
                <>
                  You still have{' '}
                  <Text style={styles.statusNumber}>{incompleteTasks.length}</Text>{' '}
                  task{incompleteTasks.length === 1 ? '' : 's'} to do.
                </>
              ) : (
                <>
                  You have completed{' '}
                  <Text style={styles.statusNumber}>{completedTasks.length}</Text>{' '}
                  task{completedTasks.length === 1 ? '' : 's'}.
                </>
              )}
            </Text>
          </View>

          {/* Task List */}
          {displayedTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filter === 'incomplete'
                  ? 'No incomplete tasks'
                  : 'No completed tasks yet'}
              </Text>
            </View>
          ) : (
            displayedTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => handleToggleComplete(task.id)}
                >
                  <Ionicons
                    name={task.completed ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={task.completed ? '#00C853' : '#999'}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                    {task.title}
                  </Text>

                  <View style={styles.taskMeta}>
                    <View style={styles.priorityContainer}>
                      <Ionicons name="flag" size={16} color={getPriorityColor(task.priority)} />
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                      <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                        {getPriorityLabel(task.priority)}
                      </Text>
                    </View>

                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.dateText}>{formatDueDate(task.dueDate)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Add Task Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-task')}
          >
            <Text style={styles.addButtonText}>+ Add New Task</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

/* -------------------------------------------------------
   Styles
------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconSquare: {
    width: 40,
    height: 40,
    backgroundColor: '#00C853',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00C853',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 52,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabActive: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  statusNumber: {
    color: '#00C853',
    fontWeight: 'bold',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkbox: {
    marginRight: 12,
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  addButton: {
    backgroundColor: '#00C853',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
