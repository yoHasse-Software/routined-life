import emojilib from 'emojilib';
import * as levenshtein from 'fast-levenshtein';

/**
 * Maps emojis to arrays of keywords that could match them
 * This allows for multiple keyword matching and better scoring
 */
const EMOJI_KEYWORD_MAPPINGS: Record<string, string[]> = {
    // Exercise & Fitness
    '💪': ['exercise', 'workout', 'strength', 'muscle', 'fitness', 'pushup', 'strong', 'power', 'lift'],
    '🏋️': ['gym', 'weight', 'lifting', 'barbell', 'workout', 'strength', 'training'],
    '🏃': ['run', 'running', 'jog', 'jogging', 'sprint', 'cardio', 'morning run', 'morning jog', 'evening jog', 'evening run'],
    '🚶': ['walk', 'walking', 'stroll', 'steps', 'morning walk', 'evening walk'],
    '🧘': ['yoga', 'meditate', 'meditation', 'mindful', 'zen', 'peaceful', 'breathe'],
    '🤸': ['stretch', 'stretching', 'flexibility', 'warm up', 'cool down'],
    '❤️': ['cardio', 'heart', 'aerobic', 'endurance'],
    '🦵': ['leg', 'squat', 'legs', 'quad', 'calf'],
    
    // Hygiene & Self-care
    '🚿': ['shower', 'showering', 'wash', 'clean', 'morning shower', 'evening shower'],
    '🛁': ['bath', 'bathing', 'soak', 'relax', 'bubble bath'],
    '🪥': ['brush', 'brushing', 'teeth', 'dental', 'toothbrush', 'brush teeth'],
    '🦷': ['teeth', 'dental', 'floss', 'mouthwash', 'oral'],
    '💇': ['hair', 'haircut', 'style', 'brush hair', 'comb'],
    '🪒': ['shave', 'shaving', 'razor', 'beard'],
    '🧴': ['skincare', 'moisturize', 'lotion', 'cream', 'deodorant', 'soap'],
    
    // Food & Cooking
    '🍳': ['breakfast', 'morning meal', 'eggs', 'cook breakfast', 'fry'],
    '🥗': ['lunch', 'salad', 'healthy', 'vegetables', 'green'],
    '🍽️': ['dinner', 'meal', 'eat', 'dining', 'supper', 'dishes'],
    '👨‍🍳': ['cook', 'cooking', 'chef', 'prepare', 'kitchen', 'recipe'],
    '🍴': ['eat', 'eating', 'fork', 'utensils'],
    '🥤': ['drink', 'beverage', 'liquid', 'hydrate'],
    '💧': ['water', 'hydration', 'drink water', 'h2o', 'wash', 'rinse'],
    '☕': ['coffee', 'morning coffee', 'caffeine', 'espresso', 'latte'],
    '🍵': ['tea', 'herbal', 'green tea', 'chai'],
    '🍪': ['snack', 'snacking', 'cookie', 'treat'],
    
    // Sleep & Rest
    '😴': ['sleep', 'sleeping', 'nap', 'napping', 'rest', 'tired', 'bedtime'],
    '🛏️': ['bed', 'bedroom', 'make bed', 'bedtime'],
    '😌': ['relax', 'relaxing', 'calm', 'peaceful', 'unwind'],
    
    // Work & Productivity
    '💼': ['work', 'job', 'office', 'business', 'career'],
    '📚': ['study', 'studying', 'learn', 'course', 'education', 'books'],
    '📖': ['read', 'reading', 'book', 'literature'],
    '✍️': ['write', 'writing', 'journal', 'notes', 'pen'],
    '📧': ['email', 'message', 'inbox', 'correspondence'],
    '👥': ['meeting', 'team', 'group', 'social', 'friend', 'people'],
    '📞': ['call', 'phone', 'telephone', 'contact'],
    '✅': ['task', 'todo', 'complete', 'check', 'done', 'finish'],
    '📋': ['project', 'plan', 'list', 'organize'],
    '📅': ['schedule', 'calendar', 'appointment', 'plan', 'deadline', 'date'],
    '🗂️': ['organize', 'filing', 'documents', 'sort'],
    '🎯': ['focus', 'goal', 'target', 'concentrate', 'practice', 'skill'],
    
    // Cleaning & Chores
    '🧹': ['clean', 'cleaning', 'sweep', 'tidy', 'vacuum', 'mop'],
    '👕': ['laundry', 'clothes', 'washing', 'fold'],
    '🗑️': ['trash', 'garbage', 'waste', 'bin'],
    '📦': ['declutter', 'organize', 'pack', 'storage'],
    
    // Transportation
    '🚗': ['drive', 'driving', 'car', 'commute'],
    '🚇': ['commute', 'subway', 'metro', 'transport'],
    '✈️': ['travel', 'trip', 'flight', 'vacation'],
    '🚴': ['bike', 'bicycle', 'cycling', 'ride'],
    '🚌': ['bus', 'public transport'],
    '🚆': ['train', 'railway'],
    
    // Social & Family
    '👨‍👩‍👧‍👦': ['family', 'relatives', 'kids', 'children'],
    '🏠': ['visit', 'home', 'house'],
    '💕': ['date', 'romantic', 'love', 'partner'],
    '🎉': ['party', 'celebrate', 'celebration', 'fun'],
    
    // Health & Medical
    '💊': ['medicine', 'pill', 'medication', 'vitamin', 'supplement', 'take pills'],
    '👩‍⚕️': ['doctor', 'medical', 'physician', 'nurse'],
    '🗣️': ['therapy', 'counseling', 'talk', 'session'],
    
    // Nature & Outdoors
    '🌱': ['garden', 'gardening', 'plant', 'grow'],
    '🌿': ['nature', 'outdoor', 'fresh', 'green'],
    '🌳': ['park', 'tree', 'forest', 'outside'],
    '🌞': ['outdoor', 'sunshine', 'outside'],
    '☀️': ['sun', 'sunny', 'bright', 'vitamin d'],
    '🌬️': ['fresh air', 'wind', 'breathe', 'air'],
    
    // Technology
    '💻': ['computer', 'laptop', 'code', 'coding', 'program', 'programming'],
    '📱': ['phone', 'mobile', 'smartphone'],
    '🌐': ['internet', 'web', 'online', 'browse'],
    '💾': ['backup', 'save', 'data'],
    '🔄': ['update', 'refresh', 'sync'],
    
    // Learning & Growth
    '🎓': ['learn', 'education', 'graduate', 'university'],
    '🎨': ['hobby', 'create', 'art', 'creative', 'paint'],
    '🎵': ['music', 'listen', 'song'],
    '🎸': ['instrument', 'guitar', 'play'],
    
    // Time management
    '⏰': ['reminder', 'alarm', 'wake up', 'time'],
    '⏱️': ['timer', 'stopwatch', 'timing'],
    
    // Shopping & Errands
    '🛒': ['shop', 'shopping', 'grocery', 'store', 'buy'],
    '🏪': ['store', 'shop', 'retail'],
    '💳': ['buy', 'purchase', 'pay', 'payment'],
    '📝': ['errand', 'list', 'note', 'reminder'],
    '🏦': ['bank', 'banking', 'money'],
    '📮': ['post', 'mail', 'letter'],
    
    // Spiritual & Mental
    '🙏': ['pray', 'prayer', 'grateful', 'thanks', 'blessing'],
    '📔': ['journal', 'diary', 'write', 'reflect'],
    '🤔': ['reflect', 'think', 'ponder', 'consider'],
    '💨': ['breathe', 'breathing', 'air', 'lungs']
};

