import type { RoutineTemplate } from './types.js';

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
    {
        name: 'Morning Routine',
        emoji: '🌅',
        color: '#eab308',
        steps: [
            {
                name: 'Wake up & stretch',
                emoji: '🧘',
                durationSeconds: 300,
                checklist: ['Get out of bed', 'Light stretching']
            },
            {
                name: 'Brush teeth',
                emoji: '🦷',
                durationSeconds: 120,
                checklist: ['Brush for 2 minutes', 'Rinse with mouthwash']
            },
            {
                name: 'Shower',
                emoji: '🚿',
                durationSeconds: 600,
                checklist: ['Wash hair', 'Wash body']
            },
            {
                name: 'Get dressed',
                emoji: '👔',
                durationSeconds: 300,
                checklist: ['Pick appropriate clothes', 'Check weather']
            },
            {
                name: 'Breakfast',
                emoji: '🍳',
                durationSeconds: 900,
                checklist: ['Prepare meal', 'Eat mindfully']
            }
        ]
    },
    {
        name: 'Evening Routine',
        emoji: '🌙',
        color: '#8b5cf6',
        steps: [
            {
                name: 'Tidy up',
                emoji: '🧹',
                durationSeconds: 900,
                checklist: ['Put things back in place', 'Quick clean']
            },
            {
                name: 'Prepare for tomorrow',
                emoji: '📋',
                durationSeconds: 600,
                checklist: ['Check calendar', 'Prepare clothes', 'Pack bag']
            },
            {
                name: 'Personal hygiene',
                emoji: '🧴',
                durationSeconds: 600,
                checklist: ['Brush teeth', 'Wash face', 'Skincare routine']
            },
            {
                name: 'Wind down',
                emoji: '📖',
                durationSeconds: 1800,
                checklist: ['Read or meditate', 'No screens', 'Dim lights']
            }
        ]
    },
    {
        name: 'Quick Workout',
        emoji: '💪',
        color: '#22c55e',
        steps: [
            {
                name: 'Warm up',
                emoji: '🏃',
                durationSeconds: 300,
                checklist: ['Light cardio', 'Dynamic stretches']
            },
            {
                name: 'Strength training',
                emoji: '🏋️',
                durationSeconds: 1200,
                checklist: ['Push-ups', 'Squats', 'Planks']
            },
            {
                name: 'Cool down',
                emoji: '🧘',
                durationSeconds: 300,
                checklist: ['Static stretches', 'Deep breathing']
            }
        ]
    },
    {
        name: 'Focus Session',
        emoji: '🎯',
        color: '#3b82f6',
        steps: [
            {
                name: 'Prepare workspace',
                emoji: '🖥️',
                durationSeconds: 180,
                checklist: ['Clear desk', 'Close distractions', 'Get water']
            },
            {
                name: 'Deep work',
                emoji: '⚡',
                durationSeconds: 1500,
                checklist: ['Focus on one task', 'No interruptions']
            },
            {
                name: 'Break',
                emoji: '☕',
                durationSeconds: 300,
                checklist: ['Step away from screen', 'Stretch', 'Hydrate']
            }
        ]
    }
];