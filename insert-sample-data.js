const Backendless = require('backendless');

// Initialize Backendless
Backendless.initApp('4DD34E37-20BB-4318-8FDB-81318F096BAD', '8945F044-0E41-4CD1-94F3-2403FE5CC316');

async function insertSampleData() {
    try {
        console.log('Starting sample data insertion...');

        // Sample data for ChatSession
        const chatSessions = [
            {
                title: "Flying Dream",
                symbol: "🦅",
                mood: "Excited",
                note: "A vivid dream about flying over mountains and oceans",
                ___class: 'ChatSession'
            },
            {
                title: "Lost in Forest",
                symbol: "🌲",
                mood: "Anxious",
                note: "Dream about being lost in a mysterious forest at night",
                ___class: 'ChatSession'
            },
            {
                title: "Meeting Old Friend",
                symbol: "👥",
                mood: "Nostalgic",
                note: "Dreamed about reuniting with a childhood friend",
                ___class: 'ChatSession'
            }
        ];

        // Insert ChatSessions
        console.log('\nInserting ChatSession samples...');
        const savedSessions = [];
        for (const session of chatSessions) {
            const savedSession = await Backendless.Data.of("ChatSession").save(session);
            savedSessions.push(savedSession);
            console.log(`Created ChatSession: ${savedSession.title}`);
        }

        // Sample data for Journal entries
        const journalEntries = [
            // Entries for Flying Dream
            {
                role: "user",
                message: "I had a dream where I was flying over beautiful landscapes.",
                chatSessionId: savedSessions[0].objectId,
                ___class: 'Journal'
            },
            {
                role: "assistant",
                message: "Flying dreams often represent feelings of freedom and empowerment. How did you feel during the flight?",
                chatSessionId: savedSessions[0].objectId,
                ___class: 'Journal'
            },
            // Entries for Lost in Forest
            {
                role: "user",
                message: "I was wandering in a dark forest and couldn't find my way out.",
                chatSessionId: savedSessions[1].objectId,
                ___class: 'Journal'
            },
            {
                role: "assistant",
                message: "Being lost in a forest can symbolize feeling confused or uncertain about a life situation. What was the atmosphere like in the forest?",
                chatSessionId: savedSessions[1].objectId,
                ___class: 'Journal'
            },
            // Entries for Meeting Old Friend
            {
                role: "user",
                message: "I met my old friend from elementary school in the dream.",
                chatSessionId: savedSessions[2].objectId,
                ___class: 'Journal'
            },
            {
                role: "assistant",
                message: "Dreams about old friends often reflect nostalgia or unresolved feelings from the past. What emotions did you experience during the reunion?",
                chatSessionId: savedSessions[2].objectId,
                ___class: 'Journal'
            }
        ];

        // Insert Journal entries
        console.log('\nInserting Journal entries...');
        for (const entry of journalEntries) {
            const savedEntry = await Backendless.Data.of("Journal").save(entry);
            console.log(`Created Journal entry for session: ${entry.chatSessionId}`);
        }

        console.log('\nSample data insertion completed successfully!');
    } catch (error) {
        console.error('Error inserting sample data:', error);
        process.exit(1);
    }
}

// Run the insertion
insertSampleData(); 