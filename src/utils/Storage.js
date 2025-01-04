class Storage {
    static PLAYED_LEVELS_KEY = 'mazerun_played_levels';
    static CURRENT_LEVEL_KEY = 'mazerun_current_level';
    static LEVEL_COUNT_KEY = 'mazerun_level_count';  // New key for tracking sequential count
    
    /**
     * Get array of played level IDs
     */
    static getPlayedLevels() {
        try {
            const played = localStorage.getItem(this.PLAYED_LEVELS_KEY);
            return played ? JSON.parse(played) : [];
        } catch (error) {
            console.error('Error getting played levels:', error);
            return [];
        }
    }

    /**
     * Get the sequential level number (1, 2, 3...)
     */
    static getLevelCount() {
        try {
            const count = localStorage.getItem(this.LEVEL_COUNT_KEY);
            return count ? parseInt(count) : 1;  // Default to 1 if no count saved
        } catch (error) {
            console.error('Error getting level count:', error);
            return 1;
        }
    }

    /**
     * Save a level ID as played and increment the level count
     */
    static addPlayedLevel(levelId) {
        try {
            // Save the played level ID
            const played = this.getPlayedLevels();
            if (!played.includes(levelId)) {
                played.push(levelId);
                localStorage.setItem(this.PLAYED_LEVELS_KEY, JSON.stringify(played));
                
                // Increment the sequential level count
                const currentCount = this.getLevelCount();
                localStorage.setItem(this.LEVEL_COUNT_KEY, (currentCount + 1).toString());
            }
        } catch (error) {
            console.error('Error saving played level:', error);
        }
    }

    /**
     * Save the current level ID (internal use)
     */
    static saveCurrentLevel(levelId) {
        try {
            localStorage.setItem(this.CURRENT_LEVEL_KEY, levelId.toString());
        } catch (error) {
            console.error('Error saving current level:', error);
        }
    }

    /**
     * Get the current level ID (internal use)
     */
    static getCurrentLevel() {
        try {
            const level = localStorage.getItem(this.CURRENT_LEVEL_KEY);
            return level ? parseInt(level) : 1;
        } catch (error) {
            console.error('Error getting current level:', error);
            return 1;
        }
    }

    /**
     * Clear all game progress
     */
    static clearProgress() {
        try {
            localStorage.removeItem(this.PLAYED_LEVELS_KEY);
            localStorage.removeItem(this.CURRENT_LEVEL_KEY);
            localStorage.removeItem(this.LEVEL_COUNT_KEY);
        } catch (error) {
            console.error('Error clearing progress:', error);
        }
    }

    /**
     * Get array of level IDs that haven't been played yet
     */
    static getUnplayedLevels(allLevels) {
        try {
            const played = this.getPlayedLevels();
            const allLevelIds = allLevels.map(level => level.id);
            return allLevelIds.filter(id => !played.includes(id));
        } catch (error) {
            console.error('Error getting unplayed levels:', error);
            return [];
        }
    }

    /**
     * Check if all levels have been played
     */
    static areAllLevelsPlayed(allLevels) {
        const unplayedLevels = this.getUnplayedLevels(allLevels);
        return unplayedLevels.length === 0;
    }

    /**
     * Get a random unplayed level ID
     */
    static getRandomUnplayedLevel(allLevels) {
        const unplayedLevels = this.getUnplayedLevels(allLevels);
        if (unplayedLevels.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * unplayedLevels.length);
        return unplayedLevels[randomIndex];
    }
}

export default Storage;