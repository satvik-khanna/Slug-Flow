// app/edit-event/[id].tsx

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

type EventItem = {
  id: string;
  title: string;
  note?: string;
  location?: string;
  date: string;
  endDate: string;
  notificationId?: string;
  completed?: boolean;
  type: "event";
};

function toLocalISOString(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 19);
}

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [completed, setCompleted] = useState(false);
  const [notificationId, setNotificationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadEvent = async () => {
      const stored = await AsyncStorage.getItem("events");
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

      const event = parsed.find(e => e.id === id);

      if (!event) {
        Alert.alert("Error", "Event not found.");
        router.back();
        return;
      }

      setTitle(event.title);
      setNote(event.note || "");
      setLocation(event.location || "");
      setDate(new Date(event.date));
      setEndDate(new Date(event.endDate));
      setCompleted(!!event.completed);
      setNotificationId(event.notificationId);

      setLoading(false);
    };

    loadEvent();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }
    if (endDate <= date) {
      alert("End time must be after the start time.");
      return;
    }

    const stored = await AsyncStorage.getItem("events");
    const events: EventItem[] = stored ? JSON.parse(stored) : [];

    const updated = events.map(ev =>
      ev.id === id
        ? {
            ...ev,
            title,
            note,
            location,
            date: toLocalISOString(date),
            endDate: toLocalISOString(endDate),
            completed,
          }
        : ev
    );

    await AsyncStorage.setItem("events", JSON.stringify(updated));
    router.back();
  };

  const handleToggleComplete = async () => {
    const stored = await AsyncStorage.getItem("events");
    const events: EventItem[] = stored ? JSON.parse(stored) : [];

    const updated = events.map(ev =>
      ev.id === id ? { ...ev, completed: !completed } : ev
    );

    await AsyncStorage.setItem("events", JSON.stringify(updated));
    setCompleted(!completed);
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const stored = await AsyncStorage.getItem("events");
            const events: EventItem[] = stored ? JSON.parse(stored) : [];

            const target = events.find(e => e.id === id);
            if (target?.notificationId) {
              try {
                await Notifications.cancelScheduledNotificationAsync(target.notificationId);
              } catch {}
            }

            const filtered = events.filter(e => e.id !== id);
            await AsyncStorage.setItem("events", JSON.stringify(filtered));

            router.back();
          },
        },
      ]
    );
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) return <Text style={{ padding: 20 }}>Loading…</Text>;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Event",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
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

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="create-outline" size={28} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Edit Event</Text>
          <Text style={styles.headerSubtitle}>Update the event details</Text>
        </View>

        {/* Event Details */}
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
              placeholder="Notes (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
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

        {/* Date & Time */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Date & Time</Text>

          {/* Start */}
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
              onChange={(_, selected) => selected && setDate(selected)}
            />
          </View>

          <View style={styles.divider} />

          {/* End */}
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
              onChange={(_, selected) => selected && setEndDate(selected)}
            />
          </View>
        </View>

        {/* ---- Buttons (inside ScrollView now!) ---- */}
        <View style={{ marginHorizontal: 16, marginTop: 10, gap: 12 }}>
          <TouchableOpacity
            style={[
              styles.bottomButton,
              { backgroundColor: completed ? "#FFA726" : "#00C853" },
            ]}
            onPress={handleToggleComplete}
          >
            <Ionicons
              name={completed ? "refresh" : "checkmark-circle"}
              size={24}
              color="#fff"
            />
            <Text style={styles.bottomButtonText}>
              {completed ? "Mark Incomplete" : "Mark Complete"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: "#00C853" }]}
            onPress={handleSave}
          >
            <Ionicons name="save-outline" size={24} color="#fff" />
            <Text style={styles.bottomButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: "#D32F2F" }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <Text style={styles.bottomButtonText}>Delete Event</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </>
  );
}

/* -------------------------------------------------------
   Styles — identical to Add Event + button styling
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
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeSection: { paddingVertical: 8 },
  dateTimeLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  dateTimeLabelText: { fontSize: 16, fontWeight: '600', color: '#333' },
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
  dateTimeText: { fontSize: 16, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 16 },

  /* Buttons */
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
