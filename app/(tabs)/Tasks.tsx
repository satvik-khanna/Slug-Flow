// app/(tabs)/Tasks.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableEventCard, { EventItem } from '../../components/SwipeableEventCard';

type TaskItem = EventItem & {
  type: 'task';
};

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<'incomplete' | 'completed'>('incomplete');

  // Load tasks from storage
  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

      const filtered: TaskItem[] = parsed
        .filter((item: any) => item.type === 'task')
        .map((item: any) => ({
          ...item,
          completed: !!item.completed,
          type: 'task' as const,
        }));

      setTasks(filtered);
    } catch (err) {
      console.log('Error loading tasks:', err);
    }
  };

  // Refresh whenever user focuses Tasks tab
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

// 🔁 Toggle completion (used by right-swipe)
const handleToggleComplete = async (taskId: string) => {
  // 1. Optimistic UI update – flip completed in local state
  setTasks((prev) =>
    prev.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
  );

  // 2. Sync to AsyncStorage
  try {
    const stored = await AsyncStorage.getItem('events');
    const allItems = stored ? JSON.parse(stored) : [];

    const updated = allItems.map((item: any) =>
      item.id === taskId && item.type === 'task'
        ? { ...item, completed: !item.completed }
        : item
    );

    await AsyncStorage.setItem('events', JSON.stringify(updated));
  } catch (err) {
    console.log('Error toggling task:', err);
  }
};


  // Delete task completely (used by left-swipe)
  const handleDeleteTask = async (taskId: string) => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const allItems = stored ? JSON.parse(stored) : [];

      const filtered = allItems.filter((item: any) => item.id !== taskId);

      await AsyncStorage.setItem('events', JSON.stringify(filtered));
      loadTasks();
    } catch (err) {
      console.log('Error deleting task:', err);
    }
  };

  // Lists
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const displayedTasks =
    filter === 'incomplete' ? incompleteTasks : completedTasks;

  // Task progress bar
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progress = totalTasks === 0 ? 0 : completedCount / totalTasks;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>📝 My Tasks</Text>

          {/* Task Progress */}
          <View style={{ marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              📊 Task Progress
            </Text>

            {totalTasks > 0 ? (
              <>
                <Progress.Bar
                  progress={progress}
                  width={300}
                  color="#4CAF50"
                  borderRadius={10}
                />
                <Text style={{ marginTop: 6, color: '#555' }}>
                  {completedCount} / {totalTasks} tasks completed
                </Text>
              </>
            ) : (
              <Text style={{ color: '#888' }}>No tasks added yet</Text>
            )}
          </View>

          {/* Filter buttons instead of dropdown */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                filter === 'incomplete' && styles.toggleButtonActive,
              ]}
              onPress={() => setFilter('incomplete')}
            >
              <Text
                style={[
                  styles.toggleText,
                  filter === 'incomplete' && styles.toggleTextActive,
                ]}
              >
                Incomplete ({incompleteTasks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                filter === 'completed' && styles.toggleButtonActive,
              ]}
              onPress={() => setFilter('completed')}
            >
              <Text
                style={[
                  styles.toggleText,
                  filter === 'completed' && styles.toggleTextActive,
                ]}
              >
                Completed ({completedTasks.length})
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {filter === 'incomplete'
              ? `You still have ${incompleteTasks.length} task${
                  incompleteTasks.length === 1 ? '' : 's'
                } to do.`
              : `You have completed ${completedTasks.length} task${
                  completedTasks.length === 1 ? '' : 's'
                }.`}
          </Text>

          {/* Task list under the selected button */}
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {displayedTasks.length === 0 ? (
              <Text style={styles.empty}>
                {filter === 'incomplete'
                  ? 'No incomplete tasks. You are all caught up!'
                  : 'No completed tasks yet. Finish a task to see it here.'}
              </Text>
            ) : (
              displayedTasks.map((task) => (
                <SwipeableEventCard
                  key={task.id}
                  event={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  toggleText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  empty: {
    marginTop: 40,
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
});

//working version of the app before adding the delete swipe feature and segregating the incomplete and ocmpleted tasks. 
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from 'expo-router';
// import React, { useCallback, useState } from 'react';
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import * as Progress from 'react-native-progress';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import SwipeableEventCard from '../../components/SwipeableEventCard';

// type TaskItem = {
//   id: string;
//   title: string;
//   note?: string;
//   date: string;
//   completed?: boolean;
//   type: 'task';
// };

// export default function Tasks() {
//   const [tasks, setTasks] = useState<TaskItem[]>([]);
//   const [filter, setFilter] = useState<'incomplete' | 'completed'>('incomplete');
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);

//   // 🔄 Load tasks (runs whenever screen is focused)
//   const loadTasks = async () => {
//     try {
//       const stored = await AsyncStorage.getItem('events');
//       const parsed = stored ? JSON.parse(stored) : [];

//       const filtered: TaskItem[] = parsed
//         .filter((item: any) => item.type === 'task')
//         .map((item: any) => ({
//           ...item,
//           completed: !!item.completed,
//         }));

//       setTasks(filtered);
//     } catch (err) {
//       console.log('Error loading tasks:', err);
//     }
//   };

//   // 🔄 Refresh tasks every time user enters Tasks tab
//   useFocusEffect(
//     useCallback(() => {
//       loadTasks();
//     }, [])
//   );

//   // 🔁 Toggle completion for tasks
//   const handleToggleComplete = async (taskId: string) => {
//     try {
//       const stored = await AsyncStorage.getItem('events');
//       const allItems = stored ? JSON.parse(stored) : [];

//       const updated = allItems.map((item: any) =>
//         item.id === taskId && item.type === 'task'
//           ? { ...item, completed: !item.completed }
//           : item
//       );

//       // Save back
//       await AsyncStorage.setItem('events', JSON.stringify(updated));

//       // Reload tasks
//       loadTasks();
//     } catch (err) {
//       console.log('Error toggling task:', err);
//     }
//   };

//   // ─── FILTERED TASK LIST ─────────────────────────────────────────────
//   const incompleteTasks = tasks.filter((t) => !t.completed);
//   const completedTasks = tasks.filter((t) => t.completed);
//   const displayedTasks =
//     filter === 'incomplete' ? incompleteTasks : completedTasks;

//   // ─── TASK PROGRESS BAR (ONLY TASKS) ─────────────────────────────────
//   const totalTasks = tasks.length;
//   const completedCount = tasks.filter((t) => t.completed).length;
//   const progress =
//     totalTasks === 0 ? 0 : completedCount / totalTasks;

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <SafeAreaView style={{ flex: 1 }}>
//         <View style={styles.container}>
//           <Text style={styles.title}>📝 My Tasks</Text>

//           {/* Task Progress */}
//           <View style={{ marginBottom: 20, alignItems: 'center' }}>
//             <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
//               📊 Task Progress
//             </Text>

//             {totalTasks > 0 ? (
//               <>
//                 <Progress.Bar
//                   progress={progress}
//                   width={300}
//                   color="#4CAF50"
//                   borderRadius={10}
//                 />
//                 <Text style={{ marginTop: 6, color: '#555' }}>
//                   {completedCount} / {totalTasks} tasks completed
//                 </Text>
//               </>
//             ) : (
//               <Text style={{ color: '#888' }}>No tasks added yet</Text>
//             )}
//           </View>

//           <Text style={styles.subtitle}>
//             {filter === 'incomplete'
//               ? 'These are the tasks you still need to do.'
//               : 'These are the tasks you have completed.'}
//           </Text>

//           {/* Filter dropdown */}
//           <View style={styles.filterContainer}>
//             <TouchableOpacity
//               style={styles.dropdown}
//               onPress={() => setIsDropdownOpen((prev) => !prev)}
//             >
//               <Text style={styles.dropdownText}>
//                 {filter === 'incomplete' ? 'Incomplete tasks' : 'Completed tasks'}
//               </Text>
//             </TouchableOpacity>

//             {isDropdownOpen && (
//               <View style={styles.dropdownOptions}>
//                 <TouchableOpacity
//                   style={styles.dropdownOption}
//                   onPress={() => {
//                     setFilter('incomplete');
//                     setIsDropdownOpen(false);
//                   }}
//                 >
//                   <Text style={styles.dropdownOptionText}>Incomplete tasks</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={styles.dropdownOption}
//                   onPress={() => {
//                     setFilter('completed');
//                     setIsDropdownOpen(false);
//                   }}
//                 >
//                   <Text style={styles.dropdownOptionText}>Completed tasks</Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>

//           {/* Task list */}
//           <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
//             {displayedTasks.length === 0 ? (
//               <Text style={styles.empty}>
//                 {filter === 'incomplete'
//                   ? 'No incomplete tasks. You are all caught up!'
//                   : 'No completed tasks yet. Finish a task to see it here.'}
//               </Text>
//             ) : (
//               displayedTasks.map((task) => (
//                 <SwipeableEventCard
//                   key={task.id}
//                   event={task}
//                   onToggleComplete={handleToggleComplete}
//                 />
//               ))
//             )}
//           </ScrollView>
//         </View>
//       </SafeAreaView>
//     </GestureHandlerRootView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 12,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#555',
//     marginBottom: 12,
//   },
//   filterContainer: {
//     marginBottom: 12,
//   },
//   dropdown: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 8,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     justifyContent: 'center',
//   },
//   dropdownText: {
//     fontSize: 14,
//     color: '#333',
//   },
//   dropdownOptions: {
//     marginTop: 6,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 8,
//     backgroundColor: '#f9f9f9',
//     overflow: 'hidden',
//   },
//   dropdownOption: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//   },
//   dropdownOptionText: {
//     fontSize: 14,
//     color: '#333',
//   },
//   empty: {
//     marginTop: 40,
//     fontSize: 16,
//     color: '#777',
//     textAlign: 'center',
//   },
// });