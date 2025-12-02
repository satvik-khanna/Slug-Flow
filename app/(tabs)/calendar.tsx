import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

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

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={28} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Calendar</Text>
          </View>
          <Text style={styles.headerSubtitle}>View your schedule</Text>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={generateMarkedDates(events, ucscEvents, selectedDate)}
            theme={{
              todayTextColor: '#00C853',
              selectedDayBackgroundColor: '#00C853',
              selectedDayTextColor: '#fff',
              arrowColor: '#00C853',
              monthTextColor: '#333',
              textMonthFontWeight: 'bold',
              textDayFontWeight: '500',
              textMonthFontSize: 18,
              textDayHeaderFontWeight: '600',
            }}
          />
        </View>

        {/* Scroll Content */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Toggle Button */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowUCSCEvents(!showUCSCEvents)}
          >
            <Ionicons
              name={showUCSCEvents ? "eye-off" : "eye"}
              size={20}
              color="#fff"
            />
            <Text style={styles.toggleButtonText}>
              {showUCSCEvents ? "Hide UCSC Events" : "Show UCSC Events"}
            </Text>
          </TouchableOpacity>

          {/* Personal Events Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="calendar-outline" size={22} color="#00C853" />
              <Text style={styles.sectionTitle}>My Events</Text>
            </View>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          {filteredEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyCardTitle}>No events scheduled</Text>
              <Text style={styles.emptyCardSubtitle}>
                Add events to see them here
              </Text>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {filteredEvents.map((ev) => (
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
              ))}
            </View>
          )}

          {/* UCSC Events Section */}
          {showUCSCEvents && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="school-outline" size={22} color="#00C853" />
                  <Text style={styles.sectionTitle}>UCSC Events</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>

              {filteredUcscEvents.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="school-outline" size={48} color="#E0E0E0" />
                  <Text style={styles.emptyCardTitle}>No UCSC events</Text>
                  <Text style={styles.emptyCardSubtitle}>
                    No university events scheduled for this day
                  </Text>
                </View>
              ) : (
                <View style={styles.eventsContainer}>
                  {filteredUcscEvents.map((ev) => (
                    <UCSCEventCard key={ev.id} event={ev} />
                  ))}
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
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
      selectedColor: "#00C853",
    };
  } else {
    // No events — highlight only, NO dot
    marked[selectedDate] = {
      selected: true,
      selectedColor: "#00C853",
    };
  }

  return marked;
}


/* -----------------------------------------------------------
   Styles
----------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 60,
  },

  calendarCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  toggleButton: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },

  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  dateBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  dateBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00C853',
  },

  emptyCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  emptyCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 4,
  },

  emptyCardSubtitle: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
  },

  eventsContainer: {
    marginBottom: 20,
  },
});
