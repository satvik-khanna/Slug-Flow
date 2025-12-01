import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';

import type { EventItem } from '@/components/SwipeableEventCard';
import SwipeableEventCard from '@/components/SwipeableEventCard';

/* -------------------------------------------------------
   LOCAL PST DATE NORMALIZATION
------------------------------------------------------- */
function normalizeLocalDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  ).toISOString().slice(0, 10);
}

function todayLocalISO() {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString().slice(0, 10);
}

/* Pretty display */
const todayLabel = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function HomeScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });

  /* -------------------------------------------------------
     Notification permissions
  ------------------------------------------------------- */
  useEffect(() => {
    const register = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          alert('Notification permission not granted.');
        }
      }
    };
    register();
  }, []);

  /* -------------------------------------------------------
     Load Today’s Events (PST-safe)
  ------------------------------------------------------- */
  useFocusEffect(
    React.useCallback(() => {
      const loadEvents = async () => {
        try {
          const stored = await AsyncStorage.getItem('events');
          const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

          const today = todayLocalISO();

          const filtered = parsed
            .filter((item) => item.type === "event")
            .filter((item) => normalizeLocalDate(item.date) === today)
            .sort(
              (a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );

          setEvents(filtered);
        } catch (e) {
          console.error('Failed to load events:', e);
        }
      };
      loadEvents();
    }, [])
  );

  /* -------------------------------------------------------
     Load task progress ONLY (ignore events)
  ------------------------------------------------------- */
  useEffect(() => {
    const loadTaskStats = async () => {
      try {
        const stored = await AsyncStorage.getItem('events');
        const allItems: EventItem[] = stored ? JSON.parse(stored) : [];

        const tasks = allItems.filter((i) => i.type === 'task');

        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;

        setTaskStats({ total, completed });
      } catch (e) {
        console.error('Failed to load task stats:', e);
      }
    };

    loadTaskStats();
  }, [events]); // recalc when events refresh

  /* -------------------------------------------------------
     Delete event
  ------------------------------------------------------- */
  const handleDeleteItem = async (eventId: string) => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const allItems: EventItem[] = stored ? JSON.parse(stored) : [];

      const target = allItems.find((e) => e.id === eventId);

      if (target?.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(target.notificationId);
        } catch {
          console.warn('Failed to cancel notification.');
        }
      }

      const updated = allItems.filter((e) => e.id !== eventId);
      await AsyncStorage.setItem('events', JSON.stringify(updated));

      const today = todayLocalISO();

      const filtered = updated
        .filter((item) => item.type === 'event')
        .filter((item) => normalizeLocalDate(item.date) === today)
        .sort(
          (a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      setEvents(filtered);
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  };

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={{ fontSize: 20, marginTop: 35, marginBottom: 5 }}>
          {todayLabel}
        </Text>
        <Text style={styles.title}>📅 Today's Events</Text>

        {/* -------------------------------------------------------
            TASK PROGRESS BAR (replacing Weekly Progress)
        -------------------------------------------------------- */}
        <View style={{ marginBottom: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
            ✅ Task Progress
          </Text>

          {taskStats.total > 0 ? (
            <>
              <Progress.Bar
                progress={taskStats.completed / taskStats.total}
                width={300}
                color="#4CAF50"
                borderRadius={10}
              />
              <Text style={{ marginTop: 6, color: "#555" }}>
                {taskStats.completed} / {taskStats.total} tasks completed
              </Text>
            </>
          ) : (
            <Text style={{ color: "#888" }}>No tasks added yet</Text>
          )}
        </View>

        {/* Today's events */}
        <View style={styles.listContainer}>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "./edit-event/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <SwipeableEventCard event={item} onDelete={handleDeleteItem} />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No events today</Text>
            }
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button title="➕ Add Event" onPress={() => router.push("/add-event")} />
          <View style={{ height: 10 }} />
          <Button title="📝 Add Task" onPress={() => router.push("/add-task")} />
          <View style={{ height: 10 }} />
          <Button
            title="📚 Add UCSC Classes"
            onPress={() => router.push("/add-class")}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

/* -------------------------------------------------------
   Styles
------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  listContainer: { flex: 1, paddingBottom: 150 },
  buttonContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
  },
  empty: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    marginTop: 50,
  },
});
