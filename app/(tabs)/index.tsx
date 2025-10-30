// app/(tabs)/index.tsx newer version
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SwipeableEventCard from '@/components/SwipeableEventCard';

type EventItem = {
  id: string;
  title: string;
  note: string;
  location: string;
  date: string;
  endDate: string;
  completed?: boolean;
  notificationId?: any;
};

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          alert('⛔ If the notification permission is not granted, the reminder function will not be available.');
        }
      }
    };

    registerForPushNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadEvents = async () => {
        try {
          const stored = await AsyncStorage.getItem('events');
          const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
          const today = getToday();
          const filtered = parsed
            .filter((event) => event.date.slice(0, 10) === today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          setEvents(filtered);
        } catch (e) {
          console.error('load events fail', e);
        }
      };
      loadEvents();
    }, [])
  );

  const handleToggleComplete = async (eventId: string) => {
    try {
      // Load all events
      const stored = await AsyncStorage.getItem('events');
      const allEvents: EventItem[] = stored ? JSON.parse(stored) : [];

      // Toggle the completed status
      const updated = allEvents.map((event) =>
        event.id === eventId
          ? { ...event, completed: !event.completed }
          : event
      );

      // Save back to storage
      await AsyncStorage.setItem('events', JSON.stringify(updated));

      // Update local state for today's events
      const today = getToday();
      const filtered = updated
        .filter((event) => event.date.slice(0, 10) === today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(filtered);
    } catch (e) {
      console.error('Failed to toggle completion', e);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={{ fontSize: 20, marginTop: 35, marginBottom: 5 }}>
          {today}
        </Text>
        <Text style={styles.title}>📅 Today's Schedule</Text>

        <View style={styles.listContainer}>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SwipeableEventCard
                event={item}
                onToggleComplete={handleToggleComplete}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No Schedule Yet</Text>}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button title="➕ Add Event" onPress={() => router.push('/add-event')} />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    paddingBottom: 150,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  empty: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
});

{/*// app/(tabs)/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Link, router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';



// 模拟今日日程数据（后续会用 AsyncStorage 替代）
const todayEvents = [
  { id: '1', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '2', title: 'Math Exam Review', time: '2:00 PM' },
  { id: '3', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '4', title: 'Math Exam Review', time: '2:00 PM' },
  { id: '5', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '6', title: 'Math Exam Review', time: '2:00 PM' },
  { id: '7', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '8', title: 'Math Exam Review', time: '2:00 PM' },
  { id: '9', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '10', title: 'Math Exam Review', time: '2:00 PM' },
];

type EventItem = {
  id: string;
  title: string;
  note: string;
  location: string;
  date: string; // ISO 时间字符串
  endDate: string;
};

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          alert('⛔ If the notification permission is not granted, the reminder function will not be available.');
        }
      }
    };

    registerForPushNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadEvents = async () => {
        try {
          const stored = await AsyncStorage.getItem('events');
          const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
          const today = getToday();
          const filtered = parsed
              .filter((event) => event.date.slice(0, 10) === today)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          setEvents(filtered);
        } catch (e) {
          console.error('load events fail', e);
        }
      };
      loadEvents();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20, marginTop: 35, marginBottom: 5 }}>
        {today}
      </Text>
      <Text style={styles.title}>📅 Today's Schedule</Text>

      <View style={styles.listContainer}>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={`/edit-event/${item.id}` as const} asChild>

              {/*Swipeable cards with complete functionality
                

              <TouchableOpacity style={styles.card}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>
                  {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  ~ {new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>


            </Link>
          )}
          ListEmptyComponent={<Text style={styles.empty}>None Schedule Yet</Text>}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="➕ Add Event" onPress={() => router.push('/add-event')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20, backgroundColor: '#fff',
  },
  title: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    paddingBottom: 150,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  empty: {
    fontSize: 18, color: '#888', textAlign: 'center', marginTop: 50,
  },
  card: {
    backgroundColor: '#f0f0f0', padding: 15, marginBottom: 15,
    borderRadius: 10,
  },
  eventTitle: {
    fontSize: 18, fontWeight: '600',
  },
  eventTime: {
    fontSize: 16, color: '#666', marginTop: 4,
  },
});

*/}