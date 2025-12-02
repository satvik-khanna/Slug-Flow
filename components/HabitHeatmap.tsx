import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Habit = {
  id: string;
  name: string;
  timesPerWeek: number;
  endDate?: string;
  months?: number;
  completions: Record<string, number>;
  createdAt: string;
};

type Props = {
  habit: Habit;
  onDayPress: (dateKey: string) => void;
};

export default function HabitHeatmap({ habit, onDayPress }: Props) {
  const getCellColor = (count: number) => {
    if (count === 0) return '#E8E8E8';
    if (count === 1) return '#C8E6C9';
    if (count === 2) return '#81C784';
    return '#00C853';
  };

  const getWeeksData = () => {
    const weeks: { date: Date; dateKey: string; count: number }[][] = [];
    const today = new Date();

    // Go back 3 months
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 3);
    startDate.setDate(1); // Start of that month

    // Find the Sunday before or on startDate
    const firstSunday = new Date(startDate);
    const dayOfWeek = firstSunday.getDay();
    firstSunday.setDate(startDate.getDate() - dayOfWeek);

    let currentWeek: { date: Date; dateKey: string; count: number }[] = [];
    const currentDate = new Date(firstSunday);

    // Generate weeks until today
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const count = habit.completions[dateKey] || 0;

      currentWeek.push({
        date: new Date(currentDate),
        dateKey,
        count,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill the last week if incomplete
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      const dateKey = currentDate.toISOString().split('T')[0];
      currentWeek.push({
        date: new Date(currentDate),
        dateKey,
        count: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const getMonthLabels = (weeks: { date: Date; dateKey: string; count: number }[][]) => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
      const month = week[0].date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          month: week[0].date.toLocaleDateString('en-US', { month: 'short' }),
          index,
        });
        lastMonth = month;
      }
    });

    return labels;
  };

  const weeks = getWeeksData();
  const monthLabels = getMonthLabels(weeks);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={styles.container}>
      {/* Month labels */}
      <View style={styles.monthLabels}>
        <View style={{ width: 36 }} />
        {monthLabels.map((label, i) => (
          <Text key={i} style={styles.monthLabel}>
            {label.month}
          </Text>
        ))}
      </View>

      {/* Heatmap grid */}
      <View style={styles.gridContainer}>
        {/* Day labels on the left */}
        <View style={styles.dayLabelsColumn}>
          {[0, 2, 4].map((dayIndex) => (
            <View key={dayIndex} style={styles.dayLabelContainer}>
              <Text style={styles.dayLabel}>{dayLabels[dayIndex]}</Text>
            </View>
          ))}
        </View>

        {/* Weeks grid */}
        <View style={styles.weeksContainer}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekColumn}>
              {week.map((day, dayIndex) => {
                const isToday =
                  day.dateKey === new Date().toISOString().split('T')[0];
                const isFuture = day.date > new Date();

                return (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: isFuture
                          ? '#F5F5F5'
                          : getCellColor(day.count),
                      },
                      isToday && styles.todayCell,
                    ]}
                    onPress={() => !isFuture && onDayPress(day.dateKey)}
                    disabled={isFuture}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={[styles.legendCell, { backgroundColor: '#E8E8E8' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#C8E6C9' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#81C784' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#00C853' }]} />
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  monthLabels: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 24,
  },
  monthLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  dayLabelsColumn: {
    justifyContent: 'space-around',
    width: 32,
  },
  dayLabelContainer: {
    height: 15,
    justifyContent: 'center',
    marginBottom: 3,
  },
  dayLabel: {
    fontSize: 9,
    color: '#999',
    fontWeight: '500',
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
  },
  weekColumn: {
    gap: 3,
    flex: 1,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: '#00C853',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#999',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
