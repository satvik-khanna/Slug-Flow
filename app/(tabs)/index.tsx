import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
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

function normalizeLocalDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);
}

function todayLocalISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);
}

export default function HomeScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayLocalISO());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = previous, +1 = next

  /* Load upcoming events */
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          const stored = await AsyncStorage.getItem('events');
          const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

          const today = todayLocalISO();
          const todayDate = new Date(today);

          // Get upcoming events
          const upcomingEvents = parsed
            .filter((item) => item.type === 'event')
            .filter((item) => {
              const eventDate = new Date(normalizeLocalDate(item.date));
              return eventDate >= todayDate;
            })
            .sort(
              (a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .slice(0, 5);

          setEvents(upcomingEvents);

          // Calculate task stats
          const tasks = parsed.filter((item) => item.type === 'task');
          const completed = tasks.filter((t) => t.completed).length;
          setTaskStats({ total: tasks.length, completed });
        } catch (e) {
          console.error('Failed to load data:', e);
        }
      };
      loadData();
    }, [])
  );

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get week view
  const getWeekDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the current day of week (0 = Sunday, 1 = Monday, etc.)
    const currentDayOfWeek = today.getDay();

    // Calculate the Sunday of the target week using milliseconds
    const sundayTime = today.getTime() - (currentDayOfWeek * 24 * 60 * 60 * 1000) + (weekOffset * 7 * 24 * 60 * 60 * 1000);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayTime = sundayTime + (i * 24 * 60 * 60 * 1000);
      days.push(new Date(dayTime));
    }

    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Get current month/year for display - use the middle of the week (Wednesday) for better month representation
  const getCurrentMonthYear = () => {
    const middleDayOfWeek = weekDays[3]; // Wednesday
    return middleDayOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.getDate(),
    };
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  };

  const progressPercent = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="menu" size={28} color="#333" />
          <Text style={styles.headerTitle}>Home</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
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
            <View style={styles.addEventIcon}>
              <Ionicons name="add" size={24} color="#fff" />
            </View>
            <Text style={styles.addEventText}>Add Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => router.push('/add-task')}
          >
            <Ionicons name="checkbox-outline" size={24} color="#333" />
            <Text style={styles.addTaskText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Widget */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>{getCurrentMonthYear()}</Text>
            <View style={styles.calendarNav}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setWeekOffset(weekOffset - 1)}
              >
                <Ionicons name="chevron-back" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setWeekOffset(weekOffset + 1)}
              >
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekView}>
            {weekDays.map((date, index) => {
              const dateKey = date.toISOString().split('T')[0];
              const isToday = dateKey === todayLocalISO();
              const hasEvents = events.some(
                (e) => normalizeLocalDate(e.date) === dateKey
              );

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dayContainer}
                  onPress={() => setSelectedDate(dateKey)}
                >
                  <Text style={styles.dayName}>{dayNames[index]}</Text>
                  <View
                    style={[
                      styles.dayCircle,
                      (isToday || hasEvents) && styles.dayCircleActive,
                      isToday && styles.dayCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        (isToday || hasEvents) && styles.dayNumberActive,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Task Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconContainer}>
              <Ionicons name="checkmark-done" size={28} color="#fff" />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Task Progress</Text>
              <Text style={styles.progressSubtitle}>Keep up the momentum!</Text>
              <Text style={styles.progressPercent}>
                {Math.round(progressPercent)}%{' '}
                <Text style={styles.progressPercentLabel}>Complete</Text>
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressCount}>
              {taskStats.completed} / {taskStats.total} tasks
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.eventsCard}>
          <View style={styles.eventsHeader}>
            <View style={styles.eventsHeaderLeft}>
              <View style={styles.eventsIconContainer}>
                <Ionicons name="calendar" size={28} color="#fff" />
              </View>
              <View>
                <Text style={styles.eventsTitle}>Upcoming Events</Text>
                <Text style={styles.eventsSubtitle}>
                  {filteredEvents.length} scheduled
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addEventSmallButton}
              onPress={() => router.push('/add-event')}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {filteredEvents.length === 0 ? (
            <View style={styles.emptyEvents}>
              <Text style={styles.emptyEventsText}>No upcoming events</Text>
            </View>
          ) : (
            filteredEvents.map((event) => {
              const dateInfo = formatEventDate(event.date);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventItem}
                  onPress={() =>
                    router.push({
                      pathname: '/edit-event/[id]',
                      params: { id: event.id },
                    })
                  }
                >
                  <View style={styles.eventDot} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventMeta}>
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#666" />
                        <Text style={styles.eventMetaText}>
                          {dateInfo.month} {dateInfo.day}
                        </Text>
                      </View>
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.eventMetaText}>
                          {formatEventTime(event.date)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#E8F5E9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  addEventButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C853',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addEventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  addTaskText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    alignItems: 'center',
    gap: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: '#C8E6C9',
  },
  dayCircleToday: {
    backgroundColor: '#00C853',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  dayNumberActive: {
    color: '#fff',
  },
  progressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  progressIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00C853',
  },
  progressPercentLabel: {
    fontSize: 13,
    fontWeight: 'normal',
    color: '#666',
  },
  progressBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00C853',
    borderRadius: 4,
  },
  eventsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  eventsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  eventsSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  addEventSmallButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyEvents: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyEventsText: {
    fontSize: 14,
    color: '#999',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9800',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 13,
    color: '#666',
  },
});
