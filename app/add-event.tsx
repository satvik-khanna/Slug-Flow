import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

    const trigger = {
      type: "date",
      date: date.getTime(),
    } as Notifications.DateTriggerInput;

    let notificationId: string | undefined;
    try {
      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${title}`,
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
          title: "Add Event",
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
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#00C853" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar" size={28} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Create New Event</Text>
          <Text style={styles.headerSubtitle}>Fill in the details below</Text>
        </View>

        {/* Event Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Event Details</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="text-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
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

        {/* Date & Time Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Date & Time</Text>

          <View style={styles.dateTimeSection}>
            <View style={styles.dateTimeLabel}>
              <Ionicons name="play-circle-outline" size={20} color="#00C853" />
              <Text style={styles.dateTimeLabelText}>Start</Text>
            </View>
            <View style={styles.dateTimePickerContainer}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.dateTimeText}>{formatDateTime(date)}</Text>
            </View>
            <DateTimePicker
              value={date}
              mode="datetime"
              display="default"
              onChange={(_, selected) => {
                if (selected) setDate(selected);
              }}
              style={styles.datePicker}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.dateTimeSection}>
            <View style={styles.dateTimeLabel}>
              <Ionicons name="stop-circle-outline" size={20} color="#F44336" />
              <Text style={styles.dateTimeLabelText}>End</Text>
            </View>
            <View style={styles.dateTimePickerContainer}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.dateTimeText}>{formatDateTime(endDate)}</Text>
            </View>
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display="default"
              onChange={(_, selected) => {
                if (selected) setEndDate(selected);
              }}
              style={styles.datePicker}
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Save Event</Text>
        </TouchableOpacity>
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
    backgroundColor: '#F5F5F5',
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  dateTimeSection: {
    paddingVertical: 8,
  },
  dateTimeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dateTimeLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateTimePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
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
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
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
