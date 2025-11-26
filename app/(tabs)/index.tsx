import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';

import type { EventItem } from '@/components/SwipeableEventCard';
import SwipeableEventCard from '@/components/SwipeableEventCard';

const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ total: 0, completed: 0 });

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

  useFocusEffect(
    React.useCallback(() => {
      const loadEvents = async () => {
        try {
          const stored = await AsyncStorage.getItem('events');
          const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
          const today = getTodayISO();

          const filtered = parsed
            .filter((item) => item.type === 'event')
            .filter((item) => item.date.slice(0, 10) === today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          setEvents(filtered);
        } catch (e) {
          console.error('Failed to load events:', e);
        }
      };
      loadEvents();
    }, [])
  );

  useEffect(() => {
    const loadWeeklyStats = async () => {
      try {
        const stored = await AsyncStorage.getItem('events');
        const allItems: EventItem[] = stored ? JSON.parse(stored) : [];

        const now = new Date();
        const dayOfWeek = now.getDay();

        const sundayStart = new Date(now);
        sundayStart.setDate(now.getDate() - dayOfWeek);
        sundayStart.setHours(0, 0, 0, 0);

        const sundayEnd = new Date(sundayStart);
        sundayEnd.setDate(sundayStart.getDate() + 7);
        sundayEnd.setHours(23, 59, 59, 999);

        const weeklyItems = allItems.filter((item) => {
          const itemDate = new Date(item.date);
          return itemDate >= sundayStart && itemDate < sundayEnd;
        });

        const total = weeklyItems.length;
        const completed = weeklyItems.filter((e) => e.completed).length;

        setWeeklyStats({ total, completed });
      } catch (e) {
        console.error('Failed to load weekly stats:', e);
      }
    };
    loadWeeklyStats();
  }, [events]);

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

      const today = getTodayISO();
      const filtered = updated
        .filter((item) => item.type === 'event')
        .filter((item) => item.date.slice(0, 10) === today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(filtered);
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={{ fontSize: 20, marginTop: 35, marginBottom: 5 }}>{todayLabel}</Text>
        <Text style={styles.title}>📅 Today's Events</Text>

        <View style={{ marginBottom: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
            📊 Weekly Progress
          </Text>

          {weeklyStats.total > 0 ? (
            <>
              <Progress.Bar
                progress={weeklyStats.completed / weeklyStats.total}
                width={300}
                color="#4CAF50"
                borderRadius={10}
              />
              <Text style={{ marginTop: 6, color: '#555' }}>
                {weeklyStats.completed} / {weeklyStats.total} done this week
              </Text>
            </>
          ) : (
            <Text style={{ color: '#888' }}>No items this week</Text>
          )}
        </View>

        <View style={styles.listContainer}>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  router.push({
                    pathname: "./edit-event/[id]",
                    params: { id: item.id },
                  });
                }}
              >
                <SwipeableEventCard
                  event={item}
                  onDelete={handleDeleteItem}
                />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No events today</Text>
            }
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button title="➕ Add Event" onPress={() => router.push('/add-event')} />
          <View style={{ height: 10 }} />
          <Button title="📝 Add Task" onPress={() => router.push('/add-task')} />
            <View style={{ height: 10 }} />
          <Button title="Add UCSC Classes" onPress={() => router.push('/add-class')} />
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  listContainer: { flex: 1, paddingBottom: 150 },
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
