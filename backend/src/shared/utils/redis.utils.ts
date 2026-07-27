import { redisClient } from "../../config/redis.config.js";


export const cacheManager = {
    createCacheKey: (moduleName:string, identifier:string) => {
        return `lms:${moduleName}:${identifier}`;
    },

    async setJson(key: string, value: any, ttlInSeconds = 3600) {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
    },

    async getJson(key: string) {
        const data = await redisClient.get(key);
        if(!data) return null;
        return JSON.parse(data);
    },

    async invalidate(key: string) {
        await redisClient.del(key);
    },

    async invalidateByPattern(pattern: string) {
        const stream = redisClient.scanStream({
            match: pattern,
        });
        stream.on('data', async (keys: string[]) => {
            if(keys.length) {
                const pipeline = redisClient.pipeline();
                keys.forEach((key) => {
                    pipeline.del(key);
                });
                await pipeline.exec();
            }
        })
    }
}
