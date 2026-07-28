import { redisClient } from "../../config/redis.config.js";


export enum CacheKeyPrefix {
    ASSIGNMENTS = "assignments",
    CLASSES = "classes",
    USERS = "users",
    SUBMISSIONS = "submissions",
    ENROLLMENTS = "enrollments",
    COURSES = "courses",
    RESOURCES = "resources"
}

export const cacheKeys = {
    assignments : () => `lms:${CacheKeyPrefix.ASSIGNMENTS}:all`,
    classAssignments : (classId: string) => `lms:${CacheKeyPrefix.ASSIGNMENTS}:class:${classId}`,
    assignment: (identifier: string) => `lms:${CacheKeyPrefix.ASSIGNMENTS}:${identifier}`,


    classes: () => `lms:${CacheKeyPrefix.CLASSES}:all`,
    class: (identifier: string) => `lms:${CacheKeyPrefix.CLASSES}:${identifier}`,
    classesByFaculty: (facultyId: string) => `lms:${CacheKeyPrefix.CLASSES}:faculty:${facultyId}`,


    courses : () => `lms:${CacheKeyPrefix.COURSES}:all`,
    course: (identifier: string) => `lms:${CacheKeyPrefix.COURSES}:${identifier}`,
    courseByCode: (courseCode: string) => `lms:${CacheKeyPrefix.COURSES}:code:${courseCode}`,

    user: (identifier: string) => `lms:${CacheKeyPrefix.USERS}:${identifier}`,
    users : () => `lms:${CacheKeyPrefix.USERS}:all`,
    studentsWithBranchAndSem : (branch: string, sem: number) => `lms:${CacheKeyPrefix.USERS}:students:${branch}:${sem}`,


    submissions: (identifier: string) => `lms:${CacheKeyPrefix.SUBMISSIONS}:${identifier}`,
    submissionsByAssignment: (assignmentId: string) => `lms:${CacheKeyPrefix.SUBMISSIONS}:assignment:${assignmentId}`,
    submissionsByStudent: (studentId: string) => `lms:${CacheKeyPrefix.SUBMISSIONS}:student:${studentId}`,

    enrollments: (identifier: string) => `lms:${CacheKeyPrefix.ENROLLMENTS}:${identifier}`,
    enrollmentsByClass: (classId: string) => `lms:${CacheKeyPrefix.ENROLLMENTS}:class:${classId}`,
    enrollmentsByStudent: (studentId: string) => `lms:${CacheKeyPrefix.ENROLLMENTS}:student:${studentId}`,  


    resources : () => `lms:${CacheKeyPrefix.RESOURCES}:all`,
    resource : (identifier: string) => `lms:${CacheKeyPrefix.RESOURCES}:${identifier}`,
    resourcesByClass : (classId: string) => `lms:${CacheKeyPrefix.RESOURCES}:class:${classId}`,
}

export const cacheManager = {
    createCacheKey: (moduleName:string, identifier:string) => {
        return `lms:${moduleName}:${identifier}`;
    },

    createDoubleIdentifierCacheKey(moduleName: string, identifier1: string, identifier2: string) {
        return `lms:${moduleName}:${identifier1}:${identifier2}`;
    },

    async getOrSet(key: string, fetchFunction: () => Promise<any>, ttlInSeconds = 3600) {
        const cachedData = await this.getJson(key);
        if (cachedData !== null) {
            return cachedData;
        }
        const data = await fetchFunction();
        await this.setJson(key, data, ttlInSeconds);
        return data;
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
        return new Promise<void>((resolve, reject) => {
            const stream = redisClient.scanStream({ match: pattern });
            const deletions: Promise<any>[] = [];

            stream.on('data', (keys: string[]) => {
                if (keys.length) {
                    deletions.push(redisClient.del(...keys));
                }
            });

            stream.on('end', async () => {
                await Promise.all(deletions);
                resolve();
            });

            stream.on('error', reject);
        });
    }
}
