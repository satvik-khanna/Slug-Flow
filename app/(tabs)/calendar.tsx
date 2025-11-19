// app/(tabs)/calendar.tsx
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

/* -----------------------------------------------------------
   Helpers
----------------------------------------------------------- */

function normalizeDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

/* -----------------------------------------------------------
   Types
----------------------------------------------------------- */

type EventItem = {
  id: string;
  title: string;
  note?: string;
  location?: string;
  date: string;        // event start OR task-created date
  endDate?: string;    // events only
  dueDate?: string;    // tasks only
  completed?: boolean;
  notificationId?: any;
  type?: 'event' | 'task';
};

/* -----------------------------------------------------------
   Component
----------------------------------------------------------- */

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [ucscEvents, setUcscEvents] = useState<UCSCEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [filteredUcscEvents, setFilteredUcscEvents] = useState<UCSCEvent[]>([]);
  const [showUCSCEvents, setShowUCSCEvents] = useState(true);

  /* -----------------------------------------------------------
     Load Events
  ----------------------------------------------------------- */

  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem('events');
      setEvents(stored ? JSON.parse(stored) : []);
    } catch (err) {
      console.error('❌ Failed to load personal events:', err);
    }
  };

  const loadUCSC = async () => {
    try {
      const list = await getUCSCEvents();
      setUcscEvents(list);
      console.log('📘 Loaded UCSC events:', list.length);
    } catch (err) {
      console.error('❌ Failed to load UCSC events:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
      loadUCSC();
    }, [])
  );

  /* -----------------------------------------------------------
     Filter when date or data changes
     - Events shown if event.date is that day
     - Tasks shown if task.dueDate is that day
  ----------------------------------------------------------- */

  useEffect(() => {
    const filteredPersonal = events.filter((ev) => {
      if (ev.type === 'task') {
        // task: match by dueDate
        if (!ev.dueDate) return false;
        return normalizeDate(ev.dueDate) === selectedDate;
      }
      // event: match by event date
      return normalizeDate(ev.date) === selectedDate;
    });

    // Optional: sort so events first, then tasks, by time
    const sortedPersonal = [...filteredPersonal].sort((a, b) => {
      const aKey =
        a.type === 'task'
          ? normalizeDate(a.dueDate)
          : normalizeDate(a.date);
      const bKey =
        b.type === 'task'
          ? normalizeDate(b.dueDate)
          : normalizeDate(b.date);
      return aKey.localeCompare(bKey);
    });

    const filteredU = ucscEvents.filter(
      (ev) => normalizeDate(ev.date) === selectedDate
    );

    setFilteredEvents(sortedPersonal);
    setFilteredUcscEvents(filteredU);
  }, [selectedDate, events, ucscEvents]);

  /* -----------------------------------------------------------
     Toggle Complete (only really meaningful for tasks)
  ----------------------------------------------------------- */

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
      console.error('❌ Failed to toggle complete:', err);
    }
  };

  /* -----------------------------------------------------------
     Delete event/task
  ----------------------------------------------------------- */

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
          console.warn('⚠️ Failed to cancel notification:', err);
        }
      }

      const updated = allEvents.filter((e) => e.id !== eventId);
      await AsyncStorage.setItem('events', JSON.stringify(updated));

      setEvents(updated);
    } catch (err) {
      console.error('❌ Failed to delete event:', err);
    }
  };

  /* -----------------------------------------------------------
     UI
  ----------------------------------------------------------- */

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* CALENDAR */}
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
          {/* Toggle UCSC */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowUCSCEvents(!showUCSCEvents)}
          >
            <Text style={styles.toggleButtonText}>
              {showUCSCEvents ? '🏛️ Hide UCSC Events' : '🏛️ Show UCSC Events'}
            </Text>
          </TouchableOpacity>

          {/* UCSC EVENTS */}
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

          {/* PERSONAL EVENTS + TASKS (due that day) */}
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

/* -----------------------------------------------------------
   Marked Dates (events by date, tasks by dueDate)
----------------------------------------------------------- */

