import emojilib from 'emojilib';

/**
 * Maps common step/routine keywords to their most relevant emojis
 */
const CUSTOM_EMOJI_MAPPINGS: Record<string, string> = {
    // Exercise & Fitness
    'exercise': '💪',
    'workout': '🏋️',
    'run': '🏃',
    'jog': '🏃',
    'walk': '🚶',
    'yoga': '🧘',
    'stretch': '🤸',
    'gym': '🏋️',
    'cardio': '❤️',
    'pushup': '💪',
    'squat': '🦵',
    
    // Hygiene & Self-care
    'shower': '🚿',
    'bath': '🛁',
    'brush': '🪥',
    'teeth': '🦷',
    'hair': '💇',
    'shave': '🪒',
    'skincare': '🧴',
    'moisturize': '🧴',
    'deodorant': '🧴',
    'wash': '💧',
    
    // Food & Cooking
    'breakfast': '🍳',
    'lunch': '🥗',
    'dinner': '🍽️',
    'cook': '👨‍🍳',
    'meal': '🍽️',
    'eat': '🍴',
    'drink': '🥤',
    'water': '💧',
    'coffee': '☕',
    'tea': '🍵',
    'snack': '🍪',
    'prepare': '👨‍🍳',
    
    // Sleep & Rest
    'sleep': '😴',
    'bed': '🛏️',
    'nap': '😴',
    'rest': '😴',
    'relax': '😌',
    'meditate': '🧘',
    'calm': '😌',
    
    // Work & Productivity
    'work': '💼',
    'study': '📚',
    'read': '📖',
    'write': '✍️',
    'email': '📧',
    'meeting': '👥',
    'call': '📞',
    'task': '✅',
    'project': '📋',
    'plan': '📅',
    'organize': '🗂️',
    'focus': '🎯',
    
    // Cleaning & Chores
    'clean': '🧹',
    'tidy': '🧹',
    'vacuum': '🧹',
    'laundry': '👕',
    'dishes': '🍽️',
    'trash': '🗑️',
    'declutter': '📦',
    
    // Transportation
    'drive': '🚗',
    'commute': '🚇',
    'travel': '✈️',
    'bike': '🚴',
    'bus': '🚌',
    'train': '🚆',
    
    // Social & Family
    'family': '👨‍👩‍👧‍👦',
    'friend': '👥',
    'social': '👥',
    'visit': '🏠',
    'date': '💕',
    'party': '🎉',
    'celebrate': '🎉',
    
    // Health & Medical
    'medicine': '💊',
    'pill': '💊',
    'vitamin': '💊',
    'doctor': '👩‍⚕️',
    'appointment': '📅',
    'therapy': '🗣️',
    'check': '✅',
    
    // Nature & Outdoors
    'garden': '🌱',
    'nature': '🌿',
    'park': '🌳',
    'outdoor': '🌞',
    'sun': '☀️',
    'fresh air': '🌬️',
    
    // Technology
    'computer': '💻',
    'phone': '📱',
    'internet': '🌐',
    'code': '💻',
    'program': '💻',
    'backup': '💾',
    'update': '🔄',
    
    // Learning & Growth
    'learn': '🎓',
    'course': '📚',
    'practice': '🎯',
    'skill': '🎯',
    'hobby': '🎨',
    'create': '🎨',
    'art': '🎨',
    'music': '🎵',
    'instrument': '🎸',
    
    // Time management
    'schedule': '📅',
    'calendar': '📅',
    'reminder': '⏰',
    'timer': '⏱️',
    'alarm': '⏰',
    'deadline': '📅',
    
    // Shopping & Errands
    'shop': '🛒',
    'grocery': '🛒',
    'store': '🏪',
    'buy': '💳',
    'errand': '📝',
    'bank': '🏦',
    'post': '📮',
    
    // Spiritual & Mental
    'pray': '🙏',
    'grateful': '🙏',
    'journal': '📔',
    'reflect': '🤔',
    'mindful': '🧘',
    'breathe': '💨'
};

/**
 * Gets an emoji based on a text input using emojilib and custom mappings
 */
export function getEmojiForText(text: string): string | null {
    if (!text || text.trim().length === 0) return null;
    
    const cleanText = text.toLowerCase().trim();
    
    // First, check our custom mappings for exact matches
    if (CUSTOM_EMOJI_MAPPINGS[cleanText]) {
        return CUSTOM_EMOJI_MAPPINGS[cleanText];
    }
    
    // Check for partial matches in custom mappings
    for (const [keyword, emoji] of Object.entries(CUSTOM_EMOJI_MAPPINGS)) {
        if (cleanText.includes(keyword)) {
            return emoji;
        }
    }
    
    // Use emojilib to find emojis based on keywords
    const words = cleanText.split(/\s+/);
    
    for (const word of words) {
        // Clean the word (remove punctuation)
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length < 3) continue; // Skip very short words
        
        // Look through emojilib
        for (const [emoji, keywords] of Object.entries(emojilib)) {
            if (Array.isArray(keywords) && keywords.includes(cleanWord)) {
                return emoji;
            }
        }
    }
    
    return null;
}

/**
 * Adds an emoji to the beginning of text if it doesn't already start with one
 */
export function addEmojiToText(text: string, emoji: string): string {
    if (!text || !emoji) return text;
    
    // Check if text already starts with an emoji
    if (startsWithEmoji(text)) {
        return text;
    }
    
    return `${emoji} ${text}`;
}

/**
 * Checks if text starts with an emoji
 */
export function startsWithEmoji(text: string): boolean {
    if (!text) return false;
    
    // Regex to match emoji at the start of text
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|^[\u{1F300}-\u{1F5FF}]|^[\u{1F680}-\u{1F6FF}]|^[\u{1F1E0}-\u{1F1FF}]|^[\u{2600}-\u{26FF}]|^[\u{2700}-\u{27BF}]/u;
    
    return emojiRegex.test(text.trim());
}

/**
 * Automatically assigns emoji to a step name if auto-emoji is enabled and no emoji exists
 */
export function autoAssignEmoji(stepName: string, autoEmojiEnabled: boolean): string {
    if (!autoEmojiEnabled || !stepName || startsWithEmoji(stepName)) {
        return stepName;
    }
    
    const emoji = getEmojiForText(stepName);
    if (emoji) {
        return addEmojiToText(stepName, emoji);
    }
    
    return stepName;
}
