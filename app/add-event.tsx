// app/add-event.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import { Button, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { EventItem } from '@/components/SwipeableEventCard';

/* -------------------------------------------------------
   Local PST ISO helper
-------------------------------------------------------- */
function toLocalISOString(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 19);
}

export default function AddEventScreen() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });

  const handleAdd = async () => {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    const now = new Date();
    if (date < now) {
      alert('You cannot add a time that has already passed.');
      return;
    }
    if (endDate <= date) {
      alert('The end time must be later than the start time.');
      return;
    }

    // Expo trigger
    const trigger = {
      type: "date",
      date: date.getTime(),
    } as Notifications.DateTriggerInput;

    let notificationId: string | undefined;
    try {
      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📌 ${title}`,
          body: `Your event starts at ${date.toLocaleTimeString()}`,
          sound: true,
        },
        trigger,
      });
    } catch (e) {
      console.warn("Unable to schedule notification:", e);
    }

    const newEvent: EventItem = {
      id: Date.now().toString(),
      title,
      note,
      location,
      date: toLocalISOString(date),
      endDate: toLocalISOString(endDate),
      notificationId,
      type: "event",
      completed: false,
    };

    try {
      const stored = await AsyncStorage.getItem("events");
      const eventList: EventItem[] = stored ? JSON.parse(stored) : [];
      eventList.push(newEvent);
      await AsyncStorage.setItem("events", JSON.stringify(eventList));
      router.back();
    } catch (e) {
      alert("Storage failed, please try again.");
      console.error(e);
    }
  };

  return (
    <>
      {/* MATCHING BACK BUTTON (same as Add Task) */}
      <Stack.Screen
        options={{
          title: "Add Event",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: 12 }}
            >
              <Text style={{ fontSize: 17, fontWeight: "600", color: "#007AFF" }}>
                Back
              </Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.container}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter title"
        />

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
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
          placeholder="Enter location"
        />

        <Text style={styles.label}>Start Date & Time</Text>
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={(_, selected) => {
            if (selected) setDate(selected);
          }}
        />

        <Text style={styles.label}>End Date & Time</Text>
        <DateTimePicker
          value={endDate}
          mode="datetime"
          display="default"
          onChange={(_, selected) => {
            if (selected) setEndDate(selected);
          }}
        />

        <View style={styles.buttonContainer}>
          <Button title="Save" onPress={handleAdd} />
        </View>
      </View>
    </>
  );
}

/* -------------------------------------------------------
   Styles
-------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    marginTop: 35,
  },
});
