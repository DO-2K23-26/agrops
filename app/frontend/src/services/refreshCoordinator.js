// This utility manages refresh patterns across the application
// to coordinate when and how often different components update data

class RefreshCoordinator {
  constructor() {
    this.refreshTimers = new Map();
    this.subscribers = new Map();
    this.isEnabled = true;
    this.lastRefreshes = new Map();
    this.refreshRates = {
      players: 60000,      // 1 minute for player status
      metrics: 30000,      // 30 seconds for metrics
      matchHistory: 120000 // 2 minutes for match history
    };
    this.errorBackoffs = {
      players: 1,
      metrics: 1,
      matchHistory: 1
    };
  }

  // Enable or disable all refreshes (can be used to pause during debugging)
  setEnabled(enabled) {
    this.isEnabled = !!enabled;
    
    if (!this.isEnabled) {
      // Clear all timers when disabled
      for (const [key, timerId] of this.refreshTimers.entries()) {
        clearTimeout(timerId);
        this.refreshTimers.delete(key);
      }
    } else {
      // Restart timers when re-enabled
      for (const [key, subscribers] of this.subscribers.entries()) {
        if (subscribers.size > 0) {
          this.scheduleNextRefresh(key);
        }
      }
    }
  }

  // Subscribe to a specific refresh type
  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    
    this.subscribers.get(type).add(callback);
    
    // Schedule a refresh if this is the first subscriber and refreshing is enabled
    if (this.subscribers.get(type).size === 1 && this.isEnabled && !this.refreshTimers.has(type)) {
      this.scheduleNextRefresh(type);
    }
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(type, callback);
    };
  }

  // Unsubscribe from a refresh type
  unsubscribe(type, callback) {
    if (!this.subscribers.has(type)) return;
    
    this.subscribers.get(type).delete(callback);
    
    // If no more subscribers, cancel any pending refresh
    if (this.subscribers.get(type).size === 0 && this.refreshTimers.has(type)) {
      clearTimeout(this.refreshTimers.get(type));
      this.refreshTimers.delete(type);
    }
  }

  // Schedule the next refresh for a specific type
  scheduleNextRefresh(type) {
    if (!this.isEnabled) return;
    
    // Clear any existing timer
    if (this.refreshTimers.has(type)) {
      clearTimeout(this.refreshTimers.get(type));
    }
    
    // Calculate delay based on refresh rate and backoff
    const baseRate = this.refreshRates[type] || 60000; // Default to 1 minute
    const backoffFactor = this.errorBackoffs[type] || 1;
    const delay = baseRate * backoffFactor;
    
    // Schedule next refresh
    const timerId = setTimeout(() => {
      this.executeRefresh(type);
    }, delay);
    
    this.refreshTimers.set(type, timerId);
  }

  // Execute refresh for a specific type
  executeRefresh(type) {
    if (!this.isEnabled) return;
    
    // Track last refresh time
    this.lastRefreshes.set(type, Date.now());
    
    // Call all subscribers
    if (this.subscribers.has(type)) {
      for (const callback of this.subscribers.get(type)) {
        try {
          callback();
        } catch (error) {
          console.error(`Error in refresh callback for ${type}:`, error);
        }
      }
    }
    
    // Schedule next refresh
    this.scheduleNextRefresh(type);
  }

  // Force an immediate refresh
  forceRefresh(type) {
    if (!this.isEnabled) return;
    
    // Only proceed if we have subscribers
    if (this.subscribers.has(type) && this.subscribers.get(type).size > 0) {
      this.executeRefresh(type);
    }
  }

  // Report a successful refresh
  reportSuccess(type) {
    // Reset backoff on success
    this.errorBackoffs[type] = 1;
  }

  // Report an error during refresh to increase backoff
  reportError(type) {
    // Increase backoff factor, capping at a maximum value
    this.errorBackoffs[type] = Math.min(this.errorBackoffs[type] * 2, 5);
  }

  // Get current status for debugging
  getStatus() {
    const status = {};
    
    for (const type of Object.keys(this.refreshRates)) {
      const subscriberCount = this.subscribers.has(type) ? this.subscribers.get(type).size : 0;
      const lastRefresh = this.lastRefreshes.get(type) || null;
      const hasTimer = this.refreshTimers.has(type);
      const backoffFactor = this.errorBackoffs[type] || 1;
      const effectiveRate = this.refreshRates[type] * backoffFactor;
      
      status[type] = {
        baseRate: this.refreshRates[type],
        effectiveRate,
        backoffFactor,
        subscriberCount,
        active: hasTimer,
        lastRefresh: lastRefresh ? new Date(lastRefresh).toISOString() : null,
      };
    }
    
    return {
      enabled: this.isEnabled,
      refreshTypes: status
    };
  }
}

// Create a singleton instance
const refreshCoordinator = new RefreshCoordinator();

export default refreshCoordinator;