interface EmojiMatch {
    emoji: string;
    score: number;
    matchedWords: string[];
}

/**
 * Gets an emoji based on a text input using smart keyword matching and Levenshtein distance
 */
export function getEmojiForText(text: string): string | null {
    if (!text || text.trim().length === 0) return null;
    
    const cleanText = text.toLowerCase().trim();
    const inputWords = cleanText.split(/\s+/).map(word => word.replace(/[^\w]/g, ''));
    
    const matches: EmojiMatch[] = [];
    
    // Check our custom emoji mappings
    for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORD_MAPPINGS)) {
        let score = 0;
        const matchedWords: string[] = [];
        
        // Check each keyword against all input words
        for (const keyword of keywords) {
            const keywordWords = keyword.split(/\s+/);
            
            // For multi-word keywords (like "morning jog"), check if all words match
            if (keywordWords.length > 1) {
                let allWordsMatch = true;
                let multiWordScore = 0;
                
                for (const keywordWord of keywordWords) {
                    let wordFound = false;
                    for (const inputWord of inputWords) {
                        const distance = levenshtein.get(keywordWord, inputWord);
                        if (distance <= 2) {
                            wordFound = true;
                            // Exact match gets higher score than fuzzy match
                            multiWordScore += distance === 0 ? 10 : (3 - distance);
                            break;
                        }
                    }
                    if (!wordFound) {
                        allWordsMatch = false;
                        break;
                    }
                }
                
                if (allWordsMatch) {
                    score += multiWordScore + 5; // Bonus for multi-word matches
                    matchedWords.push(keyword);
                }
            } else {
                // Single word keyword
                for (const inputWord of inputWords) {
                    const distance = levenshtein.get(keyword, inputWord);
                    if (distance <= 2) {
                        // Exact match gets higher score than fuzzy match
                        score += distance === 0 ? 10 : (3 - distance);
                        matchedWords.push(keyword);
                        break; // Don't count the same keyword multiple times
                    }
                }
            }
        }
        
        if (score > 0) {
            matches.push({ emoji, score, matchedWords });
        }
    }
    
    // Also check emojilib for additional coverage
    for (const word of inputWords) {
        if (word.length < 3) continue; // Skip very short words
        
        for (const [emoji, keywords] of Object.entries(emojilib)) {
            if (Array.isArray(keywords)) {
                for (const keyword of keywords) {
                    const distance = levenshtein.get(keyword, word);
                    if (distance <= 2) {
                        const existingMatch = matches.find(m => m.emoji === emoji);
                        const points = distance === 0 ? 5 : (3 - distance);
                        
                        if (existingMatch) {
                            existingMatch.score += points;
                            existingMatch.matchedWords.push(keyword);
                        } else {
                            matches.push({ emoji, score: points, matchedWords: [keyword] });
                        }
                        break; // Don't count the same keyword multiple times
                    }
                }
            }
        }
    }
    
    // Sort by score (highest first) and return the best match
    if (matches.length > 0) {
        matches.sort((a, b) => b.score - a.score);
        return matches[0].emoji;
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
 * Checks if text contains an emoji anywhere in the string
 * Uses a more comprehensive regex to detect various emoji ranges
 */
export function containsEmoji(text: string): boolean {
    if (!text) return false;
    
    // More comprehensive emoji regex that covers most emoji ranges
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]/u;
    
    return emojiRegex.test(text);
}

