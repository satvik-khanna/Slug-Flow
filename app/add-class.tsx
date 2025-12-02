import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';

import { ALL_UCSC_COURSES, UCSCCourse } from "@/constants/Courses";

/* ---------------------------------------------------------
   Winter Quarter 2026 boundaries (PST)
--------------------------------------------------------- */
const WINTER_START = new Date(2026, 0, 5, 0, 0, 0, 0);
const WINTER_END = new Date(2026, 2, 13, 23, 59, 59, 999);

/* Day mapping */
const DAY_MAP: Record<string, number> = {
  M: 1,
  Tu: 2,
  W: 3,
  Th: 4,
  F: 5,
  Sa: 6,
  Su: 0,
};

/* Parse time like "01:20PM" */
function parseTime(str: string | null) {
  if (!str) return null;
  const match = str.match(/(\d{1,2}):(\d{2})(AM|PM)/i);
  if (!match) return null;

  let [_, hh, mm, mer] = match;
  let hour = parseInt(hh, 10);
  const minute = parseInt(mm, 10);

  if (mer.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (mer.toUpperCase() === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

/* Build PST date */
function buildLocalDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  min = 0
) {
  return new Date(year, month, day, hour, min, 0, 0);
}

/* ---------------------------------------------------------
   Create 10-week recurring class events
--------------------------------------------------------- */
function createEventsFromCourse(course: UCSCCourse) {
  const events: any[] = [];

  if (!course.days.length || !course.start || !course.end) return [];

  const startParsed = parseTime(course.start);
  const endParsed = parseTime(course.end);

  if (!startParsed || !endParsed) return [];

  const dayOffsets = course.days
    .map((d) => DAY_MAP[d])
    .filter((n) => n != null);

  if (!dayOffsets.length) return [];

  for (let week = 0; week < 10; week++) {
    for (const weekday of dayOffsets) {
      const classDate = buildLocalDate(2026, 0, 5 + (weekday - 1) + week * 7);

      if (classDate < WINTER_START || classDate > WINTER_END) continue;

      const startDate = buildLocalDate(
        classDate.getFullYear(),
        classDate.getMonth(),
        classDate.getDate(),
        startParsed.hour,
        startParsed.minute
      );

      const endDate = buildLocalDate(
        classDate.getFullYear(),
        classDate.getMonth(),
        classDate.getDate(),
        endParsed.hour,
        endParsed.minute
      );

      events.push({
        id: `${course.division}-${course.number}-${course.section}-${week}-${weekday}-${Date.now()}`,
        title: `${course.division} ${course.number} - ${course.title}`,
        note: `Section ${course.section}`,
        location: course.location ?? "",
        date: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: "event",
      });
    }
  }

  return events;
}

/* ---------------------------------------------------------
   UI Component
--------------------------------------------------------- */
export default function AddClassScreen() {
  const [division, setDivision] = useState("");
  const [number, setNumber] = useState("");
  const [matches, setMatches] = useState<UCSCCourse[]>([]);

  const findMatches = () => {
    const d = division.trim().toUpperCase();
    const n = number.trim();

    if (!d || !n) {
      Alert.alert("Missing info", "Enter BOTH division and number");
      return;
    }

    const filtered = ALL_UCSC_COURSES.filter(
      (c) => c.division.toUpperCase() === d && c.number === n
    );

    if (filtered.length === 0) {
      Alert.alert("Not found", "No matching UCSC class found.");
    }

    setMatches(filtered);
  };

  const addCourse = async (course: UCSCCourse) => {
    const newEvents = createEventsFromCourse(course);

    if (!newEvents.length) {
      Alert.alert("Error", "Unable to generate class meetings.");
      return;
    }

    try {
      const stored = await AsyncStorage.getItem("events");
      const current = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem(
        "events",
        JSON.stringify([...current, ...newEvents])
      );
      Alert.alert("Success", "Class added to your schedule!");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save class.");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add UCSC Class",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#00C853" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="school" size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Add UCSC Class</Text>
          <Text style={styles.headerSubtitle}>Search for your courses</Text>
        </View>

        {/* Search Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Course Information</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="book-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={division}
              onChangeText={setDivision}
              placeholder="Division (e.g., CSE, AM, BIO)"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="list-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={number}
              onChangeText={setNumber}
              placeholder="Course Number (e.g., 101, 20, 160)"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={findMatches}>
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>Search Classes</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {matches.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#00C853" />
              <Text style={styles.resultsHeaderText}>
                Found {matches.length} section{matches.length > 1 ? 's' : ''}
              </Text>
            </View>

            {matches.map((c, index) => (
              <TouchableOpacity
                key={index}
                style={styles.classCard}
                onPress={() => addCourse(c)}
              >
                <View style={styles.classHeader}>
                  <View style={styles.classCodeContainer}>
                    <Text style={styles.classCode}>
                      {c.division} {c.number}-{c.section}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#00C853" />
                </View>

                <Text style={styles.classTitle}>{c.title}</Text>

                <View style={styles.classDetails}>
                  <View style={styles.classDetailRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.classDetailText}>
                      {c.days.join("")} {c.start} – {c.end}
                    </Text>
                  </View>

                  {c.location && (
                    <View style={styles.classDetailRow}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.classDetailText}>{c.location}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

/* ---------------------------------------------------------
   Styles
--------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  searchButton: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginHorizontal: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  classCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  classCodeContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  classCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00C853',
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  classDetails: {
    gap: 8,
  },
  classDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classDetailText: {
    fontSize: 14,
    color: '#666',
  },
});
