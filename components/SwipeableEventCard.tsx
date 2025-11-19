import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

export type EventItem = {
  id: string;
  title: string;
  note?: string;
  location?: string;
  date: string;      // event start
  endDate?: string;  // event end
  dueDate?: string;  // task
  completed?: boolean;
  notificationId?: any;
  type?: 'event' | 'task';
};

type Props = {
  event: EventItem;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function formatTime(d: string | undefined) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SwipeableEventCard({
  event,
  onToggleComplete,
  onDelete,
}: Props) {
  const isTask = event.type === "task";

  const timeRange =
    !isTask && event.date && event.endDate
      ? `${formatTime(event.date)} – ${formatTime(event.endDate)}`
      : null;

  const dueDateText =
    isTask && event.dueDate
      ? new Date(event.dueDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  const renderLeft = () =>
    isTask ? (
      <TouchableOpacity
        style={styles.actionLeft}
        onPress={() => onToggleComplete && onToggleComplete(event.id)}
      >
        <Text style={styles.actionText}>✓</Text>
      </TouchableOpacity>
    ) : null;

  const renderRight = () => (
    <TouchableOpacity
      style={styles.actionRight}
      onPress={() => onDelete && onDelete(event.id)}
    >
      <Text style={styles.actionText}>🗑️</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      renderLeftActions={isTask ? renderLeft : undefined}
      renderRightActions={renderRight}
    >
      <View style={[styles.card, event.completed && styles.completedCard]}>
        <Text style={[styles.title, event.completed && styles.completedText]}>
          {event.title}
        </Text>

        {/* EVENT TIME RANGE */}
        {timeRange && <Text style={styles.time}>{timeRange}</Text>}

        {/* TASK DUE DATE */}
        {dueDateText && <Text style={styles.dueDate}>📅 Due: {dueDateText}</Text>}

        {/* NOTE */}
        {event.note ? <Text style={styles.note}>{event.note}</Text> : null}
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedCard: { opacity: 0.5 },
  title: { fontSize: 17, fontWeight: "600" },
  completedText: { textDecorationLine: "line-through", color: "#777" },

  time: {
    marginTop: 4,
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },

  dueDate: {
    marginTop: 4,
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },

  note: { marginTop: 6, fontSize: 14, color: "#666" },

  actionLeft: {
    width: 70,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  actionRight: {
    width: 70,
    backgroundColor: "#e53935",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: { color: "white", fontSize: 26, fontWeight: "bold" },
});



//calendar issue where event doesnt have delete swipe feauture.
// // components/SwipeableEventCard.tsx
// import { Link } from 'expo-router';
// import React, { useRef, useState } from 'react';
// import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { RectButton, Swipeable } from 'react-native-gesture-handler';

// export type EventItem = {
//   id: string;
//   title: string;
//   note: string;
//   location: string;
//   date: string;
//   endDate?: string;
//   completed?: boolean;
//   notificationId?: any;
//   type?: 'event' | 'task';
// };

// type Props = {
//   event: EventItem;
//   onToggleComplete?: (id: string) => void;
//   onDelete?: (id: string) => void;
// };

// export default function SwipeableEventCard({ event, onToggleComplete, onDelete }: Props) {
//   const swipeableRef = useRef<Swipeable>(null);

//   // 👇 NEW: track if right actions (Complete/Undo) are open
//   const [isRightOpen, setIsRightOpen] = useState(false);

//   // Right actions: Complete / Undo
//   const renderRightActions = (
//     progress: Animated.AnimatedInterpolation<number>,
//     dragX: Animated.AnimatedInterpolation<number>
//   ) => {
//     if (event.type !== 'task' || !onToggleComplete) return null;

//     const scale = dragX.interpolate({
//       inputRange: [-100, 0],
//       outputRange: [1, 0],
//       extrapolate: 'clamp',
//     });

//     return (
//       <RectButton
//         style={styles.completeButton}
//         onPress={() => {
//           onToggleComplete(event.id);
//           swipeableRef.current?.close();
//         }}
//       >
//         <Animated.View style={{ transform: [{ scale }] }}>
//           <Text style={styles.completeButtonText}>
//             {event.completed ? '↩ Undo' : '✓ Complete'}
//           </Text>
//         </Animated.View>
//       </RectButton>
//     );
//   };

//   // Left actions: Delete
//   const renderLeftActions = (
//     progress: Animated.AnimatedInterpolation<number>,
//     dragX: Animated.AnimatedInterpolation<number>
//   ) => {
//     if (!onDelete) return null;

//     const scale = dragX.interpolate({
//       inputRange: [0, 100],
//       outputRange: [0, 1],
//       extrapolate: 'clamp',
//     });

//     return (
//       <RectButton
//         style={styles.deleteButton}
//         onPress={() => {
//           onDelete(event.id);
//           swipeableRef.current?.close();
//         }}
//       >
//         <Animated.View style={{ transform: [{ scale }] }}>
//           <Text style={styles.deleteButtonText}>🗑 Delete</Text>
//         </Animated.View>
//       </RectButton>
//     );
//   };

//   return (
//     <Swipeable
//       ref={swipeableRef}
//       renderRightActions={renderRightActions}
//       renderLeftActions={renderLeftActions}
//       rightThreshold={40}
//       leftThreshold={40}
//       overshootRight={false}
//       overshootLeft={false}
//       // 👇 these callbacks control isRightOpen
//       onSwipeableRightOpen={() => setIsRightOpen(true)}
//       onSwipeableClose={() => setIsRightOpen(false)}
//     >
//       <Link href={`/edit-event/${event.id}` as const} asChild>
//         <TouchableOpacity
//           style={[
//             styles.card,
//             event.completed && styles.completedCard,
//           ]}
//         >
//           <View style={styles.cardContent}>
//             <View style={styles.textContainer}>
//               <Text
//                 style={[
//                   styles.eventTitle,
//                   event.completed && styles.completedText,
//                 ]}
//               >
//                 {event.completed && '✓ '}
//                 {event.title}
//               </Text>

//               {/* Time formatting: events vs tasks */}
//               {event.type === 'event' && event.endDate ? (
//                 <Text
//                   style={[
//                     styles.eventTime,
//                     event.completed && styles.completedText,
//                   ]}
//                 >
//                   {new Date(event.date).toLocaleTimeString([], {
//                     hour: '2-digit',
//                     minute: '2-digit',
//                   })}{' '}
//                   ~{' '}
//                   {new Date(event.endDate).toLocaleTimeString([], {
//                     hour: '2-digit',
//                     minute: '2-digit',
//                   })}
//                 </Text>
//               ) : (
//                 <Text
//                   style={[
//                     styles.eventTime,
//                     event.completed && styles.completedText,
//                   ]}
//                 >
//                   {new Date(event.date).toLocaleString()}
//                 </Text>
//               )}
//             </View>

//             {/* ✅ Only show checkmark when completed AND not currently swiping right */}
//             {event.completed && !isRightOpen && (
//               <View style={styles.checkmarkContainer}>
//                 <Text style={styles.checkmark}>✓</Text>
//               </View>
//             )}
//           </View>
//         </TouchableOpacity>
//       </Link>
//     </Swipeable>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: '#f0f0f0',
//     padding: 15,
//     marginBottom: 15,
//     borderRadius: 10,
//   },
//   completedCard: {
//     backgroundColor: '#e8f5e9',
//     opacity: 0.7,
//   },
//   cardContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   textContainer: {
//     flex: 1,
//   },
//   eventTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   eventTime: {
//     fontSize: 16,
//     color: '#666',
//     marginTop: 4,
//   },
//   completedText: {
//     textDecorationLine: 'line-through',
//     color: '#999',
//   },
//   checkmarkContainer: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#4caf50',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },
//   checkmark: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   completeButton: {
//     backgroundColor: '#4caf50',
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: 110,
//     marginBottom: 15,
//     borderTopRightRadius: 10,
//     borderBottomRightRadius: 10,
//   },
//   completeButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   deleteButton: {
//     backgroundColor: '#e53935',
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: 110,
//     marginBottom: 15,
//     borderTopLeftRadius: 10,
//     borderBottomLeftRadius: 10,
//   },
//   deleteButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });




//the green checkmark issue.
// // components/SwipeableEventCard.tsx
// import { Link } from 'expo-router';
// import React, { useRef } from 'react';
// import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { RectButton, Swipeable } from 'react-native-gesture-handler';

// export type EventItem = {
//   id: string;
//   title: string;
//   note?: string;
//   location?: string;
//   date: string;
//   endDate?: string;
//   completed?: boolean;
//   notificationId?: any;
//   type?: 'event' | 'task';
// };

// type Props = {
//   event: EventItem;
//   onToggleComplete?: (id: string) => void;
//   onDelete?: (id: string) => void;
// };

// export default function SwipeableEventCard({ event, onToggleComplete, onDelete }: Props) {
//   const swipeableRef = useRef<Swipeable>(null);

//   // LEFT → RIGHT swipe = Delete
//   const renderLeftActions = (
//     progress: Animated.AnimatedInterpolation<number>,
//     dragX: Animated.AnimatedInterpolation<number>
//   ) => {
//     if (!onDelete) return null;

//     const scale = dragX.interpolate({
//       inputRange: [0, 100],
//       outputRange: [0, 1],
//       extrapolate: 'clamp',
//     });

//     return (
//       <RectButton
//         style={styles.deleteButton}
//         onPress={() => {
//           onDelete(event.id);
//           swipeableRef.current?.close();
//         }}
//       >
//         <Animated.View style={{ transform: [{ scale }] }}>
//           <Text style={styles.deleteButtonText}>🗑 Delete</Text>
//         </Animated.View>
//       </RectButton>
//     );
//   };

//   // RIGHT → LEFT swipe = Complete / Undo (tasks only)
//   const renderRightActions = (
//     progress: Animated.AnimatedInterpolation<number>,
//     dragX: Animated.AnimatedInterpolation<number>
//   ) => {
//     if (event.type !== 'task' || !onToggleComplete) return null;

//     const scale = dragX.interpolate({
//       inputRange: [-100, 0],
//       outputRange: [1, 0],
//       extrapolate: 'clamp',
//     });

//     return (
//       <RectButton
//         style={styles.completeButton}
//         onPress={() => {
//           onToggleComplete(event.id);
//           swipeableRef.current?.close();
//         }}
//       >
//         <Animated.View style={{ transform: [{ scale }] }}>
//           <Text style={styles.completeButtonText}>
//             {event.completed ? '↩ Undo' : '✓ Complete'}
//           </Text>
//         </Animated.View>
//       </RectButton>
//     );
//   };

//   return (
//     <Swipeable
//       ref={swipeableRef}
//       renderLeftActions={renderLeftActions}
//       renderRightActions={renderRightActions}
//       rightThreshold={40}
//       leftThreshold={40}
//       overshootRight={false}
//       overshootLeft={false}
//     >
//       <Link href={`/edit-event/${event.id}` as const} asChild>
//         <TouchableOpacity
//           style={[
//             styles.card,
//             event.completed && styles.completedCard,
//           ]}
//         >
//           <View style={styles.cardContent}>
//             <View style={styles.textContainer}>
//               <Text
//                 style={[
//                   styles.eventTitle,
//                   event.completed && styles.completedText,
//                 ]}
//               >
//                 {event.completed && '✓ '}
//                 {event.title}
//               </Text>

//               {/* Time formatting – tasks show full timestamp, events show range */}
//               {event.type === 'event' && event.endDate ? (
//                 <Text
//                   style={[
//                     styles.eventTime,
//                     event.completed && styles.completedText,
//                   ]}
//                 >
//                   {new Date(event.date).toLocaleTimeString([], {
//                     hour: '2-digit',
//                     minute: '2-digit',
//                   })}{' '}
//                   ~{' '}
//                   {new Date(event.endDate).toLocaleTimeString([], {
//                     hour: '2-digit',
//                     minute: '2-digit',
//                   })}
//                 </Text>
//               ) : (
//                 <Text
//                   style={[
//                     styles.eventTime,
//                     event.completed && styles.completedText,
//                   ]}
//                 >
//                   {new Date(event.date).toLocaleString()}
//                 </Text>
//               )}
//             </View>

//             {event.completed && (
//               <View style={styles.checkmarkContainer}>
//                 <Text style={styles.checkmark}>✓</Text>
//               </View>
//             )}
//           </View>
//         </TouchableOpacity>
//       </Link>
//     </Swipeable>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: '#f0f0f0',
//     padding: 15,
//     marginBottom: 15,
//     borderRadius: 10,
//   },
//   completedCard: {
//     backgroundColor: '#e8f5e9',
//     opacity: 0.7,
//   },
//   cardContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   textContainer: {
//     flex: 1,
//   },
//   eventTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   eventTime: {
//     fontSize: 16,
//     color: '#666',
//     marginTop: 4,
//   },
//   completedText: {
//     textDecorationLine: 'line-through',
//     color: '#999',
//   },
//   checkmarkContainer: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#4caf50',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },
//   checkmark: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   completeButton: {
//     backgroundColor: '#4caf50',
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: 110,
//     marginBottom: 15,
//     borderTopRightRadius: 10,
//     borderBottomRightRadius: 10,
//   },
//   completeButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   deleteButton: {
//     backgroundColor: '#e53935',
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: 110,
//     marginBottom: 15,
//     borderTopLeftRadius: 10,
//     borderBottomLeftRadius: 10,
//   },
//   deleteButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

