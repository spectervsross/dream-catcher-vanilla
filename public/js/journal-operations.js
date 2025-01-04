class JournalOperations {
    constructor() {
        this.dataStore = Backendless.Data.of('JournalEntries');
    }

    // Create a new journal entry
    async createEntry(entry) {
        try {
            const currentUser = Backendless.UserService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be logged in to create entries');
            }

            const newEntry = {
                title: entry.title,
                content: entry.content,
                created_at: new Date(),
                updated_at: new Date(),
                userId: currentUser.objectId,
                mood: entry.mood || null,
                tags: entry.tags || null,
                interpretation: entry.interpretation || null,
                isPublic: entry.isPublic || false
            };

            const savedEntry = await this.dataStore.save(newEntry);
            console.log('Entry created successfully:', savedEntry);
            return savedEntry;
        } catch (error) {
            console.error('Error creating entry:', error);
            throw error;
        }
    }

    // Get all entries for the current user
    async getUserEntries(options = {}) {
        try {
            const currentUser = Backendless.UserService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be logged in to view entries');
            }

            const queryBuilder = Backendless.DataQueryBuilder.create();
            queryBuilder.setWhereClause(`userId = '${currentUser.objectId}'`);
            
            // Add sorting (newest first by default)
            queryBuilder.setSortBy(['created_at DESC']);

            // Add pagination if specified
            if (options.pageSize) {
                queryBuilder.setPageSize(options.pageSize);
                if (options.offset) {
                    queryBuilder.setOffset(options.offset);
                }
            }

            const entries = await this.dataStore.find(queryBuilder);
            return entries;
        } catch (error) {
            console.error('Error fetching user entries:', error);
            throw error;
        }
    }

    // Get a single entry by ID
    async getEntry(entryId) {
        try {
            const currentUser = Backendless.UserService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be logged in to view entries');
            }

            const entry = await this.dataStore.findById(entryId);
            
            // Check if the entry belongs to the current user
            if (entry.userId !== currentUser.objectId) {
                throw new Error('Access denied: Entry belongs to another user');
            }

            return entry;
        } catch (error) {
            console.error('Error fetching entry:', error);
            throw error;
        }
    }

    // Update an existing entry
    async updateEntry(entryId, updates) {
        try {
            const currentUser = Backendless.UserService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be logged in to update entries');
            }

            // First, get the existing entry
            const existingEntry = await this.getEntry(entryId);
            
            // Check ownership
            if (existingEntry.userId !== currentUser.objectId) {
                throw new Error('Access denied: Cannot update another user\'s entry');
            }

            // Prepare update object
            const updateData = {
                ...updates,
                objectId: entryId,
                updated_at: new Date()
            };

            const updatedEntry = await this.dataStore.save(updateData);
            console.log('Entry updated successfully:', updatedEntry);
            return updatedEntry;
        } catch (error) {
            console.error('Error updating entry:', error);
            throw error;
        }
    }

    // Delete an entry
    async deleteEntry(entryId) {
        try {
            const currentUser = Backendless.UserService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be logged in to delete entries');
            }

            // First, get the existing entry
            const existingEntry = await this.getEntry(entryId);
            
            // Check ownership
            if (existingEntry.userId !== currentUser.objectId) {
                throw new Error('Access denied: Cannot delete another user\'s entry');
            }

            // Delete the entry
            const result = await this.dataStore.remove(entryId);
            console.log('Entry deleted successfully');
            return result;
        } catch (error) {
            console.error('Error deleting entry:', error);
            throw error;
        }
    }

    // Search entries by title, content, or tags
    async searchEntries(searchTerm) {
        try {
            const currentUser = Backendless.UserService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be logged in to search entries');
            }

            const queryBuilder = Backendless.DataQueryBuilder.create();
            queryBuilder.setWhereClause(
                `userId = '${currentUser.objectId}' AND ` +
                `(title LIKE '%${searchTerm}%' OR ` +
                `content LIKE '%${searchTerm}%' OR ` +
                `tags LIKE '%${searchTerm}%')`
            );
            queryBuilder.setSortBy(['created_at DESC']);

            const entries = await this.dataStore.find(queryBuilder);
            return entries;
        } catch (error) {
            console.error('Error searching entries:', error);
            throw error;
        }
    }

    // Get entries by mood
    async getEntriesByMood(mood) {
        try {
            const currentUser = Backendless.UserService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be logged in to filter entries');
            }

            const queryBuilder = Backendless.DataQueryBuilder.create();
            queryBuilder.setWhereClause(`userId = '${currentUser.objectId}' AND mood = '${mood}'`);
            queryBuilder.setSortBy(['created_at DESC']);

            const entries = await this.dataStore.find(queryBuilder);
            return entries;
        } catch (error) {
            console.error('Error fetching entries by mood:', error);
            throw error;
        }
    }

    // Get entries by date range
    async getEntriesByDateRange(startDate, endDate) {
        try {
            const currentUser = Backendless.UserService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be logged in to filter entries');
            }

            const queryBuilder = Backendless.DataQueryBuilder.create();
            queryBuilder.setWhereClause(
                `userId = '${currentUser.objectId}' AND ` +
                `created_at >= '${startDate.toISOString()}' AND ` +
                `created_at <= '${endDate.toISOString()}'`
            );
            queryBuilder.setSortBy(['created_at DESC']);

            const entries = await this.dataStore.find(queryBuilder);
            return entries;
        } catch (error) {
            console.error('Error fetching entries by date range:', error);
            throw error;
        }
    }
}

// Export the class
export default JournalOperations; 