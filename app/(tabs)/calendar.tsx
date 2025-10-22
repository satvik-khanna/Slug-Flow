// app/(tabs)/calendar.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
        } catch (e) {
          console.error('Failed to load events', e);
        }
      };

      loadEvents();
    }, [])
  );
  useEffect(() => {
    const filtered = events
        .filter((event) => event.date.slice(0, 10) === selectedDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredEvents(filtered);
    }, [selectedDate, events]);

  return (
    <View style={styles.container}>
      <View style={styles.calendar}>
        <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={generateMarkedDates(events, selectedDate)}
        />
      </View>

      <Text style={styles.dateTitle}>
        📅 {selectedDate} events:
      </Text>

      {filteredEvents.length === 0 ? (
        <Text style={styles.empty}>No plans for this day</Text>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link
              href={{
                pathname: '/edit-event/[id]' as const,
                params: { id: item.id },
              }}
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

function generateMarkedDates(events : EventItem[], selectedDate: string) {
  const marked: {[date: string]: any} = {};

  for (const event of events) {
    const datekey = event.date.slice(0, 10);

    if(!marked[datekey]) {
      marked[datekey] = {marked: true, dotColor: 'orange'};
    }
  }

  // 高亮当前选中日期
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

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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