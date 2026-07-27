import { SupabaseConstants } from "../../shared/constants/supabase.constants.js";
import { CacheKeyPrefix, cacheKeys, cacheManager } from "../../shared/utils/redis.utils.js";
import { deleteFromCloud, uploadToCloud } from "../../shared/utils/supabase.util.js";
import { ClassesService } from "../classes/classes.service.js";
import { resourcesRepository } from "./resources.repository.js";
import type { CreateResourceInput } from "./resources.validation.js";



export class ResourcesService {
    private readonly resourcesRepository: resourcesRepository;
    private readonly classService: ClassesService;

    constructor() {
        this.resourcesRepository = new resourcesRepository();
        this.classService = new ClassesService();
    }

    async getResourcesByClassId(classId: string) {
        const cachedResources = await cacheManager.getJson(cacheKeys.resourcesByClass(classId));
        if(cachedResources != null){
            return cachedResources;
        }
        const classExists = await this.classService.getClassById(classId);
        if (!classExists) {
            throw new Error("Class not found");
        }
        const resources = await this.resourcesRepository.getResourcesByClassId(classId);
        await cacheManager.setJson(cacheKeys.resourcesByClass(classId), resources);
        return resources;
    }

    async getAllResources() {
        const cachedResources = await cacheManager.getJson(cacheKeys.resources());
        if(cachedResources != null){
            return cachedResources;
        }
        const resources = await this.resourcesRepository.getAllResources();
        await cacheManager.setJson(cacheKeys.resources(), resources);
        return resources;
    }

    async getResourceById(resourceId: string) {
        const cachedResource = await cacheManager.getJson(cacheKeys.resource(resourceId));
        if(cachedResource != null){
            return cachedResource;
        }
        const resource = await this.resourcesRepository.getResourceById(resourceId);
        if (!resource) {
            throw new Error("Resource not found");
        }
        await cacheManager.setJson(cacheKeys.resource(resourceId), resource);
        return resource;
    }

    async deleteResource(resourceId: string) {
        const resource = await this.resourcesRepository.getResourceById(resourceId);
        if (!resource) {
            throw new Error("Resource not found");
        }
        if (resource.attachmentUrl) {
            await deleteFromCloud(resource.attachmentUrl, SupabaseConstants.resourcesBucket);
        }
        const deletedResource = await this.resourcesRepository.deleteResource(resourceId);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.RESOURCES, "*"));
        return deletedResource;
    }

    async createResource(data: CreateResourceInput, file: Express.Multer.File | null) {
        const classExists = await this.classService.getClassById(data.classId);
        if (!classExists) {
            throw new Error("Class not found");
        }
        let attachmentUrl: string | null = null;
        if (file) {
            attachmentUrl = await uploadToCloud(file, SupabaseConstants.resourcesBucket);
            console.log("Attachment uploaded to cloud storage:", attachmentUrl);
        }
        const createdResource = await this.resourcesRepository.createResource(data, attachmentUrl);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.RESOURCES, "*"));
        return createdResource;
    }

    async updateResource(resourceId: string, data: Partial<CreateResourceInput>, file: Express.Multer.File | null) {
        const resource = await this.resourcesRepository.getResourceById(resourceId);
        if (!resource) {
            throw new Error("Resource not found");
        }
        if (data.classId) {
            const classExists = await this.classService.getClassById(data.classId);
            if (!classExists) {
                throw new Error("Class not found");
            }
        }

        let resourceUrl: string | null = resource.attachmentUrl;
        let newresourceUrl: string | null = resource.attachmentUrl;

        if (file) {
            newresourceUrl = await uploadToCloud(file, SupabaseConstants.resourcesBucket);

            if (resourceUrl) {
                await deleteFromCloud(resourceUrl, SupabaseConstants.resourcesBucket);
            }
        }

        const updatedResource = await this.resourcesRepository.updateResource(resourceId, data, newresourceUrl);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.RESOURCES, "*"));
        return updatedResource;
    }

}
