import { prisma } from "../../db/prisma.js";
import type { CreateResourceInput } from "./resources.validation.js";



export class resourcesRepository {

    
    async getResourcesByClassId(classId: string) {
        const resources = await prisma.resource.findMany({
            where: {
                classId: classId,
            },
        });
        return resources;
    }

    async getAllResources() {
        const resources = await prisma.resource.findMany();
        return resources;
    }

    async getResourceById(resourceId: string) {
        const resource = await prisma.resource.findUnique({
            where: {
                resourceId: resourceId,
            },
        });
        return resource;
    }

    async deleteResource(resourceId: string) {
        const deletedResource = await prisma.resource.delete({
            where: {
                resourceId: resourceId,
            },
        });
        return deletedResource;
    }

    async createResource(data : CreateResourceInput, attachmentUrl : string | null) {
        const createdResource = await prisma.resource.create({
            data: {
                ...data,
                attachmentUrl: attachmentUrl
            }
        });
        return createdResource;
    }

    async updateResource(resourceId: string, data : Partial<CreateResourceInput>, attachmentUrl : string | null) {
        const updatedResource = await prisma.resource.update({
            where:{
                resourceId: resourceId
            },
            data: {
                ...data,
                attachmentUrl: attachmentUrl
            }
        })
    }


}
