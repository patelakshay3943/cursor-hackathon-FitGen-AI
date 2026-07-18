import type { UserProfile } from "@/modules/plan/types";

export const PERSON_SESSION_KEY = "fitgen_person_session";
export const PERSON_SESSION_EVENT = "fitgen-person-updated";

export type WorkoutRecord = {
  exerciseName: string;
  completedAt: string;
  totalReps: number;
  formScore: number;
  elapsedSec: number;
  appreciation: string;
};

export type PersonSession = {
  profile: UserProfile | null;
  planId: string | null;
  showUpCount: number;
  sessions: WorkoutRecord[];
};

function emptySession(): PersonSession {
  return { profile: null, planId: null, showUpCount: 0, sessions: [] };
}

function read(): PersonSession {
  if (typeof window === "undefined") return emptySession();
  try {
    const raw = sessionStorage.getItem(PERSON_SESSION_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as Partial<PersonSession>;
    return { ...emptySession(), ...parsed };
  } catch {
    return emptySession();
  }
}

function write(session: PersonSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PERSON_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(PERSON_SESSION_EVENT));
}

export function getPersonSession(): PersonSession {
  return read();
}

export function saveProfile(profile: UserProfile) {
  const session = read();
  session.profile = profile;
  write(session);
}

export function getProfileFromSession(): UserProfile | null {
  return read().profile;
}

export function savePlanIdToSession(planId: string) {
  const session = read();
  session.planId = planId;
  write(session);
}

export function getShowUpCount(): number {
  return read().showUpCount;
}

export function recordWorkout(
  record: Omit<WorkoutRecord, "completedAt"> & { completedAt?: string },
) {
  const session = read();
  session.showUpCount += 1;
  session.sessions.push({
    ...record,
    completedAt: record.completedAt ?? new Date().toISOString(),
  });
  write(session);
}
