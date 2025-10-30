
// app/(tabs)/calendar.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
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

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);

  // Define loadEvents as a separate function
  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
      setEvents(parsed);
    } catch (e) {
      console.error('Failed to load event', e);
    }
  };

  // Load events whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [])
  );

  useEffect(() => {
    const filtered = events
      .filter((event) => event.date.slice(0, 10) === selectedDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredEvents(filtered);
  }, [selectedDate, events]);

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

      // Reload events
      await loadEvents();
    } catch (e) {
      console.error('Failed to toggle completion', e);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.calendar}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={generateMarkedDates(events, selectedDate)}
          />
        </View>

        <Text style={styles.dateTitle}>📅 {selectedDate} events:</Text>

        {filteredEvents.length === 0 ? (
          <Text style={styles.empty}>No plans for this day</Text>
        ) : (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SwipeableEventCard
                event={item}
                onToggleComplete={handleToggleComplete}
              />
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

function generateMarkedDates(events: EventItem[], selectedDate: string) {
  const marked: { [date: string]: any } = {};

  for (const event of events) {
    const datekey = event.date.slice(0, 10);

    if (!marked[datekey]) {
      marked[datekey] = { marked: true, dotColor: 'orange' };
    }
  }

  // Highlight selected date
  if (marked[selectedDate]) {
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#00adf5',
    };
  } else {
    marked[selectedDate] = {
      selected: true,
      selectedColor: '#00adf5',
    };
  }

  return marked;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  calendar: {
    paddingTop: 90,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});

{/*// app/(tabs)/calendar.tsx old version
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
=======
import { Link, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
>>>>>>> 1ea7b9ffa50e5ca3809a1aa2fe3d86c4f0c28429
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

type EventItem = {
  id: string;
  title: string;
  note: string;
  location: string;
  date: string;
  endDate?: string;
};

// Convert ISO date string to local YYYY-MM-DD
function toLocalDate(iso: string) {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadEvents = async () => {
        try {
          const stored = await AsyncStorage.getItem('events');
          const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
          setEvents(parsed);

          // Filter events for today by default
          const todayEvents = parsed
            .filter((event) => toLocalDate(event.date) === selectedDate)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setFilteredEvents(todayEvents);
        } catch (e) {
          console.error('Failed to load events', e);
        }
      };
      loadEvents();
    }, [selectedDate])
  );

  // Update filtered events whenever selectedDate or events change
  React.useEffect(() => {
    const filtered = events
      .filter((event) => toLocalDate(event.date) === selectedDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredEvents(filtered);
  }, [selectedDate, events]);

  // Generate marked dates for the calendar
  function generateMarkedDates() {
    const marked: { [date: string]: any } = {};

    for (const event of events) {
      const dateKey = toLocalDate(event.date);
      if (!marked[dateKey]) {
        marked[dateKey] = { marked: true, dotColor: 'orange' };
      }
    }

    // Highlight selected date
    if (marked[selectedDate]) {
      marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#00adf5' };
    } else {
      marked[selectedDate] = { selected: true, selectedColor: '#00adf5' };
    }

    return marked;
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <View style={styles.container}>
      <View style={styles.calendar}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={generateMarkedDates()}
        />
      </View>

      <Text style={styles.dateTitle}>📅 {selectedDate} events:</Text>

      {filteredEvents.length === 0 ? (
        <Text style={styles.empty}>No plans for this day</Text>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link
              href={{ pathname: '/edit-event/[id]' as const, params: { id: item.id } }}
              asChild
            >
              <TouchableOpacity style={styles.card}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>
                  {formatTime(item.date)} - {item.endDate ? formatTime(item.endDate) : ''}
                </Text>
              </TouchableOpacity>
            </Link>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  calendar: {
    paddingTop: 90,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventTime: {
    color: '#555',
    marginTop: 4,
  },
  eventNote: {
    color: '#777',
    marginTop: 2,
  },
});

*/}