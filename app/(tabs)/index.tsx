// app/(tabs)/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
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

  // Notification permission
  useEffect(() => {
    const registerForPushNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          alert('⛔ Notification permission not granted. Reminders will not work.');
        }
      }
    };
    registerForPushNotifications();
  }, []);

  // Load today’s events/tasks
  useFocusEffect(
    React.useCallback(() => {
      const loadEvents = async () => {
        try {
          const stored = await AsyncStorage.getItem('events');
          const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
          const today = getTodayISO();

          const filtered = parsed
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

  // Weekly progress bar (events + tasks)
  useEffect(() => {
    const loadWeeklyStats = async () => {
      try {
        const stored = await AsyncStorage.getItem('events');
        const allItems: EventItem[] = stored ? JSON.parse(stored) : [];

        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday
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

  // Toggle complete for tasks (on Home)
  const handleToggleComplete = async (eventId: string) => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const allItems: EventItem[] = stored ? JSON.parse(stored) : [];

      const updated = allItems.map((item) =>
        item.id === eventId && item.type === 'task'
          ? { ...item, completed: !item.completed }
          : item
      );

      await AsyncStorage.setItem('events', JSON.stringify(updated));

      const today = getTodayISO();
      const filtered = updated
        .filter((item) => item.date.slice(0, 10) === today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(filtered);
    } catch (e) {
      console.error('Failed to toggle completion:', e);
    }
  };

  // NEW: Delete for events + tasks (on Home)
  const handleDeleteItem = async (eventId: string) => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const allItems: EventItem[] = stored ? JSON.parse(stored) : [];

      const target = allItems.find((e) => e.id === eventId);

      // Cancel notification if there is one
      if (target?.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(target.notificationId);
        } catch (e) {
          console.warn('Failed to cancel notification:', e);
        }
      }

      const updated = allItems.filter((e) => e.id !== eventId);
      await AsyncStorage.setItem('events', JSON.stringify(updated));

      const today = getTodayISO();
      const filtered = updated
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
        <Text style={styles.title}>📅 Today's Schedule</Text>

        {/* Weekly progress */}
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
                {weeklyStats.completed} / {weeklyStats.total} tasks/events completed
              </Text>
            </>
          ) : (
            <Text style={{ color: '#888' }}>No events or tasks this week</Text>
          )}
        </View>

        {/* List of events + tasks */}
        <View style={styles.listContainer}>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SwipeableEventCard
                event={item}
                onToggleComplete={item.type === 'task' ? handleToggleComplete : undefined}
                onDelete={handleDeleteItem}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No Schedule Yet</Text>}
          />
        </View>

        {/* Add buttons */}
        <View style={styles.buttonContainer}>
          <Button title="➕ Add Event" onPress={() => router.push('/add-event')} />
          <View style={{ height: 10 }} />
          <Button title="📝 Add Task" onPress={() => router.push('/add-task')} />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    paddingBottom: 150,
  },
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







//before adding the delete feature here. 
// // app/(tabs)/index.tsx
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Notifications from 'expo-notifications';
// import { router, useFocusEffect } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import * as Progress from 'react-native-progress';

// import type { EventItem } from '@/components/SwipeableEventCard'; // ✅ shared type import (no duplicate)
// import SwipeableEventCard from '@/components/SwipeableEventCard';


// // --- Helpers ---
// const today = new Date().toLocaleDateString('en-US', {
//   weekday: 'long',
//   year: 'numeric',
//   month: 'long',
//   day: 'numeric',
// });

// function getToday() {
//   return new Date().toISOString().slice(0, 10);
// }


// // --- Component ---
// export default function HomeScreen() {
//   const [events, setEvents] = useState<EventItem[]>([]);
//   const [weeklyStats, setWeeklyStats] = useState({ total: 0, completed: 0 });

//   // ✅ Ask for notification permission
//   useEffect(() => {
//     const registerForPushNotifications = async () => {
//       const { status } = await Notifications.getPermissionsAsync();
//       if (status !== 'granted') {
//         const { status: newStatus } = await Notifications.requestPermissionsAsync();
//         if (newStatus !== 'granted') {
//           alert('⛔ Notification permission not granted. Reminders will not work.');
//         }
//       }
//     };
//     registerForPushNotifications();
//   }, []);


//   // ✅ Load events/tasks for today
//   useFocusEffect(
//     React.useCallback(() => {
//       const loadEvents = async () => {
//         try {
//           const stored = await AsyncStorage.getItem('events');
//           const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
//           const today = getToday();
//           const filtered = parsed
//             .filter((item) => item.date.slice(0, 10) === today)
//             .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

//           setEvents(filtered);
//         } catch (e) {
//           console.error('Failed to load events:', e);
//         }
//       };
//       loadEvents();
//     }, [])
//   );


//   // ✅ Weekly progress bar
//   useEffect(() => {
//     const loadWeeklyStats = async () => {
//       try {
//         const stored = await AsyncStorage.getItem('events');
//         const allItems: EventItem[] = stored ? JSON.parse(stored) : [];

//         const now = new Date();
//         const dayOfWeek = now.getDay(); // 0 = Sunday
//         const sundayStart = new Date(now);
//         sundayStart.setDate(now.getDate() - dayOfWeek);
//         sundayStart.setHours(0, 0, 0, 0);

//         const sundayEnd = new Date(sundayStart);
//         sundayEnd.setDate(sundayStart.getDate() + 7);
//         sundayEnd.setHours(23, 59, 59, 999);

//         const weeklyItems = allItems.filter((item) => {
//           const itemDate = new Date(item.date);
//           return itemDate >= sundayStart && itemDate < sundayEnd;
//         });

//         const total = weeklyItems.length;
//         const completed = weeklyItems.filter((e) => e.completed).length;
//         setWeeklyStats({ total, completed });
//       } catch (e) {
//         console.error('Failed to load weekly stats:', e);
//       }
//     };

//     loadWeeklyStats();
//   }, [events]);


//   // ✅ Toggle complete/incomplete for tasks only
//   const handleToggleComplete = async (eventId: string) => {
//     try {
//       const stored = await AsyncStorage.getItem('events');
//       const allItems: EventItem[] = stored ? JSON.parse(stored) : [];

//       const updated = allItems.map((item) =>
//         item.id === eventId && item.type === 'task'
//           ? { ...item, completed: !item.completed }
//           : item
//       );

//       await AsyncStorage.setItem('events', JSON.stringify(updated));

//       const today = getToday();
//       const filtered = updated
//         .filter((item) => item.date.slice(0, 10) === today)
//         .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

//       setEvents(filtered);
//     } catch (e) {
//       console.error('Failed to toggle completion:', e);
//     }
//   };


//   // --- UI ---
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <View style={styles.container}>
//         <Text style={{ fontSize: 20, marginTop: 35, marginBottom: 5 }}>{today}</Text>
//         <Text style={styles.title}>📅 Today's Schedule</Text>

//         {/* Weekly progress */}
//         <View style={{ marginBottom: 20, alignItems: 'center' }}>
//           <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
//             📊 Weekly Progress
//           </Text>

//           {weeklyStats.total > 0 ? (
//             <>
//               <Progress.Bar
//                 progress={weeklyStats.completed / weeklyStats.total}
//                 width={300}
//                 color="#4CAF50"
//                 borderRadius={10}
//               />
//               <Text style={{ marginTop: 6, color: '#555' }}>
//                 {weeklyStats.completed} / {weeklyStats.total} tasks/events completed
//               </Text>
//             </>
//           ) : (
//             <Text style={{ color: '#888' }}>No events or tasks this week</Text>
//           )}
//         </View>

//         {/* List of events + tasks */}
//         <View style={styles.listContainer}>
//           <FlatList
//             data={events}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <SwipeableEventCard
//                 event={item}
//                 onToggleComplete={item.type === 'task' ? handleToggleComplete : undefined}
//               />
//             )}
//             ListEmptyComponent={<Text style={styles.empty}>No Schedule Yet</Text>}
//           />
//         </View>

//         {/* Add buttons */}
//         <View style={styles.buttonContainer}>
//           <Button title="➕ Add Event" onPress={() => router.push('/add-event')} />
//           <View style={{ height: 10 }} />
//           <Button title="📝 Add Task" onPress={() => router.push('/add-task')} />
//         </View>
//       </View>
//     </GestureHandlerRootView>
//   );
// }


// // --- Styles ---
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   listContainer: {
//     flex: 1,
//     paddingBottom: 150,
//   },
//   buttonContainer: {
//     position: 'absolute',
//     bottom: 100,
//     left: 20,
//     right: 20,
//   },
//   empty: {
//     fontSize: 18,
//     color: '#888',
//     textAlign: 'center',
//     marginTop: 50,
//   },
// });
















// #2iteration of the code .
// // app/(tabs)/index.tsx newer version
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Notifications from 'expo-notifications';
// import { router, useFocusEffect } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';

// import SwipeableEventCard from '@/components/SwipeableEventCard';
// import * as Progress from 'react-native-progress';

// type EventItem = {
//   id: string;
//   title: string;
//   note: string;
//   location: string;
//   date: string;
//   endDate: string;
//   completed?: boolean;
//   notificationId?: any;
//   ype?: 'event' | 'task';
// };

// const today = new Date().toLocaleDateString('en-US', {
//   weekday: 'long',
//   year: 'numeric',
//   month: 'long',
//   day: 'numeric',
// });

// function getToday() {
//   return new Date().toISOString().slice(0, 10);
// }

// export default function HomeScreen() {
//   const [events, setEvents] = useState<EventItem[]>([]);

//   useEffect(() => {
//     const registerForPushNotifications = async () => {
//       const { status } = await Notifications.getPermissionsAsync();
//       if (status !== 'granted') {
//         const { status: newStatus } = await Notifications.requestPermissionsAsync();
//         if (newStatus !== 'granted') {
//           alert('⛔ If the notification permission is not granted, the reminder function will not be available.');
//         }
//       }
//     };

//     registerForPushNotifications();
//   }, []);

//   useFocusEffect(
//     React.useCallback(() => {
//       const loadEvents = async () => {
//         try {
//           const stored = await AsyncStorage.getItem('events');
//           const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
//           const today = getToday();
//           const filtered = parsed
//             .filter((event) => event.date.slice(0, 10) === today)
//             .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

//           setEvents(filtered);
//         } catch (e) {
//           console.error('load events fail', e);
//         }
//       };
//       loadEvents();
//     }, [])
//   );

//   const [weeklyStats, setWeeklyStats] = useState({ total: 0, completed: 0 });

//   useEffect(() => {
//     const loadWeeklyStats = async () => {
//       try {
//         const stored = await AsyncStorage.getItem('events');
//         const allEvents: EventItem[] = stored ? JSON.parse(stored) : [];

//         const now = new Date();
//         const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
      
//         // Get this week's Sunday (start) and next Sunday (end)
//         const sundayStart = new Date(now);
//         sundayStart.setDate(now.getDate() - dayOfWeek);
//         sundayStart.setHours(0, 0, 0, 0);

//         const sundayEnd = new Date(sundayStart);
//         sundayEnd.setDate(sundayStart.getDate() + 7);
//         sundayEnd.setHours(23, 59, 59, 999);

//         // Filter events that fall within this week (Sunday to Sunday)
//         const weeklyEvents = allEvents.filter((event) => {
//           const eventDate = new Date(event.date);
//           return eventDate >= sundayStart && eventDate < sundayEnd;
//         });

//         const total = weeklyEvents.length;
//         const completed = weeklyEvents.filter((e) => e.completed).length;

//         setWeeklyStats({ total, completed });
//       } catch (e) {
//         console.error('Failed to load weekly stats', e);
//       }
//     };

//     loadWeeklyStats();
//   }, [events]);


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

//       // Update local state for today's events
//       const today = getToday();
//       const filtered = updated
//         .filter((event) => event.date.slice(0, 10) === today)
//         .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

//       setEvents(filtered);
//     } catch (e) {
//       console.error('Failed to toggle completion', e);
//     }
//   };

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <View style={styles.container}>
//         <Text style={{ fontSize: 20, marginTop: 35, marginBottom: 5 }}>
//           {today}
//         </Text>
//         <Text style={styles.title}>📅 Today's Schedule</Text>

//         {/* Weekly progress bar */}
//         <View style={{ marginBottom: 20, alignItems: 'center' }}>
//           <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
//             📊 Weekly Progress
//           </Text>

//           {weeklyStats.total > 0 ? (
//             <>
//               <Progress.Bar
//                 progress={weeklyStats.completed / weeklyStats.total}
//                 width={300}
//                 color="#4CAF50"
//                 borderRadius={10}
//               />
//               <Text style={{ marginTop: 6, color: '#555' }}>
//                 {weeklyStats.completed} / {weeklyStats.total} events completed
//               </Text>
//             </>
//           ) : (
//             <Text style={{ color: '#888' }}>No events created this week</Text>
//           )}
//         </View>

//         <View style={styles.listContainer}>
//           <FlatList
//             data={events}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <SwipeableEventCard
//                 event={item}
//                 onToggleComplete={item.type === 'task' ? handleToggleComplete : undefined}
//               />
//             )}
//             ListEmptyComponent={<Text style={styles.empty}>No Schedule Yet</Text>}
//           />
//         </View>

//         <View style={styles.buttonContainer}>
//           <Button title="➕ Add Event" onPress={() => router.push('/add-event')} />
//           // task update 
        
//           <View style={{ height: 10 }} />
//           <Button title="📝 Add Task" onPress={() => router.push('/add-task')} />
          
//         </View>
//       </View>
//     </GestureHandlerRootView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   listContainer: {
//     flex: 1,
//     paddingBottom: 150,
//   },
//   buttonContainer: {
//     position: 'absolute',
//     bottom: 100,
//     left: 20,
//     right: 20,
//   },
//   empty: {
//     fontSize: 18,
//     color: '#888',
//     textAlign: 'center',
//     marginTop: 50,
//   },
// });

//previous code below 










{/*// app/(tabs)/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Link, router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';



// 模拟今日日程数据（后续会用 AsyncStorage 替代）
const todayEvents = [
  { id: '1', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '2', title: 'Math Exam Review', time: '2:00 PM' },
  { id: '3', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '4', title: 'Math Exam Review', time: '2:00 PM' },
  { id: '5', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '6', title: 'Math Exam Review', time: '2:00 PM' },
  { id: '7', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '8', title: 'Math Exam Review', time: '2:00 PM' },
  { id: '9', title: 'CS101 Lecture', time: '10:00 AM' },
  { id: '10', title: 'Math Exam Review', time: '2:00 PM' },
];

type EventItem = {
  id: string;
  title: string;
  note: string;
  location: string;
  date: string; // ISO 时间字符串
  endDate: string;
};

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          alert('⛔ If the notification permission is not granted, the reminder function will not be available.');
        }
      }
    };

    registerForPushNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadEvents = async () => {
        try {
          const stored = await AsyncStorage.getItem('events');
          const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
          const today = getToday();
          const filtered = parsed
              .filter((event) => event.date.slice(0, 10) === today)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          setEvents(filtered);
        } catch (e) {
          console.error('load events fail', e);
        }
      };
      loadEvents();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20, marginTop: 35, marginBottom: 5 }}>
        {today}
      </Text>
      <Text style={styles.title}>📅 Today's Schedule</Text>

      <View style={styles.listContainer}>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={`/edit-event/${item.id}` as const} asChild>

              {/*Swipeable cards with complete functionality
                

              <TouchableOpacity style={styles.card}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>
                  {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>


            </Link>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No Events Scheduled Yet</Text>}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="➕ Add Event" onPress={() => router.push('/add-event')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20, backgroundColor: '#fff',
  },
  title: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    paddingBottom: 150,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  empty: {
    fontSize: 18, color: '#888', textAlign: 'center', marginTop: 50,
  },
  card: {
    backgroundColor: '#f0f0f0', padding: 15, marginBottom: 15,
    borderRadius: 10,
  },
  eventTitle: {
    fontSize: 18, fontWeight: '600',
  },
  eventTime: {
    fontSize: 16, color: '#666', marginTop: 4,
  },
});

*/}