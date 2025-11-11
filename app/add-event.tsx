// app/add-event.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import type { EventItem } from '@/components/SwipeableEventCard';

export default function AddEventScreen() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [endDate, setendDate] = useState(() => {
    const d = new Date();      // 当前时间
    d.setHours(d.getHours() + 1); // 加一小时
    return d;
  });

  const handleAdd = async () => {
    const now = new Date();
    if (date < now) {
      alert('❌ You can not add the time that passed');
      return;
    }
    if (endDate <= date) {
      alert('The end time must be later than the start time');
      return;
    }

    // 计算提醒时间（事件开始前10分钟）
    const triggerDate = new Date(date);

    // 调度通知
    let notificationId: string | undefined;
    try {
      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📌 ${title}`,
          body: `Your event start on ${new Date(date).toLocaleTimeString()}`,
          sound: true,
        },
        trigger: triggerDate as any
      });
    } catch (e) {
      console.warn('⚠️ Unable to schedule notification:', e);
    }


     const newEvent: EventItem = {
      id: Date.now().toString(),
      title,
      note,
      location,
      date: date.toISOString(),
      endDate: endDate.toISOString(),
      notificationId,
      type: 'event',
      completed: false,
    };

    try {
      const stored = await AsyncStorage.getItem('events');
      const eventList: EventItem[] = stored ? JSON.parse(stored) : [];
      eventList.push(newEvent);
      await AsyncStorage.setItem('events', JSON.stringify(eventList));
      router.back();
    } catch (e) {
      alert('❌ Storage failed, please try again');
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter title" />

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={note}
        onChangeText={setNote}
        placeholder="Enter note"
        multiline
      />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Enter location" />

      <Text style={styles.label}>Start Date Time</Text>
      <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={(_, selectedTime) => {
            if (selectedTime) setDate(selectedTime);
          }}
        />

      <Text style={styles.label}>End Date Time</Text>
      <DateTimePicker
          value={endDate}
          mode="datetime"
          display="default"
          onChange={(_, selectedTime) => {
            if (selectedTime) setendDate(selectedTime);
          }}
        />

      <View style={styles.buttonContainer}>
        <Button title="Save" onPress={handleAdd} />
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
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 30,
  },
});