function generateMarkedDates(
  events: EventItem[],
  ucscEvents: UCSCEvent[],
  selectedDate: string
) {
  const marked: Record<string, any> = {};

  // Personal events + tasks
  events.forEach((ev) => {
    const dateKey =
      ev.type === 'task'
        ? normalizeDate(ev.dueDate)
        : normalizeDate(ev.date);

    if (!dateKey) return;

    if (!marked[dateKey]) marked[dateKey] = { dots: [] };

    const color = ev.type === 'task' ? '#4CAF50' : 'orange';

    if (!marked[dateKey].dots.some((d: any) => d.color === color)) {
      marked[dateKey].dots.push({ color });
    }

    marked[dateKey].markingType = 'multi-dot';
  });

  // UCSC events
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

  // Highlight selected date
  marked[selectedDate] = {
    ...(marked[selectedDate] || {}),
    selected: true,
    selectedColor: '#00adf5',
  };

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





// //previous calendar before adding the delete swipe feature 
// // app/(tabs)/calendar.tsx
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import { FlatList, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
// import { Calendar } from 'react-native-calendars';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';

// import SwipeableEventCard from '@/components/SwipeableEventCard';
// import UCSCEventCard from '@/components/UCSCEventCard';
// import { getUCSCEvents, UCSCEvent, EVENT_TYPE_COLORS } from '@/constants/UCSCEvents';

// type EventItem = {
//   id: string;
//   title: string;
//   note: string;
//   location: string;
//   date: string;
//   endDate: string;
//   completed?: boolean;
//   notificationId?: any;
// };

// export default function CalendarScreen() {
//   const [selectedDate, setSelectedDate] = useState(getToday());
//   const [events, setEvents] = useState<EventItem[]>([]);
//   const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
//   const [ucscEvents, setUcscEvents] = useState<UCSCEvent[]>([]);
//   const [filteredUcscEvents, setFilteredUcscEvents] = useState<UCSCEvent[]>([]);
//   const [showUCSCEvents, setShowUCSCEvents] = useState(true);

//   // Define loadEvents as a separate function
//   const loadEvents = async () => {
//     try {
//       const stored = await AsyncStorage.getItem('events');
//       const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
//       setEvents(parsed);
//     } catch (e) {
//       console.error('Failed to load event', e);
//     }
//   };

//   // Load UCSC events
//   const loadUCSCEvents = async () => {
//     try {
//       const ucscEventsData = await getUCSCEvents();
//       setUcscEvents(ucscEventsData);
//     } catch (e) {
//       console.error('Failed to load UCSC events', e);
//     }
//   };

//   // Load events whenever screen comes into focus
//   useFocusEffect(
//     React.useCallback(() => {
//       loadEvents();
//       loadUCSCEvents();
//     }, [])
//   );

//   useEffect(() => {
//     const filtered = events
//       .filter((event) => event.date.slice(0, 10) === selectedDate)
//       .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

//     const filteredUCSC = ucscEvents
//       .filter((event) => event.date.slice(0, 10) === selectedDate)
//       .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

//     setFilteredEvents(filtered);
//     setFilteredUcscEvents(filteredUCSC);
//   }, [selectedDate, events, ucscEvents]);

//   const handleToggleComplete = async (eventId: string) => {
//     try {
//       // Load all events
//       const stored = await AsyncStorage.getItem('events');
//       const allEvents: EventItem[] = stored ? JSON.parse(stored) : [];

//       // Toggle the completed status
//       const updated = allEvents.map((event) =>
//         event.id === eventId
//           ? { ...event, completed: !event.completed }
//           : event
//       );

//       // Save back to storage
//       await AsyncStorage.setItem('events', JSON.stringify(updated));

//       // Reload events
//       await loadEvents();
//     } catch (e) {
//       console.error('Failed to toggle completion', e);
//     }
//   };

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <View style={styles.container}>
//         <View style={styles.calendar}>
//           <Calendar
//             onDayPress={(day) => setSelectedDate(day.dateString)}
//             markedDates={generateMarkedDates(events, ucscEvents, selectedDate)}
//           />
//         </View>

//         <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
//           {/* Toggle Button */}
//           <TouchableOpacity
//             style={styles.toggleButton}
//             onPress={() => setShowUCSCEvents(!showUCSCEvents)}
//           >
//             <Text style={styles.toggleButtonText}>
//               {showUCSCEvents ? '🏛️ Hide UCSC Events' : '🏛️ Show UCSC Events'}
//             </Text>
//           </TouchableOpacity>

//           {/* UCSC Events Section */}
//           {showUCSCEvents && (
//             <>
//               <Text style={styles.sectionTitle}>🏛️ UCSC Events - {selectedDate}</Text>
//               {filteredUcscEvents.length === 0 ? (
//                 <Text style={styles.emptySection}>No UCSC events for this day</Text>
//               ) : (
//                 filteredUcscEvents.map((event) => (
//                   <UCSCEventCard key={event.id} event={event} />
//                 ))
//               )}
//             </>
//           )}

//           {/* Personal Events Section */}
//           <Text style={styles.sectionTitle}>📅 My Events - {selectedDate}</Text>
//           {filteredEvents.length === 0 ? (
//             <Text style={styles.emptySection}>No personal events for this day</Text>
//           ) : (
//             filteredEvents.map((event) => (
//               <SwipeableEventCard
//                 key={event.id}
//                 event={event}
//                 onToggleComplete={handleToggleComplete}
//               />
//             ))
//           )}
//         </ScrollView>
//       </View>
//     </GestureHandlerRootView>
//   );
// }

// function generateMarkedDates(events: EventItem[], ucscEvents: UCSCEvent[], selectedDate: string) {
//   const marked: { [date: string]: any } = {};

//   // Mark personal events
//   for (const event of events) {
//     const datekey = event.date.slice(0, 10);
//     if (!marked[datekey]) {
//       marked[datekey] = { dots: [] };
//     }
//     if (!marked[datekey].dots.some((dot: any) => dot.color === 'orange')) {
//       marked[datekey].dots.push({ color: 'orange' });
//     }
//   }

//   // Mark UCSC events
//   for (const event of ucscEvents) {
//     const datekey = event.date.slice(0, 10);
//     if (!marked[datekey]) {
//       marked[datekey] = { dots: [] };
//     }
//     if (!marked[datekey].dots.some((dot: any) => dot.color === EVENT_TYPE_COLORS[event.type])) {
//       marked[datekey].dots.push({ color: EVENT_TYPE_COLORS[event.type] });
//     }
//   }

//   // Apply multi-dot marking
//   Object.keys(marked).forEach(date => {
//     if (marked[date].dots && marked[date].dots.length > 0) {
//       marked[date].markingType = 'multi-dot';
//     }
//   });

//   // Highlight selected date
//   if (marked[selectedDate]) {
//     marked[selectedDate] = {
//       ...marked[selectedDate],
//       selected: true,
//       selectedColor: '#00adf5',
//     };
//   } else {
//     marked[selectedDate] = {
//       selected: true,
//       selectedColor: '#00adf5',
//     };
//   }

//   return marked;
// }

// function getToday() {
//   return new Date().toISOString().slice(0, 10);
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 10,
//   },
//   calendar: {
//     paddingTop: 90,
//   },
//   scrollContainer: {
//     flex: 1,
//     paddingTop: 10,
//   },
//   toggleButton: {
//     backgroundColor: '#2196F3',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   toggleButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginVertical: 12,
//     color: '#333',
//   },
//   emptySection: {
//     textAlign: 'center',
//     color: '#999',
//     marginTop: 10,
//     marginBottom: 20,
//     fontStyle: 'italic',
//   },
//   dateTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginVertical: 10,
//   },
//   empty: {
//     textAlign: 'center',
//     color: '#999',
//     marginTop: 20,
//   },
// });

// {/*// app/(tabs)/calendar.tsx old version
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Link } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// =======
// import { Link, useFocusEffect } from 'expo-router';
// import React, { useCallback, useState } from 'react';
// >>>>>>> 1ea7b9ffa50e5ca3809a1aa2fe3d86c4f0c28429
// import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { Calendar } from 'react-native-calendars';

// type EventItem = {
//   id: string;
//   title: string;
//   note: string;
//   location: string;
//   date: string;
//   endDate?: string;
// };

// // Convert ISO date string to local YYYY-MM-DD
// function toLocalDate(iso: string) {
//   const d = new Date(iso);
//   const year = d.getFullYear();
//   const month = (d.getMonth() + 1).toString().padStart(2, '0');
//   const day = d.getDate().toString().padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

// function getToday() {
//   const d = new Date();
//   const year = d.getFullYear();
//   const month = (d.getMonth() + 1).toString().padStart(2, '0');
//   const day = d.getDate().toString().padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

// export default function CalendarScreen() {
//   const [selectedDate, setSelectedDate] = useState(getToday());
//   const [events, setEvents] = useState<EventItem[]>([]);
//   const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);

//   useFocusEffect(
//     useCallback(() => {
//       const loadEvents = async () => {
//         try {
//           const stored = await AsyncStorage.getItem('events');
//           const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
//           setEvents(parsed);

//           // Filter events for today by default
//           const todayEvents = parsed
//             .filter((event) => toLocalDate(event.date) === selectedDate)
//             .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
//           setFilteredEvents(todayEvents);
//         } catch (e) {
//           console.error('Failed to load events', e);
//         }
//       };
//       loadEvents();
//     }, [selectedDate])
//   );

//   // Update filtered events whenever selectedDate or events change
//   React.useEffect(() => {
//     const filtered = events
//       .filter((event) => toLocalDate(event.date) === selectedDate)
//       .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

//     setFilteredEvents(filtered);
//   }, [selectedDate, events]);

//   // Generate marked dates for the calendar
//   function generateMarkedDates() {
//     const marked: { [date: string]: any } = {};

//     for (const event of events) {
//       const dateKey = toLocalDate(event.date);
//       if (!marked[dateKey]) {
//         marked[dateKey] = { marked: true, dotColor: 'orange' };
//       }
//     }

//     // Highlight selected date
//     if (marked[selectedDate]) {
//       marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#00adf5' };
//     } else {
//       marked[selectedDate] = { selected: true, selectedColor: '#00adf5' };
//     }

//     return marked;
//   }

//   function formatTime(dateStr: string) {
//     return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.calendar}>
//         <Calendar
//           onDayPress={(day) => setSelectedDate(day.dateString)}
//           markedDates={generateMarkedDates()}
//         />
//       </View>

//       <Text style={styles.dateTitle}>📅 {selectedDate} events:</Text>

//       {filteredEvents.length === 0 ? (
//         <Text style={styles.empty}>No plans for this day</Text>
//       ) : (
//         <FlatList
//           data={filteredEvents}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <Link
//               href={{ pathname: '/edit-event/[id]' as const, params: { id: item.id } }}
//               asChild
//             >
//               <TouchableOpacity style={styles.card}>
//                 <Text style={styles.eventTitle}>{item.title}</Text>
//                 <Text style={styles.eventTime}>
//                   {formatTime(item.date)} - {item.endDate ? formatTime(item.endDate) : ''}
//                 </Text>
//               </TouchableOpacity>
//             </Link>
//           )}
//           contentContainerStyle={{ paddingBottom: 120 }}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 10,
//   },
//   calendar: {
//     paddingTop: 90,
//   },
//   dateTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginVertical: 10,
//   },
//   empty: {
//     textAlign: 'center',
//     color: '#999',
//     marginTop: 20,
//   },
//   card: {
//     backgroundColor: '#f1f1f1',
//     padding: 12,
//     marginVertical: 6,
//     borderRadius: 8,
//   },
//   eventTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   eventTime: {
//     color: '#555',
//     marginTop: 4,
//   },
//   eventNote: {
//     color: '#777',
//     marginTop: 2,
//   },
// });

// */}