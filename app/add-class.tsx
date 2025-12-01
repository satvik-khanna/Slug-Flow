// app/add-class.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";

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
      {/* MATCHING BACK HEADER */}
      <Stack.Screen
        options={{
          title: "Add UCSC Class",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: 12 }}
            >
              <Text style={{ fontSize: 17, fontWeight: "600", color: "#007AFF" }}>
                Back
              </Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        <Text style={styles.title}>📘 Add UCSC Class</Text>

        <Text style={styles.label}>Division (e.g., CSE, AM, BIO)</Text>
        <TextInput
          style={styles.input}
          value={division}
          onChangeText={setDivision}
          placeholder="Enter division"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Course Number (e.g., 101, 20, 160)</Text>
        <TextInput
          style={styles.input}
          value={number}
          onChangeText={setNumber}
          placeholder="Enter course number"
          keyboardType="numeric"
        />

        <Button title="Search Classes" onPress={findMatches} />

        {matches.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Matching Sections:</Text>

            {matches.map((c, index) => (
              <TouchableOpacity
                key={index}
                style={styles.classCard}
                onPress={() => addCourse(c)}
              >
                <Text style={styles.classTitle}>
                  {c.division} {c.number}-{c.section}
                </Text>
                <Text>{c.title}</Text>
                <Text>
                  {c.days.join("")} {c.start}–{c.end}
                </Text>
                <Text>{c.location}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </>
  );
}

/* ---------------------------------------------------------
   Styles
--------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  sectionHeader: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
  classCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 10,
  },
  classTitle: {
    fontWeight: "bold",
    marginBottom: 3,
  },
});
