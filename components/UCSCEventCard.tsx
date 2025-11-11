// components/UCSCEventCard.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UCSCEvent, EVENT_TYPE_COLORS } from '@/constants/UCSCEvents';

type Props = {
  event: UCSCEvent;
};

export default function UCSCEventCard({ event }: Props) {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={styles.card}>
      {/* Event type indicator */}
      <View 
        style={[
          styles.typeIndicator, 
          { backgroundColor: EVENT_TYPE_COLORS[event.type] }
        ]} 
      />
      
      <View style={styles.cardContent}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        
        <Text style={styles.eventTime}>
          🕒 {formatTime(event.date)} - {formatTime(event.endDate)}
        </Text>
        
        <Text style={styles.eventLocation}>
          📍 {event.location}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typeIndicator: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
  },
});