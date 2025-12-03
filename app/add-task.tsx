import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddTaskScreen() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState(1); // 1=Low, 2=Medium, 3=High
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return d;
  });

  const handleAdd = async () => {
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    const now = new Date();
    if (dueDate < now) {
      alert("Due date cannot be in the past");
      return;
    }

    let notificationId: string | undefined;
    try {
      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Task due: ${title}`,
          body: note || "Your task is due soon.",
          sound: true,
        },
        trigger: dueDate as any,
      });
    } catch (e) {
      console.warn("Unable to schedule notification:", e);
    }

    const newTask = {
      id: Date.now().toString(),
      title,
      note,
      location,
      priority,
      date: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      completed: false,
      type: "task",
      notificationId,
    };

    try {
      const stored = await AsyncStorage.getItem("events");
      const list = stored ? JSON.parse(stored) : [];
      list.push(newTask);
      await AsyncStorage.setItem("events", JSON.stringify(list));
      router.back();
    } catch (err) {
      console.error("Error saving task:", err);
      alert("Failed to save task.");
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Task",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingHorizontal: 11, paddingVertical: 4  }}
            >
              <Ionicons name="arrow-back" size={24} color="#00C853" style={{ marginLeft: -4 }}/>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.iconSquare}>
            <Ionicons name="checkbox" size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Create New Task</Text>
          <Text style={styles.headerSubtitle}>Add a task to your list</Text>
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
            <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Add notes (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
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
            onChange={(_, selected) => {
              if (selected) setDueDate(selected);
            }}
            style={styles.datePicker}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Save Task</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

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
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
