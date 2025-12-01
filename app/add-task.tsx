// app/add-task.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Button,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddTaskScreen() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");

  const [priority, setPriority] = useState(""); // NEW FIELD

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0); // today at 11:59 PM
    return d;
  });

  const [showPicker, setShowPicker] = useState(false);

  /* --------------------------- SAVE TASK --------------------------- */
  const handleAdd = async () => {
    if (!title.trim()) {
      alert("⚠️ Please enter a task title");
      return;
    }

    if (!priority.trim()) {
      alert("⚠️ Please enter a priority from 1–5");
      return;
    }

    const p = parseInt(priority, 10);
    if (isNaN(p) || p < 1 || p > 5) {
      alert("⚠️ Priority must be a number between 1–5");
      return;
    }

    const now = new Date();
    if (dueDate < now) {
      alert("⚠️ Due date cannot be in the past");
      return;
    }

    let notificationId: string | undefined;
    try {
      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📝 Task due: ${title}`,
          body: note || "Your task is due soon.",
          sound: true,
        },
        trigger: dueDate as any,
      });
    } catch (e) {
      console.warn("⚠️ Unable to schedule notification:", e);
    }

    const newTask = {
      id: Date.now().toString(),
      title,
      note,
      location,
      priority: p, // NEW FIELD
      date: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      completed: false,
      type: "task",
      notificationId,
    };

    try {
      const stored = await AsyncStorage.getItem("events");
      const list = stored ? JSON.parse(stored) : [];
      list.push(newTask);
      await AsyncStorage.setItem("events", JSON.stringify(list));
      router.back();
    } catch (err) {
      console.error("❌ Error saving task:", err);
      alert("❌ Failed to save task.");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Task",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: "600", color: "#007AFF" }}>
                Back
              </Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.container}>
        <Text style={styles.label}>Task Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter task title" />

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={note}
          onChangeText={setNote}
          placeholder="Enter note"
          multiline
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location (optional)"
        />

        {/* Priority */}
        <Text style={styles.label}>Priority (1–5)</Text>
        <TextInput
          style={styles.input}
          value={priority}
          onChangeText={setPriority}
          keyboardType="numeric"
          placeholder="1 = Low, 5 = High"
        />

        <Text style={styles.label}>Due Date & Time</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
          <Text>{dueDate.toLocaleString()}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={dueDate}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDueDate(selectedDate);
            }}
          />
        )}

        <View style={{ marginTop: 30 }}>
          <Button title="💾 Save Task" onPress={handleAdd} />
        </View>
      </View>
    </>
  );
}

/* --------------------------- STYLES --------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
});
