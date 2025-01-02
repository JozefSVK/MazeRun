// Storage.js
class Storage {
    static PLAYED_LEVELS_KEY = 'mazerun_played_levels';
    static CURRENT_LEVEL_KEY = 'mazerun_current_level';
    
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
     * Save a level ID as played
     */
    static addPlayedLevel(levelId) {
        try {
            const played = this.getPlayedLevels();
            if (!played.includes(levelId)) {
                played.push(levelId);
                localStorage.setItem(this.PLAYED_LEVELS_KEY, JSON.stringify(played));
            }
        } catch (error) {
            console.error('Error saving played level:', error);
        }
    }

    /**
     * Save the current level
     */
    static saveCurrentLevel(levelId) {
        try {
            localStorage.setItem(this.CURRENT_LEVEL_KEY, levelId.toString());
        } catch (error) {
            console.error('Error saving current level:', error);
        }
    }

    /**
     * Get the current level
     */
    static getCurrentLevel() {
        try {
            const level = localStorage.getItem(this.CURRENT_LEVEL_KEY);
            return level ? parseInt(level) : 1;  // Default to level 1 if none saved
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