import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

export type UCSCEventType =
  | "career_fair"
  | "club_fair"
  | "academic"
  | "social"
  | "workshop"
  | "lecture"
  | "orientation"
  | "deadline";

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
  isUCSCEvent: true;
};

async function loadICSFile(): Promise<string> {
  try {
    const asset = Asset.fromModule(require("../assets/ucscevents.ics"));
    await asset.downloadAsync();
    const text = await FileSystem.readAsStringAsync(asset.localUri!);
    return text;
  } catch (err) {
    console.error("Failed to load ICS file:", err);
    return "";
  }
}

export async function getUCSCEvents(): Promise<UCSCEvent[]> {
  const raw = await loadICSFile();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/);

  const result: UCSCEvent[] = [];
  let block: string[] = [];
  let inside = false;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inside = true;
      block = [];
    }

    if (inside) block.push(line);

    if (line.startsWith("END:VEVENT")) {
      inside = false;
      const evt = parseEvent(block);
      if (evt) result.push(evt);
    }
  }

  return result;
}

function parseEvent(block: string[]): UCSCEvent | null {
  let summary = "";
  let description = "";
  let location = "";
  let start = "";
  let end = "";
  let uid = "";
  let url = "";
  let category = "";

  for (const line of block) {
    if (line.startsWith("SUMMARY:")) summary = value(line);
    if (line.startsWith("DESCRIPTION:")) description = value(line);
    if (line.startsWith("LOCATION:")) location = value(line);
    if (line.startsWith("UID:")) uid = value(line);
    if (line.startsWith("URL:")) url = value(line);
    if (line.startsWith("CATEGORIES:")) category = value(line);

    if (line.startsWith("DTSTART")) start = parseICSDate(line);
    if (line.startsWith("DTEND")) end = parseICSDate(line);
  }

  if (!summary) return null;

  return {
    id: uid || summary + start,
    title: summary,
    description,
    location,
    date: start,
    endDate: end,
    type: mapType(category),
    organizer: "UCSC",
    registrationUrl: url,
    isUCSCEvent: true,
  };
}

function value(line: string) {
  return line.substring(line.indexOf(":") + 1).trim();
}

function parseICSDate(line: string): string {
  const raw = value(line);

  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  const hr = raw.slice(9, 11) || "00";
  const min = raw.slice(11, 13) || "00";

  return `${y}-${m}-${d}T${hr}:${min}:00`;
}

function mapType(cat: string): UCSCEventType {
  const c = cat.toLowerCase();

  if (c.includes("career")) return "career_fair";
  if (c.includes("club")) return "club_fair";
  if (c.includes("social")) return "social";
  if (c.includes("workshop")) return "workshop";
  if (c.includes("lecture") || c.includes("colloquium")) return "lecture";
  if (c.includes("orientation")) return "orientation";
  if (c.includes("deadline")) return "deadline";

  return "academic";
}

export const EVENT_TYPE_COLORS: Record<UCSCEventType, string> = {
  career_fair: "#2196F3",
  club_fair: "#FF9800",
  academic: "#9C27B0",
  social: "#4CAF50",
  workshop: "#FF5722",
  lecture: "#795548",
  orientation: "#607D8B",
  deadline: "#F44336",
};
