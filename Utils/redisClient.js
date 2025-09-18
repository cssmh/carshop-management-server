import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379"; // Use IPv4 explicitly

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
  console.log("Make sure Redis server is running and accessible at:", redisUrl);
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis at:", redisUrl);
});

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis client connected successfully!");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
})();

export default redisClient;
