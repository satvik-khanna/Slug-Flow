// app/edit-event/[id].tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type EventItem = {
  id: string;
  title: string;
  note?: string;
  location?: string;
  date: string;          // event start OR task created
  endDate?: string;      // events only
  dueDate?: string;      // tasks only
  completed?: boolean;
  notificationId?: any;
  type?: 'event' | 'task';
};

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();

  // Shared fields
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [completed, setCompleted] = useState(false);
  const [type, setType] = useState<'event' | 'task'>('event');
  const isTask = type === 'task';

  // Event date fields
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // Task-specific field
  const [dueDate, setDueDate] = useState(new Date());

  const [loading, setLoading] = useState(true);

  /** Load this event/task from storage */
  useEffect(() => {
    const loadItem = async () => {
      try {
        const stored = await AsyncStorage.getItem('events');
        const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

        const item = parsed.find((e) => e.id === id);
        if (!item) {
          Alert.alert('Not Found', 'This item may have been deleted.');
          router.back();
          return;
        }

        setTitle(item.title || '');
        setNote(item.note || '');
        setLocation(item.location || '');
        setCompleted(!!item.completed);

        if (item.type === 'task') {
          setType('task');
          setDueDate(item.dueDate ? new Date(item.dueDate) : new Date());
        } else {
          setType('event');
          setDate(item.date ? new Date(item.date) : new Date());
          setEndDate(item.endDate ? new Date(item.endDate) : new Date());
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load item:', err);
      }
    };

    loadItem();
  }, [id]);

  /** Toggle complete status */
  const handleToggleComplete = async () => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

      const updated = parsed.map((item) =>
        item.id === id ? { ...item, completed: !completed } : item
      );

      await AsyncStorage.setItem('events', JSON.stringify(updated));
      setCompleted((prev) => !prev);
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  /** Save changes */
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title.');
      return;
    }

    if (type === 'event') {
      if (date < new Date()) {
        alert('Event start time cannot be in the past.');
        return;
      }
      if (endDate <= date) {
        alert('End time must be after the start.');
        return;
      }
    }

    try {
      const stored = await AsyncStorage.getItem('events');
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

      const updated = parsed.map((item) => {
        if (item.id !== id) return item;

        if (type === 'task') {
          return {
            ...item,
            title,
            note,
            location,
            dueDate: dueDate.toISOString(),
            completed,
            type: 'task',
          };
        }

        // event
        return {
          ...item,
          title,
          note,
          location,
          date: date.toISOString(),
          endDate: endDate.toISOString(),
          completed,
          type: 'event',
        };
      });

      await AsyncStorage.setItem('events', JSON.stringify(updated));
      router.back();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Save failed.');
    }
  };

  /** Delete */
  const handleDelete = async () => {
    Alert.alert(
      'Delete',
      `Are you sure you want to delete this ${isTask ? 'task' : 'event'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem('events');
              const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
              const target = parsed.find((e) => e.id === id);

              if (target?.notificationId) {
                await Notifications.cancelScheduledNotificationAsync(
                  target.notificationId
                );
              }

              const filtered = parsed.filter((e) => e.id !== id);
              await AsyncStorage.setItem('events', JSON.stringify(filtered));
              router.back();
            } catch (err) {
              console.error('Delete failed:', err);
              alert('Delete failed.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <Text style={{ padding: 20 }}>Loading…</Text>;

  return (
    <View style={styles.container}>
      {completed && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedBannerText}>
            ✓ This {isTask ? 'task' : 'event'} is completed
          </Text>
        </View>
      )}

      <Text style={styles.label}>{isTask ? 'Task Title' : 'Event Title'}</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter title"
      />

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={note}
        onChangeText={setNote}
        placeholder="Details (optional)"
        multiline
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Location (optional)"
      />

      {/* ───────── TASK DATE ───────── */}
      {isTask && (
        <>
          <Text style={styles.label}>Due Date</Text>
          <DateTimePicker
            value={dueDate}
            mode="datetime"
            display="default"
            onChange={(_, selected) => selected && setDueDate(selected)}
          />
        </>
      )}

      {/* ───────── EVENT DATE/TIME ───────── */}
      {!isTask && (
        <>
          <Text style={styles.label}>Start Date / Time</Text>
          <DateTimePicker
            value={date}
            mode="datetime"
            display="default"
            onChange={(_, selected) => selected && setDate(selected)}
          />

          <Text style={styles.label}>End Date / Time</Text>
          <DateTimePicker
            value={endDate}
            mode="datetime"
            display="default"
            onChange={(_, selected) => selected && setEndDate(selected)}
          />
        </>
      )}

      {/* Buttons */}
      <View style={{ marginTop: 20 }}>
        <Button
          title={completed ? '↩️ Mark Incomplete' : '✓ Mark Complete'}
          onPress={handleToggleComplete}
          color={completed ? '#FF9800' : '#4CAF50'}
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button title="💾 Save" onPress={handleSave} />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button
          title={`❌ Delete ${isTask ? 'Task' : 'Event'}`}
          onPress={handleDelete}
          color="red"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  completedBanner: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  completedBannerText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});




//code before the app started crashing. 
// // app/edit-event/[id].tsx
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import * as Notifications from 'expo-notifications';
// import { router, useLocalSearchParams } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

// type EventItem = {
//   id: string;
//   title: string;
//   note: string;
//   location: string;
//   date: string;
//   endDate: string;
//   completed?: boolean;
//   notificationId: any;
// };

// export default function EditEventScreen() {
//   const { id } = useLocalSearchParams();
//   const [title, setTitle] = useState('');
//   const [note, setNote] = useState('');
//   const [location, setLocation] = useState('');
//   const [date, setDate] = useState(new Date());
//   const [endDate, setendDate] = useState(new Date());
//   const [completed, setCompleted] = useState(false);

//   const [loading, setLoading] = useState(true);

//   // Load event data
//   useEffect(() => {
//     const loadEvent = async () => {
//       try {
//         const stored = await AsyncStorage.getItem('events');
//         const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

//         const target = parsed.find((e) => e.id === id);
//         if (!target) {
//           Alert.alert('Event not found', 'The event may have been deleted');
//           router.back();
//           return;
//         }

//         setTitle(target.title);
//         setNote(target.note);
//         setLocation(target.location);
//         setDate(new Date(target.date));
//         setendDate(new Date(target.endDate));
//         setCompleted(target.completed || false);
//         setLoading(false);
//       } catch (e) {
//         console.error('Loading Fail', e);
//       }
//     };

//     loadEvent();
//   }, [id]);

//   // Toggle completion status
//   const handleToggleComplete = async () => {
//     try {
//       const stored = await AsyncStorage.getItem('events');
//       const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

//       const updated = parsed.map((event) =>
//         event.id === id
//           ? { ...event, completed: !completed }
//           : event
//       );

//       await AsyncStorage.setItem('events', JSON.stringify(updated));
//       setCompleted(!completed);
//     } catch (e) {
//       alert('Failed to update completion status');
//       console.error(e);
//     }
//   };

//   // Save event
//   const handleSave = async () => {
//     if (date < new Date()) {
//       alert('❌ Cannot set elapsed time');
//       return;
//     }
//     if (endDate <= date) {
//       alert('The end time must be later than the start time');
//       return;
//     }

//     try {
//       const stored = await AsyncStorage.getItem('events');
//       const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

//       const updated = parsed.map((event) =>
//         event.id === id
//           ? {
//               ...event,
//               title,
//               note,
//               location,
//               date: date.toISOString(),
//               endDate: endDate.toISOString(),
//               completed,
//             }
//           : event
//       );

//       await AsyncStorage.setItem('events', JSON.stringify(updated));
//       router.back();
//     } catch (e) {
//       alert('Save Fail');
//       console.error(e);
//     }
//   };

//   // Delete event
//   const handleDelete = async () => {
//     Alert.alert('Delete', 'Are you sure you want to delete this event?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             const stored = await AsyncStorage.getItem('events');
//             const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
//             const target = parsed.find((e) => e.id === id);
//             if (target?.notificationId) {
//               await Notifications.cancelScheduledNotificationAsync(target.notificationId);
//             }
//             const filtered = parsed.filter((e) => e.id !== id);
//             await AsyncStorage.setItem('events', JSON.stringify(filtered));
//             router.back();
//           } catch (e) {
//             alert('Delete Fail');
//             console.error(e);
//           }
//         },
//       },
//     ]);
//   };

//   if (loading) return <Text style={{ padding: 20 }}>Loading event...</Text>;

//   return (
//     <View style={styles.container}>
//       {completed && (
//         <View style={styles.completedBanner}>
//           <Text style={styles.completedBannerText}>✓ This event is marked as completed</Text>
//         </View>
//       )}

//       <Text style={styles.label}>Title</Text>
//       <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Please write Title" />

//       <Text style={styles.label}>Note</Text>
//       <TextInput
//         style={[styles.input, { height: 80 }]}
//         value={note}
//         onChangeText={setNote}
//         placeholder="Please write notes"
//         multiline
//       />

//       <Text style={styles.label}>Location</Text>
//       <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Please write location" />

//       <Text style={styles.label}>Start Date Time</Text>
//       <DateTimePicker
//         value={date}
//         mode="datetime"
//         display="default"
//         onChange={(_, selected) => {
//           if (selected) setDate(selected);
//         }}
//       />

//       <Text style={styles.label}>End Date Time</Text>
//       <DateTimePicker
//         value={endDate}
//         mode="datetime"
//         display="default"
//         onChange={(_, selected) => {
//           if (selected) setendDate(selected);
//         }}
//       />

//       <View style={{ marginTop: 20 }}>
//         <Button
//           title={completed ? '↩️ Mark as Incomplete' : '✓ Mark as Complete'}
//           onPress={handleToggleComplete}
//           color={completed ? '#ff9800' : '#4caf50'}
//         />
//       </View>

//       <View style={{ marginTop: 10 }}>
//         <Button title="💾 Save edit" onPress={handleSave} />
//       </View>

//       <View style={{ marginTop: 10 }}>
//         <Button title="❌ Delete event" onPress={handleDelete} color="red" />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   completedBanner: {
//     backgroundColor: '#4caf50',
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 15,
//   },
//   completedBannerText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginTop: 10,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 10,
//     borderRadius: 8,
//     marginTop: 5,
//   },
// });




// code before the previous code.
{/*// app/edit-event/[id].tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

type EventItem = {
  id: string;
  title: string;
  note: string;
  location: string;
  date: string;
  endDate: string;
  notificationId: any;
};

export default function EditEventScreen() {
  const { id } = useLocalSearchParams(); // 获取动态路由参数
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [endDate, setendDate] = useState(new Date());

  const [loading, setLoading] = useState(true);

  // 加载事件数据
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const stored = await AsyncStorage.getItem('events');
        const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

        const target = parsed.find((e) => e.id === id);
        if (!target) {
          Alert.alert('Event not found', 'The event may have been deleted');
          router.back();
          return;
        }

        setTitle(target.title);
        setNote(target.note);
        setLocation(target.location);
        setDate(new Date(target.date));
        setendDate(new Date(target.endDate));
        setLoading(false);
      } catch (e) {
        console.error('Loading Fail', e);
      }
    };

    loadEvent();
  }, [id]);

  // 保存事件
  const handleSave = async () => {
    if (date < new Date()) {
      alert('❌ Cannot set elapsed time');
      return;
    }
    if (endDate <= date) {
      alert('The end time must be later than the start time');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('events');
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

      const updated = parsed.map((event) =>
        event.id === id
          ? {
              ...event,
              title,
              note,
              location,
              date: date.toISOString(),
              endDate: endDate.toISOString(),
            }
          : event
      );

      await AsyncStorage.setItem('events', JSON.stringify(updated));
      router.back();
    } catch (e) {
      alert('Save Fail');
      console.error(e);
    }
  };

  // 删除事件
  const handleDelete = async () => {
    Alert.alert('Delete', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const stored = await AsyncStorage.getItem('events');
            const parsed: EventItem[] = stored ? JSON.parse(stored) : [];
            const target = parsed.find((e) => e.id === id);
            if (target?.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(target.notificationId);
            }
            const filtered = parsed.filter((e) => e.id !== id);
            await AsyncStorage.setItem('events', JSON.stringify(filtered));
            router.back();
          } catch (e) {
            alert('Delete Fail');
            console.error(e);
          }
        },
      },
    ]);
  };

  if (loading) return <Text style={{ padding: 20 }}>Loding event...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Please write Title" />

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={note}
        onChangeText={setNote}
        placeholder="Please write notes"
        multiline
      />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Please write loction" />

      <Text style={styles.label}>Start Date Time</Text>
      <DateTimePicker
        value={date}
        mode="datetime"
        display='default'
        onChange={(_, selected) => {
          if (selected) setDate(selected);
        }}
      />

      <Text style={styles.label}>End Date Time</Text>
      <DateTimePicker
        value={endDate}
        mode="datetime"
        display='default'
        onChange={(_, selected) => {
          if (selected) setendDate(selected);
        }}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Save edit" onPress={handleSave} />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button title="❌ Delete event" onPress={handleDelete} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20, backgroundColor: '#fff',
  },
  label: {
    fontSize: 16, fontWeight: 'bold', marginTop: 10,
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginTop: 5,
  },
});
*/}