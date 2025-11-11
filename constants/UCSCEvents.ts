// constants/UCSCEvents.ts
export type UCSCEventType = 
  | 'career_fair' 
  | 'club_fair' 
  | 'academic' 
  | 'social' 
  | 'workshop' 
  | 'lecture' 
  | 'orientation'
  | 'deadline';

export type UCSCEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  endDate: string;
  type: UCSCEventType;
  organizer: string;
  registrationUrl?: string;
  isUCSCEvent: true; // Flag to distinguish from personal events
};

// Simulated UCSC events data - in a real app this would come from an API
export const MOCK_UCSC_EVENTS: UCSCEvent[] = [
  {
    id: 'ucsc_1',
    title: 'Fall Career Fair',
    description: 'Meet with top employers from tech, biotech, and finance industries.',
    location: 'East Remote Parking Lot',
    date: '2024-11-15T10:00:00.000Z',
    endDate: '2024-11-15T16:00:00.000Z',
    type: 'career_fair',
    organizer: 'Career Center',
    registrationUrl: 'https://careers.ucsc.edu',
    isUCSCEvent: true
  },
  {
    id: 'ucsc_2',
    title: 'Involvement Fair',
    description: 'Discover student clubs and organizations on campus.',
    location: 'Quarry Plaza',
    date: '2024-11-12T11:00:00.000Z',
    endDate: '2024-11-12T15:00:00.000Z',
    type: 'club_fair',
    organizer: 'Student Life',
    isUCSCEvent: true
  },
  {
    id: 'ucsc_3',
    title: 'Graduate School Application Workshop',
    description: 'Tips and strategies for applying to graduate programs.',
    location: 'Classroom Unit 2, Room 206',
    date: '2024-11-18T14:00:00.000Z',
    endDate: '2024-11-18T16:00:00.000Z',
    type: 'workshop',
    organizer: 'Academic Resource Center',
    isUCSCEvent: true
  },
  {
    id: 'ucsc_4',
    title: 'Final Exam Period Begins',
    description: 'Fall quarter final examinations begin.',
    location: 'Various Locations',
    date: '2024-12-09T08:00:00.000Z',
    endDate: '2024-12-09T23:59:59.000Z',
    type: 'academic',
    organizer: 'Registrar',
    isUCSCEvent: true
  },
  {
    id: 'ucsc_5',
    title: 'Tech Talk: AI in Healthcare',
    description: 'Industry professionals discuss AI applications in healthcare.',
    location: 'Baskin Engineering, Auditorium',
    date: '2024-11-20T18:00:00.000Z',
    endDate: '2024-11-20T19:30:00.000Z',
    type: 'lecture',
    organizer: 'School of Engineering',
    isUCSCEvent: true
  },
  {
    id: 'ucsc_6',
    title: 'Winter Quarter Registration Deadline',
    description: 'Last day to register for Winter 2025 courses.',
    location: 'Online',
    date: '2024-11-22T23:59:59.000Z',
    endDate: '2024-11-22T23:59:59.000Z',
    type: 'deadline',
    organizer: 'Registrar',
    isUCSCEvent: true
  },
  {
    id: 'ucsc_7',
    title: 'International Night',
    description: 'Celebrate cultural diversity with food, music, and performances.',
    location: 'Stevenson Event Center',
    date: '2024-11-16T19:00:00.000Z',
    endDate: '2024-11-16T22:00:00.000Z',
    type: 'social',
    organizer: 'International Student Services',
    isUCSCEvent: true
  },
  {
    id: 'ucsc_8',
    title: 'CSE115A Function',
    description: 'Software Engineering class function and project presentations.',
    location: 'Baskin Engineering, Room 156',
    date: '2025-11-15T14:00:00.000Z',
    endDate: '2025-11-15T17:00:00.000Z',
    type: 'academic',
    organizer: 'Computer Science Department',
    isUCSCEvent: true
  },
  {
    id: 'ucsc_9',
    title: 'Architas Function',
    description: 'Special academic function hosted by Professor Archita.',
    location: 'Engineering 2, Auditorium',
    date: '2025-12-05T15:00:00.000Z',
    endDate: '2025-12-05T18:00:00.000Z',
    type: 'academic',
    organizer: 'Computer Science Department',
    registrationUrl: 'https://cse.ucsc.edu/architas-function',
    isUCSCEvent: true
  }
];

// Function to get UCSC events (simulates API call)
export const getUCSCEvents = (): Promise<UCSCEvent[]> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve(MOCK_UCSC_EVENTS);
    }, 500);
  });
};

// Color mapping for different event types
export const EVENT_TYPE_COLORS: Record<UCSCEventType, string> = {
  career_fair: '#2196F3',
  club_fair: '#FF9800',
  academic: '#9C27B0',
  social: '#4CAF50',
  workshop: '#FF5722',
  lecture: '#795548',
  orientation: '#607D8B',
  deadline: '#F44336'
};