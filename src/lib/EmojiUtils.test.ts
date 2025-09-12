import { getEmojiForText, autoAssignEmoji, startsWithEmoji } from './EmojiUtils';

// Test cases to demonstrate the improvements
const testCases = [
    'morning jog',        // Should match 🏃 (multi-word match)
    'morning',           // Should NOT match 🏃 (single word, lower score)
    'jog',               // Should match 🏃 (single word exact match)
    'brush teeth',       // Should match 🪥 (multi-word match)
    'brush',             // Should match 🪥 but lower score than "brush teeth"
    'exercise',          // Should match 💪
    'workout',           // Should match 🏋️
    'yoga session',      // Should match 🧘
    'take vitamins',     // Should match 💊
    'drink water',       // Should match 💧
    'morning coffee',    // Should match ☕
    'evening walk',      // Should match 🚶
    'clean house',       // Should match 🧹
    'study for exam',    // Should match 📚
    'go shopping',       // Should match 🛒
    '🏃 already has emoji', // Should return original (already has emoji)
    '',                  // Should return null (empty string)
];

console.log('=== Emoji Matching Test Results ===\n');

testCases.forEach(testCase => {
    const emoji = getEmojiForText(testCase);
    const hasEmoji = startsWithEmoji(testCase);
    const autoAssigned = autoAssignEmoji(testCase, true);
    
    console.log(`Input: "${testCase}"`);
    console.log(`  Emoji found: ${emoji || 'none'}`);
    console.log(`  Has emoji: ${hasEmoji}`);
    console.log(`  Auto-assigned: "${autoAssigned}"`);
    console.log('---');
});

export default 'Emoji Utils Test';
