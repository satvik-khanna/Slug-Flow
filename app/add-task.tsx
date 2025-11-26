// app/add-task.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function AddTaskScreen() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');

  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleAdd = async () => {
  if (!title.trim()) {
    alert('⚠️ Please enter a task title');
    return;
  }

  const now = new Date();
  if (dueDate < now) {
    alert('⚠️ Due date cannot be in the past');
    return;
  }

  // First, schedule a notification based on the task deadline.
  let notificationId: string | undefined;
  try {
    notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📝 Task due: ${title}`,
        body: note ? note : 'Your task is due soon.',
        sound: true,
      },
      trigger: dueDate as any, // Deadline reminder
    });
  } catch (e) {
    console.warn('Unable to schedule task notification:', e);
  }

  // Reconstruct the task object to be saved.
  const newTask = {
    id: Date.now().toString(),
    title,
    note,
    location,
    date: new Date().toISOString(),   // Start date
    dueDate: dueDate.toISOString(),   // Due date
    completed: false,
    type: 'task',
    notificationId,                   // Save the notification ID along with the notification.
  };

  try {
    const stored = await AsyncStorage.getItem('events');
    const taskList = stored ? JSON.parse(stored) : [];

    taskList.push(newTask);
    await AsyncStorage.setItem('events', JSON.stringify(taskList));
    router.back();
  } catch (e) {
    alert('❌ Failed to save task.');
    console.error('Error saving task:', e);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.label}>Task Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter task title"
      />

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={note}
        onChangeText={setNote}
        placeholder="Enter note"
        multiline
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Enter location (optional)"
      />

      {/* Due Date Picker */}
      <Text style={styles.label}>Due Date</Text>

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowPicker(true)}
      >
        <Text>{dueDate.toDateString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dueDate}
          mode="datetime"
          display='default'
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDueDate(selectedDate);
          }}
        />
      )}

      <View style={{ marginTop: 30 }}>
        <Button title="💾 Save Task" onPress={handleAdd} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
});
