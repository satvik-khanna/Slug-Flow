import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddHabitScreen() {
  const [name, setName] = useState('');
  const [timesPerWeek, setTimesPerWeek] = useState('3');
  const [durationType, setDurationType] = useState<'date' | 'months'>('months');
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  });
  const [months, setMonths] = useState('3');

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter a habit name');
      return;
    }

    const times = parseInt(timesPerWeek, 10);
    if (isNaN(times) || times < 1 || times > 7) {
      Alert.alert('Invalid input', 'Times per week must be between 1 and 7');
      return;
    }

    let habitData: any = {
      id: Date.now().toString(),
      name: name.trim(),
      timesPerWeek: times,
      completions: {},
      createdAt: new Date().toISOString(),
    };

    if (durationType === 'date') {
      habitData.endDate = endDate.toISOString();
    } else {
      const monthsNum = parseInt(months, 10);
      if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 12) {
        Alert.alert('Invalid input', 'Months must be between 1 and 12');
        return;
      }
      habitData.months = monthsNum;
    }

    try {
      const stored = await AsyncStorage.getItem('habits');
      const list = stored ? JSON.parse(stored) : [];
      list.push(habitData);
      await AsyncStorage.setItem('habits', JSON.stringify(list));
      router.back();
    } catch (err) {
      console.error('Error saving habit:', err);
      Alert.alert('Error', 'Failed to save habit');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Habit',
          headerTitleAlign: 'center',
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
          <View style={styles.iconSquare}>
            <Ionicons name="flame" size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Create New Habit</Text>
          <Text style={styles.headerSubtitle}>Build a lasting routine</Text>
        </View>

        {/* Habit Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Habit Details</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="text-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Habit name (e.g., Exercise, Read)"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={timesPerWeek}
              onChangeText={setTimesPerWeek}
              placeholder="Times per week"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.frequencyHint}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.hintText}>
              Aim for {timesPerWeek || '0'} completions per week
            </Text>
          </View>
        </View>

        {/* Duration Card */}
        <View style={styles.card}>
          <View style={styles.durationHeader}>
            <Ionicons name="time-outline" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Duration</Text>
          </View>

          <View style={styles.durationTabs}>
            <TouchableOpacity
              style={[
                styles.durationTab,
                durationType === 'months' && styles.durationTabActive,
              ]}
              onPress={() => setDurationType('months')}
            >
              <Text
                style={[
                  styles.durationTabText,
                  durationType === 'months' && styles.durationTabTextActive,
                ]}
              >
                Months
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.durationTab,
                durationType === 'date' && styles.durationTabActive,
              ]}
              onPress={() => setDurationType('date')}
            >
              <Text
                style={[
                  styles.durationTabText,
                  durationType === 'date' && styles.durationTabTextActive,
                ]}
              >
                End Date
              </Text>
            </TouchableOpacity>
          </View>

          {durationType === 'months' ? (
            <View style={styles.monthsInputContainer}>
              <Ionicons
                name="calendar-number-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={months}
                onChangeText={setMonths}
                placeholder="Number of months"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </View>
          ) : (
            <View style={styles.datePickerSection}>
              <View style={styles.dateTimePickerContainer}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.dateTimeText}>
                  {endDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(_, selected) => {
                  if (selected) setEndDate(selected);
                }}
                minimumDate={new Date()}
                style={styles.datePicker}
              />
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="bulb-outline" size={20} color="#FF9800" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Tip for success</Text>
            <Text style={styles.infoText}>
              Start small and be consistent. It takes about 66 days to form a new
              habit.
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Create Habit</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

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
  iconSquare: {
    width: 64,
    height: 64,
    borderRadius: 16,
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
  durationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  frequencyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: -8,
  },
  hintText: {
    fontSize: 13,
    color: '#666',
  },
  durationTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  durationTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  durationTabActive: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },
  durationTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  durationTabTextActive: {
    color: '#fff',
  },
  monthsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerSection: {
    gap: 12,
  },
  dateTimePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  datePicker: {
    alignSelf: 'flex-start',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
