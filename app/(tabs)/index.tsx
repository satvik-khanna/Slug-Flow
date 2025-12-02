import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';

import type { EventItem } from '@/components/SwipeableEventCard';

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

export default function HomeScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayLocalISO());

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
     Load Today's Events (PST-safe)
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
  }, [events]);

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSubtitle}>Manage your schedule</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.addEventButton}
            onPress={() => router.push('/add-event')}
          >
            <Text style={styles.addEventText}>+ Add Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => router.push('/add-task')}
          >
            <Ionicons name="checkbox-outline" size={20} color="#333" />
            <Text style={styles.addTaskText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: '#00C853',
              },
            }}
            theme={{
              todayTextColor: '#00C853',
              arrowColor: '#333',
              monthTextColor: '#333',
              textMonthFontWeight: 'bold',
              textDayFontSize: 14,
              textMonthFontSize: 16,
            }}
          />
        </View>

        {/* Task Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-done" size={24} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>Task Progress</Text>
          </View>

          {taskStats.total > 0 ? (
            <>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Completed Tasks</Text>
                <Text style={styles.progressStats}>
                  {taskStats.completed}/{taskStats.total}
                </Text>
              </View>
              <Progress.Bar
                progress={taskStats.completed / taskStats.total}
                width={null}
                height={8}
                color="#00C853"
                unfilledColor="#E8F5E9"
                borderWidth={0}
                borderRadius={4}
                style={styles.progressBar}
              />
              <Text style={styles.progressPercentage}>
                {Math.round((taskStats.completed / taskStats.total) * 100)}%
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>No tasks added yet</Text>
          )}
        </View>

        {/* Upcoming Events Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>Upcoming Events</Text>
          </View>

          {events.length > 0 ? (
            events.slice(0, 3).map((event) => (
              <Pressable
                key={event.id}
                style={styles.eventItem}
                onPress={() =>
                  router.push({
                    pathname: './edit-event/[id]',
                    params: { id: event.id },
                  })
                }
              >
                <View style={styles.eventDot} />
                <Text style={styles.eventText}>{event.title}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>No upcoming events</Text>
          )}
        </View>

        {/* Add Class Button */}
        <TouchableOpacity
          style={styles.addClassButton}
          onPress={() => router.push('/add-class')}
        >
          <Ionicons name="school-outline" size={20} color="#00C853" />
          <Text style={styles.addClassText}>Add UCSC Classes</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </GestureHandlerRootView>
  );
}

/* -------------------------------------------------------
   Styles
------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00C853',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  addEventButton: {
    flex: 1,
    backgroundColor: '#00C853',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEventText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addTaskButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addTaskText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  calendarCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressStats: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
  },
  progressBar: {
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#00C853',
    fontWeight: '600',
    textAlign: 'right',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    marginRight: 12,
  },
  eventText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  addClassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#00C853',
  },
  addClassText: {
    color: '#00C853',
    fontSize: 16,
    fontWeight: '600',
  },
});