/**
 * Checks if text starts with an emoji
 * Uses a more comprehensive regex to detect various emoji ranges
 */
export function startsWithEmoji(text: string): boolean {
    if (!text) return false;
    
    // More comprehensive emoji regex that covers most emoji ranges
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|^[\u{1F300}-\u{1F5FF}]|^[\u{1F680}-\u{1F6FF}]|^[\u{1F1E0}-\u{1F1FF}]|^[\u{2600}-\u{26FF}]|^[\u{2700}-\u{27BF}]|^[\u{1F900}-\u{1F9FF}]|^[\u{1F018}-\u{1F270}]|^[\u{238C}-\u{2454}]|^[\u{20D0}-\u{20FF}]/u;
    
    return emojiRegex.test(text.trim());
}

/**
 * Automatically assigns emoji to a step name if auto-emoji is enabled and no emoji exists
 */
export function autoAssignEmoji(stepName: string, autoEmojiEnabled: boolean): string {
    if (!autoEmojiEnabled || !stepName) {
        return stepName;
    }
    
    const trimmedName = stepName.trim();
    
    // Only add emoji if text doesn't already contain one anywhere
    if (containsEmoji(trimmedName)) {
        return trimmedName;
    }
    
    // Get the best emoji for the text
    const emoji = getEmojiForText(trimmedName);
    if (emoji) {
        return addEmojiToText(trimmedName, emoji);
    }
    
    return trimmedName;
}
