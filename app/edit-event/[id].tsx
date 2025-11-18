// app/edit-event/[id].tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

type EventItem = {
  id: string;
  title: string;
  note?: string;
  location?: string;
  date: string;
  endDate?: string;
  completed?: boolean;
  notificationId?: any;
  type?: 'event' | 'task';
};

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [completed, setCompleted] = useState(false);
  const [type, setType] = useState<'event' | 'task'>('event');

  const [loading, setLoading] = useState(true);

  const isTask = type === 'task';

  // Load event / task data
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const stored = await AsyncStorage.getItem('events');
        const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

        const target = parsed.find((e) => e.id === id);
        if (!target) {
          Alert.alert('Item not found', 'It may have been deleted.');
          router.back();
          return;
        }

        setTitle(target.title ?? '');
        setNote(target.note ?? '');
        setLocation(target.location ?? '');
        setType(target.type === 'task' ? 'task' : 'event');

        // Always use valid Date objects (avoid Invalid Date crashes)
        const baseDate = target.date ? new Date(target.date) : new Date();
        setDate(baseDate);

        if (target.endDate) {
          setEndDate(new Date(target.endDate));
        } else {
          // Tasks may not have an endDate – default to same as start
          setEndDate(baseDate);
        }

        setCompleted(!!target.completed);
        setLoading(false);
      } catch (e) {
        console.error('Loading failed:', e);
      }
    };

    loadEvent();
  }, [id]);

  // Toggle completion status
  const handleToggleComplete = async () => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

      const updated = parsed.map((item) =>
        item.id === id ? { ...item, completed: !completed } : item
      );

      await AsyncStorage.setItem('events', JSON.stringify(updated));
      setCompleted((prev) => !prev);
    } catch (e) {
      alert('Failed to update completion status');
      console.error(e);
    }
  };

  // Save event / task
  const handleSave = async () => {
    // For events, keep the strict time validation
    if (!isTask) {
      if (date < new Date()) {
        alert('❌ Cannot set a start time in the past.');
        return;
      }
      if (endDate <= date) {
        alert('The end time must be later than the start time.');
        return;
      }
    }

    try {
      const stored = await AsyncStorage.getItem('events');
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

      const updated = parsed.map((item) => {
        if (item.id !== id) return item;

        const base: EventItem = {
          ...item,
          title,
          note,
          location,
          date: date.toISOString(),
          completed,
          type, // keep original type (event or task)
        };

        // Only events care about endDate
        if (!isTask) {
          base.endDate = endDate.toISOString();
        }

        return base;
      });

      await AsyncStorage.setItem('events', JSON.stringify(updated));
      router.back();
    } catch (e) {
      alert('Save failed');
      console.error(e);
    }
  };

  // Delete event / task
  const handleDelete = async () => {
    Alert.alert(
      'Delete',
      isTask
        ? 'Are you sure you want to delete this task?'
        : 'Are you sure you want to delete this event?',
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

              // Only events typically have notifications
              if (target?.notificationId) {
                await Notifications.cancelScheduledNotificationAsync(
                  target.notificationId
                );
              }

              const filtered = parsed.filter((e) => e.id !== id);
              await AsyncStorage.setItem('events', JSON.stringify(filtered));
              router.back();
            } catch (e) {
              alert('Delete failed');
              console.error(e);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Text style={{ padding: 20 }}>Loading item...</Text>;
  }

  return (
    <View style={styles.container}>
      {completed && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedBannerText}>
            ✓ This {isTask ? 'task' : 'event'} is marked as completed
          </Text>
        </View>
      )}

      <Text style={styles.label}>{isTask ? 'Task Title' : 'Event Title'}</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder={isTask ? 'Enter task title' : 'Enter event title'}
      />

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={note}
        onChangeText={setNote}
        placeholder="Add notes (optional)"
        multiline
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Enter location (optional)"
      />

      <Text style={styles.label}>
        {isTask ? 'Task Date / Time' : 'Start Date Time'}
      </Text>
      <DateTimePicker
        value={date}
        mode="datetime"
        display="default"
        onChange={(_, selected) => {
          if (selected) setDate(selected);
        }}
      />

      {!isTask && (
        <>
          <Text style={styles.label}>End Date Time</Text>
          <DateTimePicker
            value={endDate}
            mode="datetime"
            display="default"
            onChange={(_, selected) => {
              if (selected) setEndDate(selected);
            }}
          />
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <Button
          title={
            completed ? '↩️ Mark as Incomplete' : '✓ Mark as Complete'
          }
          onPress={handleToggleComplete}
          color={completed ? '#ff9800' : '#4caf50'}
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  completedBanner: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  completedBannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
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