import { Ionicons } from '@expo/vector-icons';
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
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';

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
  const [filter, setFilter] = useState<'todo' | 'done' | 'stats'>('todo');
  const [selectedWeek, setSelectedWeek] = useState(0);

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
  const highPriorityCount = incompleteTasks.filter((t) => t.priority === 3).length;

  const displayedTasks =
    filter === 'todo'
      ? [...incompleteTasks].sort((a, b) => {
          if ((b.priority || 1) !== (a.priority || 1)) return (b.priority || 1) - (a.priority || 1);
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
      : filter === 'done'
      ? [...completedTasks].sort((a, b) =>
          new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        )
      : [];

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
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate < now) {
      return 'Overdue';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateString: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < now;
  };

  const getCompletionRate = () => {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  /* -------------------------------------------------------
     Stats Functions
  ------------------------------------------------------- */
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
              <Ionicons name="analytics" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.statsCardTitle}>Performance Overview</Text>
              <Text style={styles.statsCardSubtitle}>Your task completion stats</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tasks.length}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#00C853' }]}>{completionRate}%</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Priority Distribution */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>Priority Distribution</Text>
          <Text style={styles.statsCardSubtitle}>Task breakdown by priority level</Text>

          <View style={styles.chartContainer}>
            <DonutChart low={priorityDist.low} medium={priorityDist.medium} high={priorityDist.high} />
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>High ({priorityDist.high})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Medium ({priorityDist.medium})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Low ({priorityDist.low})</Text>
            </View>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>Weekly Progress</Text>
          <Text style={styles.statsCardSubtitle}>Last 4 weeks completion rate</Text>

          <BarChart weeks={weeks} />
        </View>

        <View style={{ height: 100 }} />
      </View>
    );
  };

  /* -------------------------------------------------------
     SVG Charts
  ------------------------------------------------------- */
  const DonutChart = ({ low, medium, high }: { low: number; medium: number; high: number }) => {
    const total = low + medium + high;
    if (total === 0) {
      return (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999' }}>No tasks available</Text>
        </View>
      );
    }

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

    const highOffset = 0;
    const mediumOffset = -highDash;
    const lowOffset = -(highDash + mediumDash);

    return (
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {high > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F44336"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${highDash} ${circumference}`}
              strokeDashoffset={highOffset}
            />
          )}
          {medium > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#FF9800"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${mediumDash} ${circumference}`}
              strokeDashoffset={mediumOffset}
            />
          )}
          {low > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#4CAF50"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${lowDash} ${circumference}`}
              strokeDashoffset={lowOffset}
            />
          )}
        </G>
      </Svg>
    );
  };

  const BarChart = ({ weeks }: { weeks: any[] }) => {
    const chartWidth = 340;
    const chartHeight = 200;
    const barWidth = 60;
    const spacing = 20;
    const maxValue = Math.max(...weeks.map((w) => w.completed + w.incomplete), 1);

    return (
      <View style={{ marginTop: 20 }}>
        <Svg width={chartWidth} height={chartHeight + 40}>
          {weeks.map((week, index) => {
            const x = index * (barWidth + spacing) + spacing;
            const completedHeight = (week.completed / maxValue) * chartHeight;
            const incompleteHeight = (week.incomplete / maxValue) * chartHeight;

            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={chartHeight - completedHeight}
                  width={barWidth}
                  height={completedHeight}
                  fill="#00C853"
                  rx={4}
                />
                <Rect
                  x={x}
                  y={chartHeight - completedHeight - incompleteHeight}
                  width={barWidth}
                  height={incompleteHeight}
                  fill="#E0E0E0"
                  rx={4}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  fontSize="12"
                  fill="#666"
                  textAnchor="middle"
                >
                  {week.weekLabel}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              My Tasks <Ionicons name="sparkles" size={24} color="#00C853" />
            </Text>
            <Text style={styles.headerSubtitle}>Stay organized and productive</Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#FF6B35' }]}>
              <View style={styles.summaryIcon}>
                <Ionicons name="flag" size={24} color="rgba(255, 255, 255, 0.5)" />
              </View>
              <Text style={styles.summaryNumber}>{highPriorityCount}</Text>
              <Text style={styles.summaryLabel}>High Priority</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#5B8BF4' }]}>
              <View style={styles.summaryIcon}>
                <Ionicons name="list" size={24} color="rgba(255, 255, 255, 0.5)" />
              </View>
              <Text style={styles.summaryNumber}>{incompleteTasks.length}</Text>
              <Text style={styles.summaryLabel}>To Do</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#00C853' }]}>
              <View style={styles.summaryIcon}>
                <Ionicons name="trending-up" size={24} color="rgba(255, 255, 255, 0.5)" />
              </View>
              <Text style={styles.summaryNumber}>{getCompletionRate()}%</Text>
              <Text style={styles.summaryLabel}>Complete</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, filter === 'todo' && styles.tabActive]}
            onPress={() => setFilter('todo')}
          >
            <Ionicons
              name="list"
              size={20}
              color={filter === 'todo' ? '#fff' : '#666'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, filter === 'todo' && styles.tabTextActive]}>
              Todo
            </Text>
            {incompleteTasks.length > 0 && filter === 'todo' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{incompleteTasks.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, filter === 'done' && styles.tabActive]}
            onPress={() => setFilter('done')}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={filter === 'done' ? '#fff' : '#666'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, filter === 'done' && styles.tabTextActive]}>
              Done
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, filter === 'stats' && styles.tabActive]}
            onPress={() => setFilter('stats')}
          >
            <Ionicons
              name="bar-chart-outline"
              size={20}
              color={filter === 'stats' ? '#fff' : '#666'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, filter === 'stats' && styles.tabTextActive]}>
              Stats
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filter === 'stats' ? (
            renderStatsView()
          ) : (
            <>
              {/* Encouragement Card (only for todo view) */}
              {filter === 'todo' && incompleteTasks.length > 0 && (
                <View style={styles.encouragementCard}>
                  <View style={styles.encouragementIcon}>
                    <Ionicons name="list" size={28} color="#fff" />
                  </View>
                  <View style={styles.encouragementText}>
                    <Text style={styles.encouragementTitle}>
                      You have {incompleteTasks.length} task{incompleteTasks.length !== 1 ? 's' : ''} to complete
                    </Text>
                    <Text style={styles.encouragementSubtitle}>
                      {highPriorityCount} high priority • Keep pushing forward! 💪
                    </Text>
                  </View>
                </View>
              )}

              {/* Task List */}
              {displayedTasks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name={filter === 'todo' ? 'checkmark-circle' : 'list'}
                    size={64}
                    color="#E0E0E0"
                  />
                  <Text style={styles.emptyText}>
                    {filter === 'todo' ? 'No tasks to complete!' : 'No completed tasks'}
                  </Text>
                </View>
              ) : (
                displayedTasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskCard,
                      task.priority === 3 && !task.completed && styles.taskCardHighPriority,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: '/edit-task',
                        params: { id: task.id },
                      })
                    }
                  >
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => handleToggleComplete(task.id)}
                    >
                      {task.completed ? (
                        <Ionicons name="checkmark-circle" size={28} color="#00C853" />
                      ) : (
                        <View style={styles.checkboxEmpty} />
                      )}
                    </TouchableOpacity>

                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                        {task.title}
                      </Text>

                      <View style={styles.taskMeta}>
                        <View
                          style={[
                            styles.priorityBadge,
                            { backgroundColor: `${getPriorityColor(task.priority)}15` },
                          ]}
                        >
                          <View
                            style={[
                              styles.priorityDot,
                              { backgroundColor: getPriorityColor(task.priority) },
                            ]}
                          />
                          <Text
                            style={[
                              styles.priorityText,
                              { color: getPriorityColor(task.priority) },
                            ]}
                          >
                            {getPriorityLabel(task.priority)}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.dateBadge,
                            isOverdue(task.dueDate) && !task.completed && styles.dateBadgeOverdue,
                          ]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={isOverdue(task.dueDate) && !task.completed ? '#F44336' : '#666'}
                          />
                          <Text
                            style={[
                              styles.dateText,
                              isOverdue(task.dueDate) && !task.completed && styles.dateTextOverdue,
                            ]}
                          >
                            {formatDueDate(task.dueDate)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <View style={{ height: 100 }} />
            </>
          )}
        </ScrollView>

        {/* Add Task Button */}
        {filter !== 'stats' && (
          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add-task')}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add New Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

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
  },
  headerContent: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00C853',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#00C853',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  encouragementCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  encouragementIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  encouragementText: {
    flex: 1,
  },
  encouragementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  encouragementSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taskCardHighPriority: {
    borderColor: '#FFE0E0',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
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
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  dateBadgeOverdue: {
    backgroundColor: '#FFE0E0',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateTextOverdue: {
    color: '#F44336',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 100,
    backgroundColor: 'transparent',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C853',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statsCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statsCardSubtitle: {
    fontSize: 14,
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
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
});
