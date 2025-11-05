// components/SwipeableEventCard.tsx
import { Link } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

export type EventItem = {
  id: string;
  title: string;
  note: string;
  location: string;
  date: string;
  endDate?: string;
  completed?: boolean;
  notificationId?: any;
  type?: 'event' | 'task'; 
};

type Props = {
  event: EventItem;
  onToggleComplete?: (id: string) => void; 
};

export default function SwipeableEventCard({ event, onToggleComplete }: Props) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (event.type !== 'task' || !onToggleComplete) return null;

    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <RectButton
        style={styles.completeButton}
        onPress={() => {
          onToggleComplete(event.id);
          swipeableRef.current?.close();
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text style={styles.completeButtonText}>
            {event.completed ? '↩ Undo' : '✓ Complete'}
          </Text>
        </Animated.View>
      </RectButton>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <Link href={`/edit-event/${event.id}` as const} asChild>
        <TouchableOpacity
          style={[
            styles.card,
            event.completed && styles.completedCard,
          ]}
        >
          <View style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.eventTitle,
                  event.completed && styles.completedText,
                ]}
              >
                {event.completed && '✓ '}
                {event.title}
              </Text>

              {/* 🕒 Show date/time differently for tasks vs events */}
              {event.type === 'event' && event.endDate ? (
                <Text
                  style={[
                    styles.eventTime,
                    event.completed && styles.completedText,
                  ]}
                >
                  {new Date(event.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  ~{' '}
                  {new Date(event.endDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.eventTime,
                    event.completed && styles.completedText,
                  ]}
                >
                  {new Date(event.date).toLocaleString()}
                </Text>
              )}
            </View>

            {event.completed && (
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Link>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
  },
  completedCard: {
    backgroundColor: '#e8f5e9',
    opacity: 0.7,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: 15,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});











//before updating. 





// // components/SwipeableEventCard.tsx
// import { Link } from 'expo-router';
// import React, { useRef } from 'react';
// import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { RectButton, Swipeable } from 'react-native-gesture-handler';

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

// type Props = {
//   event: EventItem;
//   onToggleComplete: (id: string) => void;
// };

// export default function SwipeableEventCard({ event, onToggleComplete }: Props) {
//   const swipeableRef = useRef<Swipeable>(null);

//   const renderRightActions = (
//     progress: Animated.AnimatedInterpolation<number>,
//     dragX: Animated.AnimatedInterpolation<number>
//   ) => {
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
//       renderRightActions={renderRightActions}
//       rightThreshold={40}
//       overshootRight={false}
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
//               <Text
//                 style={[
//                   styles.eventTime,
//                   event.completed && styles.completedText,
//                 ]}
//               >
//                 {new Date(event.date).toLocaleTimeString([], {
//                   hour: '2-digit',
//                   minute: '2-digit',
//                 })}{' '}
//                 ~{' '}
//                 {new Date(event.endDate).toLocaleTimeString([], {
//                   hour: '2-digit',
//                   minute: '2-digit',
//                 })}
//               </Text>
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
//     width: 100,
//     marginBottom: 15,
//     borderTopRightRadius: 10,
//     borderBottomRightRadius: 10,
//   },
//   completeButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });