import courses from "./courses.json";

export type UCSCCourse = {
  division: string;
  number: string;
  section: string;
  title: string;
  location: string | null;
  days: string[];
  start: string | null;
  end: string | null;
};

export const ALL_UCSC_COURSES: UCSCCourse[] = courses;
