import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { EventItem } from '../../components/SwipeableEventCard';

/* -------------------------------------------------------
   Task Type With Priority
------------------------------------------------------- */
export type TaskItem = EventItem & {
  type: "task";
  dueDate: string;
  priority?: number;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<'incomplete' | 'completed' | 'stats'>('incomplete');
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week, etc.

  /* -------------------------------------------------------
     Load tasks
  ------------------------------------------------------- */
  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('events');
      const parsed: EventItem[] = stored ? JSON.parse(stored) : [];

      const filtered: TaskItem[] = parsed
        .filter((item: any) => item.type === 'task')
        .map((item: any) => ({
          ...item,
          completed: !!item.completed,
          priority: item.priority ?? 1,
          type: "task",
        }));

      filtered.sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

      setTasks(filtered);
    } catch (err) {
      console.log('Error loading tasks:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  /* -------------------------------------------------------
     Toggle completion
  ------------------------------------------------------- */
  const handleToggleComplete = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );

    try {
      const stored = await AsyncStorage.getItem('events');
      const allItems = stored ? JSON.parse(stored) : [];

      const updated = allItems.map((item: any) =>
        item.id === taskId && item.type === "task"
          ? { ...item, completed: !item.completed }
          : item
      );

      await AsyncStorage.setItem('events', JSON.stringify(updated));
    } catch (err) {
      console.log('Error toggling task:', err);
    }
  };

  /* -------------------------------------------------------
     Task Lists
  ------------------------------------------------------- */
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const displayedTasks =
    filter === 'incomplete'
      ? [...incompleteTasks].sort((a, b) => {
          if ((b.priority || 1) !== (a.priority || 1)) return (b.priority || 1) - (a.priority || 1);
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
      : [...completedTasks].sort((a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );

  const getPriorityLabel = (priority?: number) => {
    if (!priority || priority === 1) return 'Low';
    if (priority === 2) return 'Medium';
    return 'High';
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority || priority === 1) return '#4CAF50';
    if (priority === 2) return '#FF9800';
    return '#F44336';
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /* -------------------------------------------------------
     Stats Calculations
  ------------------------------------------------------- */
  const getCompletionRate = () => {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  const getPriorityDistribution = () => {
    const distribution = { low: 0, medium: 0, high: 0 };
    tasks.forEach((task) => {
      const priority = task.priority || 1;
      if (priority === 1) distribution.low++;
      else if (priority === 2) distribution.medium++;
      else distribution.high++;
    });
    return distribution;
  };

  const getWeeklyData = (weekOffset: number) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + weekOffset * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekTasks = tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= weekStart && taskDate < weekEnd;
    });

    return {
      completed: weekTasks.filter((t) => t.completed).length,
      incomplete: weekTasks.filter((t) => !t.completed).length,
      weekLabel: formatWeekLabel(weekStart),
    };
  };

  const formatWeekLabel = (weekStart: Date) => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const diff = Math.floor((currentWeekStart.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

    if (diff === 0) return 'This Week';
    if (diff === 1) return 'Last Week';
    return `${diff} Weeks Ago`;
  };

  /* -------------------------------------------------------
     Render Stats View
  ------------------------------------------------------- */
  const renderStatsView = () => {
    const completionRate = getCompletionRate();
    const priorityDist = getPriorityDistribution();
    const total = priorityDist.low + priorityDist.medium + priorityDist.high;

    // Weekly data for 4 weeks
    const weeks = [
      getWeeklyData(-3),
      getWeeklyData(-2),
      getWeeklyData(-1),
      getWeeklyData(0),
    ];

    return (
      <View style={{ paddingHorizontal: 20 }}>
        {/* Performance Overview */}
        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <View style={styles.statsIconContainer}>
              <Ionicons name="trophy" size={24} color="#fff" />
            </View>
            <View style={styles.statsHeaderText}>
              <Text style={styles.statsCardTitle}>Performance Overview</Text>
              <Text style={styles.statsCardSubtitle}>Your productivity insights</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Tasks</Text>
              <Text style={styles.statValue}>{tasks.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Completion Rate</Text>
              <Text style={[styles.statValue, { color: '#00C853' }]}>
                {completionRate}%
              </Text>
            </View>
          </View>
        </View>

        {/* Priority Distribution */}
        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <View style={[styles.statsIconContainer, { backgroundColor: '#FF6B35' }]}>
              <Ionicons name="stats-chart" size={24} color="#fff" />
            </View>
            <View style={styles.statsHeaderText}>
              <Text style={styles.statsCardTitle}>Priority Distribution</Text>
              <Text style={styles.statsCardSubtitle}>Task priorities</Text>
            </View>
          </View>

          {total > 0 ? (
            <>
              <View style={styles.chartContainer}>
                <DonutChart
                  low={priorityDist.low}
                  medium={priorityDist.medium}
                  high={priorityDist.high}
                />
              </View>

              <View style={styles.legendContainer}>
                {priorityDist.high > 0 && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                    <Text style={styles.legendText}>High ({priorityDist.high})</Text>
                  </View>
                )}
                {priorityDist.medium > 0 && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                    <Text style={styles.legendText}>Medium ({priorityDist.medium})</Text>
                  </View>
                )}
                {priorityDist.low > 0 && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.legendText}>Low ({priorityDist.low})</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No tasks yet</Text>
            </View>
          )}
        </View>

        {/* Weekly Progress */}
        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <View style={[styles.statsIconContainer, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="bar-chart" size={24} color="#fff" />
            </View>
            <View style={styles.statsHeaderText}>
              <Text style={styles.statsCardTitle}>Weekly Progress</Text>
              <Text style={styles.statsCardSubtitle}>Last 4 weeks</Text>
            </View>
          </View>

          <View style={styles.barChartContainer}>
            <BarChart weeks={weeks} />
          </View>

          <View style={styles.chartLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#00C853' }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Incomplete</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  /* -------------------------------------------------------
     Donut Chart Component
  ------------------------------------------------------- */
  const DonutChart = ({ low, medium, high }: { low: number; medium: number; high: number }) => {
    const total = low + medium + high;
    if (total === 0) return null;

    const size = 200;
    const strokeWidth = 30;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const highPercent = high / total;
    const mediumPercent = medium / total;
    const lowPercent = low / total;

    const highDash = circumference * highPercent;
    const mediumDash = circumference * mediumPercent;
    const lowDash = circumference * lowPercent;

    return (
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* High priority */}
          {high > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F44336"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${highDash} ${circumference}`}
              strokeDashoffset={0}
            />
          )}
          {/* Medium priority */}
          {medium > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#FF9800"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${mediumDash} ${circumference}`}
              strokeDashoffset={-highDash}
            />
          )}
          {/* Low priority */}
          {low > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#4CAF50"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${lowDash} ${circumference}`}
              strokeDashoffset={-(highDash + mediumDash)}
            />
          )}
        </G>
      </Svg>
    );
  };

  /* -------------------------------------------------------
     Bar Chart Component
  ------------------------------------------------------- */
  const BarChart = ({ weeks }: { weeks: Array<{ completed: number; incomplete: number; weekLabel: string }> }) => {
    const maxValue = Math.max(...weeks.map((w) => w.completed + w.incomplete), 1);
    const chartHeight = 180;
    const chartWidth = 280;
    const barWidth = 30;
    const gap = 15;

    return (
      <View>
        <Svg width={chartWidth} height={chartHeight + 30}>
          {/* Y-axis labels */}
          <SvgText x="0" y="15" fontSize="10" fill="#999">
            {maxValue}
          </SvgText>
          <SvgText x="0" y={chartHeight / 2 + 10} fontSize="10" fill="#999">
            {Math.round(maxValue / 2)}
          </SvgText>
          <SvgText x="0" y={chartHeight} fontSize="10" fill="#999">
            0
          </SvgText>

          {/* Bars */}
          {weeks.map((week, index) => {
            const xStart = 30 + index * (barWidth * 2 + gap);
            const completedHeight = (week.completed / maxValue) * (chartHeight - 20);
            const incompleteHeight = (week.incomplete / maxValue) * (chartHeight - 20);

            return (
              <G key={index}>
                {/* Completed bar */}
                <Rect
                  x={xStart}
                  y={chartHeight - completedHeight}
                  width={barWidth}
                  height={completedHeight}
                  fill="#00C853"
                  rx={4}
                />
                {/* Incomplete bar */}
                <Rect
                  x={xStart + barWidth + 5}
                  y={chartHeight - incompleteHeight}
                  width={barWidth}
                  height={incompleteHeight}
                  fill="#F44336"
                  rx={4}
                />
                {/* X-axis label */}
                <SvgText
                  x={xStart + barWidth}
                  y={chartHeight + 20}
                  fontSize="10"
                  fill="#666"
                  textAnchor="middle"
                >
                  Week {index + 1}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.iconSquare}>
                <Ionicons name="checkbox" size={28} color="#fff" />
              </View>
              <Text style={styles.headerTitle}>My Tasks</Text>
            </View>
            <Text style={styles.headerSubtitle}>Organize your work</Text>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                filter === 'incomplete' && styles.tabActive,
              ]}
              onPress={() => setFilter('incomplete')}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === 'incomplete' && styles.tabTextActive,
                ]}
              >
                Incomplete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                filter === 'completed' && styles.tabActive,
              ]}
              onPress={() => setFilter('completed')}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === 'completed' && styles.tabTextActive,
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                filter === 'stats' && styles.tabActive,
              ]}
              onPress={() => setFilter('stats')}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === 'stats' && styles.tabTextActive,
                ]}
              >
                Stats
              </Text>
            </TouchableOpacity>
          </View>

          {filter === 'stats' ? (
            // Stats View
            renderStatsView()
          ) : (
            <>
              {/* Status Message */}
              <View style={styles.statusCard}>
                <Text style={styles.statusText}>
                  {filter === 'incomplete' ? (
                    <>
                      You still have{' '}
                      <Text style={styles.statusNumber}>{incompleteTasks.length}</Text>{' '}
                      task{incompleteTasks.length === 1 ? '' : 's'} to do.
                    </>
                  ) : (
                    <>
                      You have completed{' '}
                      <Text style={styles.statusNumber}>{completedTasks.length}</Text>{' '}
                      task{completedTasks.length === 1 ? '' : 's'}.
                    </>
                  )}
                </Text>
              </View>

              {/* Task List */}
              {displayedTasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {filter === 'incomplete'
                      ? 'No incomplete tasks'
                      : 'No completed tasks yet'}
                  </Text>
                </View>
              ) : (
                displayedTasks.map((task) => (
                  <View key={task.id} style={styles.taskCard}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => handleToggleComplete(task.id)}
                    >
                      <Ionicons
                        name={task.completed ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={task.completed ? '#00C853' : '#999'}
                      />
                    </TouchableOpacity>

                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                        {task.title}
                      </Text>

                      <View style={styles.taskMeta}>
                        <View style={styles.priorityContainer}>
                          <Ionicons name="flag" size={16} color={getPriorityColor(task.priority)} />
                          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                          <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                            {getPriorityLabel(task.priority)}
                          </Text>
                        </View>

                        <View style={styles.dateContainer}>
                          <Ionicons name="calendar-outline" size={16} color="#666" />
                          <Text style={styles.dateText}>{formatDueDate(task.dueDate)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Add Task Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-task')}
          >
            <Text style={styles.addButtonText}>+ Add New Task</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

/* -------------------------------------------------------
   Styles
------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconSquare: {
    width: 40,
    height: 40,
    backgroundColor: '#00C853',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00C853',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 52,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabActive: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  statusNumber: {
    color: '#00C853',
    fontWeight: 'bold',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkbox: {
    marginRight: 12,
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  addButton: {
    backgroundColor: '#00C853',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Stats styles
  statsCard: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#9C27B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsHeaderText: {
    flex: 1,
  },
  statsCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statsCardSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#999',
  },
  barChartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
});
