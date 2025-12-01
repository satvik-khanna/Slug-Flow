import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SwipeableEventCard from '@/components/SwipeableEventCard';
import UCSCEventCard from '@/components/UCSCEventCard';
import { EVENT_TYPE_COLORS, UCSCEvent, getUCSCEvents } from '@/constants/UCSCEvents';

/* -----------------------------------------------------------
   Convert ISO → YYYY-MM-DD in LOCAL Pacific Time
----------------------------------------------------------- */
function normalizeDateLocal(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  // Convert local → local date string
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/* -----------------------------------------------------------
   Component
----------------------------------------------------------- */

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
  const [selectedDate, setSelectedDate] = useState(normalizeDateLocal(new Date()));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [ucscEvents, setUcscEvents] = useState<UCSCEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [filteredUcscEvents, setFilteredUcscEvents] = useState<UCSCEvent[]>([]);
  const [showUCSCEvents, setShowUCSCEvents] = useState(true);

  /* ---------------------- Load Data --------------------------------- */
  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem("events");
      setEvents(stored ? JSON.parse(stored) : []);
    } catch (err) {
      console.error("Failed loading personal events:", err);
    }
  };

  const loadUCSC = async () => {
    try {
      const list = await getUCSCEvents();
      setUcscEvents(list);
    } catch (err) {
      console.error("Failed loading UCSC events:", err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
      loadUCSC();
    }, [])
  );

  /* ---------------------- Filtering --------------------------------- */
  useEffect(() => {
    const filteredPersonal = events.filter((ev) => {
      const dateKey =
        ev.type === "task"
          ? normalizeDateLocal(ev.dueDate)
          : normalizeDateLocal(ev.date);
      return dateKey === selectedDate;
    });

    const sortedPersonal = filteredPersonal.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const filteredU = ucscEvents.filter(
      (ev) => normalizeDateLocal(ev.date) === selectedDate
    );

    setFilteredEvents(sortedPersonal);
    setFilteredUcscEvents(filteredU);
  }, [selectedDate, events, ucscEvents]);

  /* ---------------------- Delete Event ------------------------------- */
  const handleDeleteItem = async (eventId: string) => {
    try {
      const stored = await AsyncStorage.getItem("events");
      let all: EventItem[] = stored ? JSON.parse(stored) : [];

      const target = all.find((e) => e.id === eventId);
      if (target?.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(target.notificationId);
        } catch {}
      }

      all = all.filter((e) => e.id !== eventId);
      await AsyncStorage.setItem("events", JSON.stringify(all));
      setEvents(all);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        
        {/* Calendar */}
        <View style={styles.calendar}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={generateMarkedDates(events, ucscEvents, selectedDate)}
          />
        </View>

        {/* Scroll Content */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Toggle */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowUCSCEvents(!showUCSCEvents)}
          >
            <Text style={styles.toggleButtonText}>
              {showUCSCEvents ? "🏛 Hide UCSC Events" : "🏛 Show UCSC Events"}
            </Text>
          </TouchableOpacity>

          {/* Personal events */}
          <Text style={styles.sectionTitle}>📅 My Events: {selectedDate}</Text>

          {filteredEvents.length === 0 ? (
            <Text style={styles.emptySection}>No events today</Text>
          ) : (
            filteredEvents.map((ev) => (
              <Pressable
                key={ev.id}
                onPress={() =>
                  router.push({ pathname: "/edit-event/[id]", params: { id: ev.id } })
                }
              >
                <SwipeableEventCard
                  event={ev}
                  onDelete={handleDeleteItem}
                />
              </Pressable>
            ))
          )}
          
          {/* UCSC Events */}
          {showUCSCEvents && (
            <>
              <Text style={styles.sectionTitle}>🏛 UCSC Events: {selectedDate}</Text>
              {filteredUcscEvents.length === 0 ? (
                <Text style={styles.emptySection}>No UCSC events</Text>
              ) : (
                filteredUcscEvents.map((ev) => (
                  <UCSCEventCard key={ev.id} event={ev} />
                ))
              )}
            </>
          )}

        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

/* -----------------------------------------------------------
   Marked Dates
----------------------------------------------------------- */
function generateMarkedDates(
  events: EventItem[],
  ucscEvents: UCSCEvent[],
  selectedDate: string
) {
  const marked: Record<string, any> = {};

  /* ---------------------------
     Add personal events/tasks
  --------------------------- */
  for (const ev of events) {
    const dateKey =
      ev.type === "task"
        ? normalizeDateLocal(ev.dueDate)
        : normalizeDateLocal(ev.date);

    if (!dateKey) continue;

    if (!marked[dateKey]) {
      marked[dateKey] = {
        dots: [],
        marked: true,
        markingType: "multi-dot",
      };
    }

    const color = ev.type === "task" ? "#4CAF50" : "orange";

    if (!marked[dateKey].dots.some((d: any) => d.color === color)) {
      marked[dateKey].dots.push({ color });
    }
  }

  /* ---------------------------
       Add UCSC events/classes
  --------------------------- */
  for (const ev of ucscEvents) {
    const dateKey = normalizeDateLocal(ev.date);
    if (!dateKey) continue;

    if (!marked[dateKey]) {
      marked[dateKey] = {
        dots: [],
        marked: true,
        markingType: "multi-dot",
      };
    }

    const color = EVENT_TYPE_COLORS[ev.type] ?? "#3b82f6";

    if (!marked[dateKey].dots.some((d: any) => d.color === color)) {
      marked[dateKey].dots.push({ color });
    }
  }

  /* ---------------------------
       Selected date logic
       ✔ Do NOT add dots
       ✔ Do NOT add marked:true if empty
  --------------------------- */
  if (marked[selectedDate]) {
    // Day already has events — keep dots and just highlight it
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: "#00adf5",
    };
  } else {
    // No events — highlight only, NO dot
    marked[selectedDate] = {
      selected: true,
      selectedColor: "#00adf5",
    };
  }

  return marked;
}


/* -----------------------------------------------------------
   Styles
----------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  calendar: { paddingTop: 90 },
  scrollContainer: { flex: 1, paddingTop: 10 },

  toggleButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },

  toggleButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 12,
    color: "#333",
  },

  emptySection: {
    textAlign: "center",
    color: "#999",
    marginTop: 10,
    marginBottom: 20,
    fontStyle: "italic",
  },
});
