class RateLimiter {
    constructor(limit, interval) {
        this.limit = limit; // Maximum number of requests allowed within the interval
        this.interval = interval; // Time interval in milliseconds
        this.requests = new Map(); // Map to store the request timestamps for each user
    }

    isRateLimited(sid) {
        const userRequests = this.requests.get(sid) || [];
        const now = Date.now();
        const windowStart = now - this.interval;

        // Remove expired requests from the sliding window
        const validRequests = userRequests.filter((timestamp) => timestamp > windowStart);
        validRequests.push(now); // Add the current request to the window

        // Update the requests map
        this.requests.set(sid, validRequests);

        // Check if the number of requests exceeds the limit
        return validRequests.length > this.limit;
    }

    addRequest(sid) {
        const userRequests = this.requests.get(sid) || [];
        const now = Date.now();
        userRequests.push(now);
        this.requests.set(sid, userRequests);
    }
}

module.exports = RateLimiter;
