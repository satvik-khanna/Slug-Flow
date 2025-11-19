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
  date: string;
  endDate?: string;
  dueDate?: string;
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

        {timeRange && <Text style={styles.time}>{timeRange}</Text>}

        {dueDateText && <Text style={styles.dueDate}>📅 Due: {dueDateText}</Text>}

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
