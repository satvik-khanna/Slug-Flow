import { EVENT_TYPE_COLORS, UCSCEvent } from '@/constants/UCSCEvents';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type UCSCEventCardProps = {
  event: UCSCEvent;
};

// Clean escaped ICS strings like "Santa Cruz\, CA"
function cleanICSString(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

export default function UCSCEventCard({ event }: UCSCEventCardProps) {
  const start = new Date(event.date);
  const end = new Date(event.endDate);

  const startTime = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Clean location string from ICS
  const location = cleanICSString(event.location);

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.typeIndicator,
          { backgroundColor: EVENT_TYPE_COLORS[event.type] }
        ]}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>

        {/* TIME */}
        <Text style={styles.time}>
          {startTime} – {endTime}
        </Text>

        {/* LOCATION */}
        {location ? (
          <Text style={styles.location}>{location}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  typeIndicator: {
    width: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
    color: '#111',
  },
  time: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#777',
  },
});
