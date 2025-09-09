// Core data types for the RoutineFlow app

export interface Routine {
    id: string;
    name: string;
    emoji: string;
    color: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Step {
    id: string;
    routineId: string;
    emoji?: string;
    name: string;
    description?: string;
    durationSeconds: number;
    checklist: string[];
    order: number;
}

export interface Session {
    id: string;
    routineId: string;
    startTimestamp: Date;
    endTimestamp?: Date;
    status: SessionStatus;
    createdAt: Date;
}

export interface SessionStep {
    id: string;
    sessionId: string;
    stepId: string;
    plannedDurationSeconds: number;
    actualDurationSeconds?: number;
    skipped: boolean;
    completedAt?: Date;
}

export enum SessionStatus {
    RUNNING = 'running',
    COMPLETED = 'completed',
    PARTIAL = 'partial',
    ABANDONED = 'abandoned'
}

export enum TimerStatus {
    IDLE = 'idle',
    RUNNING = 'running',
    PAUSED = 'paused',
    COMPLETED = 'completed'
}

// UI and utility types
export interface RoutineTemplate {
    name: string;
    emoji: string;
    color: string;
    steps: Omit<Step, 'id' | 'routineId' | 'order'>[];
}

export interface WeeklyStats {
    weekStart: Date;
    completedRoutines: number;
    totalRoutines: number;
    totalTimeSeconds: number;
    streakDays: number;
}

export interface TimerState {
    currentStepIndex: number;
    remainingSeconds: number;
    status: TimerStatus;
    startTime?: Date;
    pausedTime?: Date;
}

// Color palette for routines
export const ROUTINE_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
    '#14b8a6'  // teal
] as const;

export type RoutineColor = typeof ROUTINE_COLORS[number];