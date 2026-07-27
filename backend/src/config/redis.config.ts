
import { Redis } from 'ioredis';
import { env } from './config.js';
import { fa } from 'zod/locales';

const REDIS_URL = env.REDIS_URL;

export const redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // what it do is to prevent the client from throwing an error when the server is down
    retryStrategy: (times) =>{
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    // This function is called when the client encounters an error while trying to reconnect to the server, and when it returns true, the client will attempt to reconnect to the server. If it returns false, the client will not attempt to reconnect and will instead emit an error event.
    reconnectOnError(err){
        const targetError = "READONLY";
        if(err.message.includes(targetError)){
            return true;
        }
        return false;
    }

})