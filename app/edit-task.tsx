import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type TaskItem = {
  id: string;
  title: string;
  note?: string;
  location?: string;
  priority: number;
  date: string;
  dueDate: string;
  completed: boolean;
  type: 'task';
  notificationId?: string;
};

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState(1);

  const [dueDate, setDueDate] = useState(new Date());

  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  /* -----------------------------------------
     Load task from AsyncStorage
  ----------------------------------------- */
  useEffect(() => {
    const loadTask = async () => {
      try {
        const stored = await AsyncStorage.getItem('events');
        const list: TaskItem[] = stored ? JSON.parse(stored) : [];

        const task = list.find((t) => t.id === id);
        if (!task) {
          Alert.alert('Not Found', 'This task may have been deleted.');
          router.back();
          return;
        }

        setTitle(task.title);
        setNote(task.note || '');
        setLocation(task.location || '');
        setPriority(task.priority ?? 1);
        setDueDate(new Date(task.dueDate));
        setCompleted(!!task.completed);

        setLoading(false);
      } catch (err) {
        console.error('Failed to load task:', err);
      }
    };

    loadTask();
  }, [id]);

  if (loading) return <Text style={{ padding: 20 }}>Loading…</Text>;

  /* -----------------------------------------
     Save changes
  ----------------------------------------- */
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    if (dueDate < new Date()) {
      alert('Due date cannot be in the past');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('events');
      const list: TaskItem[] = stored ? JSON.parse(stored) : [];

      const updated = list.map((item) =>
        item.id === id
          ? {
              ...item,
              title,
              note,
              location,
              priority,
              dueDate: dueDate.toISOString(),
              completed,
            }
          : item
      );

      await AsyncStorage.setItem('events', JSON.stringify(updated));
      router.back();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save task.');
    }
  };

  /* -----------------------------------------
     Toggle complete
  ----------------------------------------- */
  const handleToggleComplete = async () => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const list: TaskItem[] = stored ? JSON.parse(stored) : [];

      const updated = list.map((item) =>
        item.id === id ? { ...item, completed: !completed } : item
      );

      await AsyncStorage.setItem('events', JSON.stringify(updated));
      setCompleted((prev) => !prev);
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  /* -----------------------------------------
     Delete task
  ----------------------------------------- */
  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem('events');
              const list: TaskItem[] = stored ? JSON.parse(stored) : [];

              const target = list.find((t) => t.id === id);

              if (target?.notificationId) {
                await Notifications.cancelScheduledNotificationAsync(
                  target.notificationId
                );
              }

              const filtered = list.filter((t) => t.id !== id);
              await AsyncStorage.setItem('events', JSON.stringify(filtered));

              router.back();
            } catch (err) {
              console.error('Delete failed:', err);
              alert('Failed to delete task.');
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (date: Date) =>
    date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Task',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingHorizontal: 11, paddingVertical: 4 }}
            >
              <Ionicons name="arrow-back" size={24} color="#00C853" style={{ marginLeft: -4 }}/>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 200 }} style={styles.container}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.iconSquare}>
            <Ionicons name="checkbox" size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Edit Task</Text>
          <Text style={styles.headerSubtitle}>Update your task details</Text>
        </View>

        {/* Task Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Task Details</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="text-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Task title"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Add notes (optional)"
              placeholderTextColor="#999"
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Location (optional)"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Priority Card */}
        <View style={styles.card}>
          <View style={styles.priorityHeader}>
            <Ionicons name="flag" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Priority</Text>
          </View>

          <View style={styles.priorityButtons}>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === 1 && styles.priorityButtonActiveLow,
              ]}
              onPress={() => setPriority(1)}
            >
              <Text
                style={[
                  styles.priorityButtonText,
                  priority === 1 && styles.priorityButtonTextActive,
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === 2 && styles.priorityButtonActiveMedium,
              ]}
              onPress={() => setPriority(2)}
            >
              <Text
                style={[
                  styles.priorityButtonText,
                  priority === 2 && styles.priorityButtonTextActive,
                ]}
              >
                Medium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === 3 && styles.priorityButtonActiveHigh,
              ]}
              onPress={() => setPriority(3)}
            >
              <Text
                style={[
                  styles.priorityButtonText,
                  priority === 3 && styles.priorityButtonTextActive,
                ]}
              >
                High
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Due Date Card */}
        <View style={styles.card}>
          <View style={styles.dateHeader}>
            <Ionicons name="time-outline" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Due Date</Text>
          </View>

          <View style={styles.dateTimePickerContainer}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.dateTimeText}>{formatDateTime(dueDate)}</Text>
          </View>

          <DateTimePicker
            value={dueDate}
            mode="datetime"
            display="default"
            onChange={(_, selected) => selected && setDueDate(selected)}
            style={styles.datePicker}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: completed ? '#FF9800' : '#4CAF50' }]}
          onPress={handleToggleComplete}
        >
          <Ionicons
            name={completed ? 'arrow-undo' : 'checkmark-circle'}
            size={22}
            color="#fff"
          />
          <Text style={styles.actionButtonText}>
            {completed ? 'Mark Incomplete' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#00C853' }]} onPress={handleSave}>
          <Ionicons name="save" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F44336' }]} onPress={handleDelete}>
          <Ionicons name="trash" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>Delete Task</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

/* -----------------------------------------
   Styles (copied + extended from Add Task)
------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  headerCard: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },

  iconSquare: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },

  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  priorityButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },

  priorityButtonActiveLow: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },

  priorityButtonActiveMedium: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },

  priorityButtonActiveHigh: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },

  priorityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },

  priorityButtonTextActive: {
    color: '#fff',
  },

  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  dateTimePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  dateTimeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },

  datePicker: {
    alignSelf: 'flex-start',
  },

  actionButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },

  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
