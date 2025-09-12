import type { Routine, Step, Session, SessionStep, AppSettings } from './types.js';

class DataStore {
    private readonly STORAGE_KEYS = {
        ROUTINES: 'routined-life-routines',
        STEPS: 'routined-life-steps',
        SESSIONS: 'routined-life-sessions',
        SESSION_STEPS: 'routined-life-session-steps',
        SETTINGS: 'routined-life-settings'
    };

    // Utility methods for localStorage
    private getStorageData<T>(key: string): T[] {
        if (typeof window === 'undefined') return [];
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data, this.dateReviver) : [];
        } catch (error) {
            console.error(`Failed to load ${key}:`, error);
            return [];
        }
    }

    private setStorageData<T>(key: string, data: T[]): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, JSON.stringify(data, this.dateReplacer));
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
        }
    }

    // JSON serialization helpers for Date objects
    private dateReplacer(key: string, value: any): any {
        return value instanceof Date ? value.toISOString() : value;
    }

    private dateReviver(key: string, value: any): any {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
        }
        return value;
    }

    // Routine operations
    async getRoutines(): Promise<Routine[]> {
        return this.getStorageData<Routine>(this.STORAGE_KEYS.ROUTINES);
    }

    async getRoutine(id: string): Promise<Routine | null> {
        const routines = await this.getRoutines();
        return routines.find(r => r.id === id) || null;
    }

    async saveRoutine(routine: Routine): Promise<void> {
        const routines = await this.getRoutines();
        const existingIndex = routines.findIndex(r => r.id === routine.id);
        
        if (existingIndex >= 0) {
            routines[existingIndex] = { ...routine, updatedAt: new Date() };
        } else {
            routines.push(routine);
        }
        
        this.setStorageData(this.STORAGE_KEYS.ROUTINES, routines);
    }

    async deleteRoutine(id: string): Promise<void> {
        const routines = await this.getRoutines();
        const filtered = routines.filter(r => r.id !== id);
        this.setStorageData(this.STORAGE_KEYS.ROUTINES, filtered);
        
        // Also delete associated steps
        const steps = await this.getSteps();
        const filteredSteps = steps.filter(s => s.routineId !== id);
        this.setStorageData(this.STORAGE_KEYS.STEPS, filteredSteps);
    }

    // Step operations
    async getSteps(): Promise<Step[]> {
        return this.getStorageData<Step>(this.STORAGE_KEYS.STEPS);
    }

    async getStepsForRoutine(routineId: string): Promise<Step[]> {
        const steps = await this.getSteps();
        return steps
            .filter(s => s.routineId === routineId)
            .sort((a, b) => a.order - b.order);
    }

    async saveStep(step: Step): Promise<void> {
        const steps = await this.getSteps();
        const existingIndex = steps.findIndex(s => s.id === step.id);
        
        if (existingIndex >= 0) {
            steps[existingIndex] = step;
        } else {
            steps.push(step);
        }
        
        this.setStorageData(this.STORAGE_KEYS.STEPS, steps);
    }

    async saveSteps(steps: Step[]): Promise<void> {
        const allSteps = await this.getSteps();
        const otherSteps = allSteps.filter(s => 
            !steps.some(newStep => newStep.id === s.id)
        );
        
        this.setStorageData(this.STORAGE_KEYS.STEPS, [...otherSteps, ...steps]);
    }

    async deleteStep(id: string): Promise<void> {
        const steps = await this.getSteps();
        const filtered = steps.filter(s => s.id !== id);
        this.setStorageData(this.STORAGE_KEYS.STEPS, filtered);
    }

    // Session operations
    async getSessions(): Promise<Session[]> {
        return this.getStorageData<Session>(this.STORAGE_KEYS.SESSIONS);
    }

    async getSessionsForRoutine(routineId: string): Promise<Session[]> {
        const sessions = await this.getSessions();
        return sessions
            .filter(s => s.routineId === routineId)
            .sort((a, b) => b.startTimestamp.getTime() - a.startTimestamp.getTime());
    }

    async saveSession(session: Session): Promise<void> {
        const sessions = await this.getSessions();
        const existingIndex = sessions.findIndex(s => s.id === session.id);
        
        if (existingIndex >= 0) {
            sessions[existingIndex] = session;
        } else {
            sessions.push(session);
        }
        
        this.setStorageData(this.STORAGE_KEYS.SESSIONS, sessions);
    }

    // Session step operations
    async getSessionSteps(): Promise<SessionStep[]> {
        return this.getStorageData<SessionStep>(this.STORAGE_KEYS.SESSION_STEPS);
    }

    async getSessionStepsForSession(sessionId: string): Promise<SessionStep[]> {
        const sessionSteps = await this.getSessionSteps();
        return sessionSteps.filter(ss => ss.sessionId === sessionId);
    }

    async saveSessionStep(sessionStep: SessionStep): Promise<void> {
        const sessionSteps = await this.getSessionSteps();
        const existingIndex = sessionSteps.findIndex(ss => ss.id === sessionStep.id);
        
        if (existingIndex >= 0) {
            sessionSteps[existingIndex] = sessionStep;
        } else {
            sessionSteps.push(sessionStep);
        }
        
        this.setStorageData(this.STORAGE_KEYS.SESSION_STEPS, sessionSteps);
    }

    // Utility methods
    generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Settings operations
    getSettings(): AppSettings | null {
        if (typeof window === 'undefined') return null;
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    }

    saveSettings(settings: AppSettings): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    // Clear all data (for development/testing)
    async clearAllData(): Promise<void> {
        if (typeof window === 'undefined') return;
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}

export const DataStoreService = new DataStore();