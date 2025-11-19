import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SwipeableEventCard from '@/components/SwipeableEventCard';
import UCSCEventCard from '@/components/UCSCEventCard';
import { EVENT_TYPE_COLORS, getUCSCEvents, UCSCEvent } from '@/constants/UCSCEvents';

function normalizeDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

type EventItem = {
  id: string;
  title: string;
  note?: string;
  location?: string;
  date: string;
  endDate?: string;
  dueDate?: string;
  completed?: boolean;
  notificationId?: any;
  type?: 'event' | 'task';
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [ucscEvents, setUcscEvents] = useState<UCSCEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [filteredUcscEvents, setFilteredUcscEvents] = useState<UCSCEvent[]>([]);
  const [showUCSCEvents, setShowUCSCEvents] = useState(true);

  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem('events');
      setEvents(stored ? JSON.parse(stored) : []);
    } catch (err) {
      console.error('Failed to load personal events:', err);
    }
  };

  const loadUCSC = async () => {
    try {
      const list = await getUCSCEvents();
      setUcscEvents(list);
      console.log('Loaded UCSC events:', list.length);
    } catch (err) {
      console.error('Failed to load UCSC events:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
      loadUCSC();
    }, [])
  );

  useEffect(() => {
    const filteredPersonal = events.filter((ev) => {
      if (ev.type === 'task') {
        if (!ev.dueDate) return false;
        return normalizeDate(ev.dueDate) === selectedDate;
      }
      return normalizeDate(ev.date) === selectedDate;
    });

    const sortedPersonal = [...filteredPersonal].sort((a, b) => {
      const aKey = a.type === 'task' ? normalizeDate(a.dueDate) : normalizeDate(a.date);
      const bKey = b.type === 'task' ? normalizeDate(b.dueDate) : normalizeDate(b.date);
      return aKey.localeCompare(bKey);
    });

    const filteredU = ucscEvents.filter(
      (ev) => normalizeDate(ev.date) === selectedDate
    );

    setFilteredEvents(sortedPersonal);
    setFilteredUcscEvents(filteredU);
  }, [selectedDate, events, ucscEvents]);

  const handleToggleComplete = async (eventId: string) => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const allEvents: EventItem[] = stored ? JSON.parse(stored) : [];

      const updated = allEvents.map((e) =>
        e.id === eventId ? { ...e, completed: !e.completed } : e
      );

      await AsyncStorage.setItem('events', JSON.stringify(updated));
      setEvents(updated);
    } catch (err) {
      console.error('Failed to toggle complete:', err);
    }
  };

  const handleDeleteItem = async (eventId: string) => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const allEvents: EventItem[] = stored ? JSON.parse(stored) : [];

      const target = allEvents.find((e) => e.id === eventId);

      if (target?.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(
            target.notificationId
          );
        } catch (err) {
          console.warn('Failed to cancel notification:', err);
        }
      }

      const updated = allEvents.filter((e) => e.id !== eventId);
      await AsyncStorage.setItem('events', JSON.stringify(updated));

      setEvents(updated);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.calendar}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={generateMarkedDates(events, ucscEvents, selectedDate)}
          />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowUCSCEvents(!showUCSCEvents)}
          >
            <Text style={styles.toggleButtonText}>
              {showUCSCEvents ? '🏛️ Hide UCSC Events' : '🏛️ Show UCSC Events'}
            </Text>
          </TouchableOpacity>

          {showUCSCEvents && (
            <>
              <Text style={styles.sectionTitle}>
                🏛️ UCSC Events – {selectedDate}
              </Text>

              {filteredUcscEvents.length === 0 ? (
                <Text style={styles.emptySection}>
                  No UCSC events for this day
                </Text>
              ) : (
                filteredUcscEvents.map((evt) => (
                  <UCSCEventCard key={evt.id} event={evt} />
                ))
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>
            📅 My Events & Tasks – {selectedDate}
          </Text>

          {filteredEvents.length === 0 ? (
            <Text style={styles.emptySection}>No items for this day</Text>
          ) : (
            filteredEvents.map((evt) => (
              <SwipeableEventCard
                key={evt.id}
                event={evt}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteItem}
              />
            ))
          )}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

function generateMarkedDates(
  events: EventItem[],
  ucscEvents: UCSCEvent[],
  selectedDate: string
) {
  const marked: Record<string, any> = {};

  events.forEach((ev) => {
    const dateKey = ev.type === 'task' ? normalizeDate(ev.dueDate) : normalizeDate(ev.date);

    if (!dateKey) return;

    if (!marked[dateKey]) marked[dateKey] = { dots: [] };

    const color = ev.type === 'task' ? '#4CAF50' : 'orange';

    if (!marked[dateKey].dots.some((d: any) => d.color === color)) {
      marked[dateKey].dots.push({ color });
    }

    marked[dateKey].markingType = 'multi-dot';
  });

  ucscEvents.forEach((ev) => {
    const dateKey = normalizeDate(ev.date);
    if (!dateKey) return;

    if (!marked[dateKey]) marked[dateKey] = { dots: [] };

    const color = EVENT_TYPE_COLORS[ev.type] ?? '#3b82f6';

    if (!marked[dateKey].dots.some((d: any) => d.color === color)) {
      marked[dateKey].dots.push({ color });
    }

    marked[dateKey].markingType = 'multi-dot';
  });

  marked[selectedDate] = {
    ...(marked[selectedDate] || {}),
    selected: true,
    selectedColor: '#00adf5',
  };

  return marked;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  calendar: { paddingTop: 90 },
  scrollContainer: { flex: 1, paddingTop: 10 },

  toggleButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },

  toggleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#333',
  },

  emptySection: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
    marginBottom: 20,
    fontStyle: 'italic',
  },
});
