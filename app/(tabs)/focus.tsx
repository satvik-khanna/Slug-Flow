import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

type FocusSession = {
  id: string;
  startTime: string;
  duration: number; // in seconds
  dateKey: string;
};

export default function FocusScreen() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [selectedDuration, setSelectedDuration] = useState(1500); // 25 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  /* Load sessions */
  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem('focusSessions');
      setSessions(stored ? JSON.parse(stored) : []);
    } catch (err) {
      console.error('Failed loading sessions:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    setIsPaused(false);

    // Save session
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const newSession: FocusSession = {
      id: Date.now().toString(),
      startTime: now.toISOString(),
      duration: selectedDuration,
      dateKey,
    };

    try {
      const stored = await AsyncStorage.getItem('focusSessions');
      const all: FocusSession[] = stored ? JSON.parse(stored) : [];
      all.push(newSession);
      await AsyncStorage.setItem('focusSessions', JSON.stringify(all));
      setSessions(all);
      await loadSessions(); // Reload to update stats
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }, [selectedDuration]);

  /* Timer effect */
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeRemaining, handleTimerComplete]);

  const startTimer = () => {
    if (!isRunning) {
      setTimeRemaining(selectedDuration);
      setIsRunning(true);
      setIsPaused(false);
    } else if (isPaused) {
      setIsPaused(false);
    }
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* Statistics */
  const getTodayMinutes = () => {
    const today = new Date().toISOString().split('T')[0];
    return sessions
      .filter((s) => s.dateKey === today)
      .reduce((sum, s) => sum + s.duration, 0) / 60;
  };

  const getWeekMinutes = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return sessions
      .filter((s) => new Date(s.startTime) >= weekStart)
      .reduce((sum, s) => sum + s.duration, 0) / 60;
  };

  const getMonthMinutes = () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return sessions
      .filter((s) => {
        const d = new Date(s.startTime);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, s) => sum + s.duration, 0) / 60;
  };

  const getYearMinutes = () => {
    const year = new Date().getFullYear();

    return sessions
      .filter((s) => new Date(s.startTime).getFullYear() === year)
      .reduce((sum, s) => sum + s.duration, 0) / 60;
  };

  const presetTimes = [
    { label: '15 min', value: 900 },
    { label: '25 min', value: 1500 },
    { label: '45 min', value: 2700 },
    { label: '1 hour', value: 3600 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.iconCircle}>
              <Ionicons name="timer" size={28} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Focus Timer</Text>
          </View>
          <Text style={styles.headerSubtitle}>Stay focused and productive</Text>
        </View>

        {/* Timer Card */}
        <View style={styles.timerCard}>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>
              {isRunning ? formatTime(timeRemaining) : formatTime(selectedDuration)}
            </Text>
          </View>

          {!isRunning ? (
            <>
              {/* Time presets */}
              <View style={styles.presetsContainer}>
                {presetTimes.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.presetButton,
                      selectedDuration === preset.value && styles.presetButtonActive,
                    ]}
                    onPress={() => setSelectedDuration(preset.value)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedDuration === preset.value && styles.presetTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Start button */}
              <TouchableOpacity style={styles.startButton} onPress={startTimer}>
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles.startButtonText}>Start Focus</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Control buttons */
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={isPaused ? startTimer : pauseTimer}
              >
                <Ionicons name={isPaused ? 'play' : 'pause'} size={32} color="#00C853" />
                <Text style={styles.controlButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
                <Ionicons name="stop" size={32} color="#F44336" />
                <Text style={styles.controlButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="today" size={20} color="#00C853" />
            </View>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statValue}>{Math.round(getTodayMinutes())}m</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar" size={20} color="#2196F3" />
            </View>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>{Math.round(getWeekMinutes())}m</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#FF9800" />
            </View>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>{Math.round(getMonthMinutes())}m</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trophy" size={20} color="#9C27B0" />
            </View>
            <Text style={styles.statLabel}>This Year</Text>
            <Text style={styles.statValue}>{(getYearMinutes() / 60).toFixed(1)}h</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="bar-chart" size={24} color="#2196F3" />
            <Text style={styles.chartTitle}>Weekly Stats</Text>
          </View>
          <WeeklyChart sessions={sessions} />
        </View>

        {/* Monthly Calendar would go here */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="calendar" size={24} color="#FF9800" />
            <Text style={styles.chartTitle}>Monthly Overview</Text>
          </View>
          <MonthlyCalendar sessions={sessions} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* Weekly Chart Component */
const WeeklyChart = ({ sessions }: { sessions: FocusSession[] }) => {
  const getDayData = (dayOffset: number) => {
    const now = new Date();
    const day = new Date(now);
    day.setDate(now.getDate() - now.getDay() + dayOffset);
    const dateKey = day.toISOString().split('T')[0];

    const minutes = sessions
      .filter((s) => s.dateKey === dateKey)
      .reduce((sum, s) => sum + s.duration, 0) / 60;

    return minutes;
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [1, 2, 3, 4, 5, 6, 0].map((offset) => getDayData(offset));
  const maxValue = Math.max(...data, 60);

  const chartHeight = 150;
  const chartWidth = 300;
  const barWidth = 30;
  const gap = 10;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={chartWidth} height={chartHeight + 30}>
        {/* Y-axis label */}
        <SvgText x="0" y="15" fontSize="10" fill="#999">
          {maxValue}m
        </SvgText>

        {/* Bars */}
        {data.map((value, index) => {
          const xStart = 30 + index * (barWidth + gap);
          const barHeight = (value / maxValue) * (chartHeight - 20);

          return (
            <React.Fragment key={index}>
              <Rect
                x={xStart}
                y={chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                fill="#00C853"
                rx={4}
              />
              <SvgText
                x={xStart + barWidth / 2}
                y={chartHeight + 20}
                fontSize="10"
                fill="#666"
                textAnchor="middle"
              >
                {days[index]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

/* Monthly Calendar Component */
const MonthlyCalendar = ({ sessions }: { sessions: FocusSession[] }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getDayMinutes = (day: number) => {
    const dateKey = new Date(year, month, day).toISOString().split('T')[0];
    return sessions
      .filter((s) => s.dateKey === dateKey)
      .reduce((sum, s) => sum + s.duration, 0) / 60;
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const today = now.getDate();

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={styles.calendarHeaderText}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          if (!day) {
            return <View key={index} style={styles.calendarDay} />;
          }

          const minutes = getDayMinutes(day);
          const isToday = day === today;

          return (
            <View
              key={index}
              style={[
                styles.calendarDay,
                isToday && styles.calendarDayToday,
              ]}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  minutes > 0 && styles.calendarDayTextActive,
                  isToday && styles.calendarDayTextToday,
                ]}
              >
                {day}
              </Text>
              {minutes > 0 && (
                <View
                  style={[
                    styles.calendarDot,
                    {
                      backgroundColor:
                        minutes >= 120
                          ? '#1B5E20'
                          : minutes >= 60
                          ? '#4CAF50'
                          : minutes >= 30
                          ? '#81C784'
                          : '#C8E6C9',
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 60,
  },
  timerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerDisplay: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00C853',
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  presetButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#00C853',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  presetTextActive: {
    color: '#00C853',
  },
  startButton: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  controlButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendar: {
    marginTop: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendarHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calendarDayToday: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#666',
  },
  calendarDayTextActive: {
    fontWeight: 'bold',
    color: '#333',
  },
  calendarDayTextToday: {
    color: '#00C853',
    fontWeight: 'bold',
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
