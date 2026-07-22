import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ResourcesService } from "./resources.service.js";



export class ResourcesController{
    private readonly resourcesService: ResourcesService;

    constructor() {
        this.resourcesService = new ResourcesService();
    }


    getAllResources = asyncHandler(async (req, res)=>{
        const resources = await this.resourcesService.getAllResources();
        res.status(200).json({
            success: true,
            message: "Resources fetched successfully",
            data: resources
        });
    })

    getResourcesByClassId = asyncHandler(async (req, res) => {
        const { classId } = req.params;
        const resources = await this.resourcesService.getResourcesByClassId(classId as string);
        res.status(200).json({
            success: true,
            message: "Resources fetched successfully",
            data: resources
        });
    })

    getResourceById = asyncHandler(async (req, res) => {
        const { resourceId } = req.params;
        const resource = await this.resourcesService.getResourceById(resourceId as string);
        res.status(200).json({
            success: true,
            message: "Resource fetched successfully",
            data: resource
        });
    })

    createResource = asyncHandler(async (req, res) => {
        const data = req.body;
        const file = req.file ? req.file : null;
        console.log("Received file in request:", file);
        const newResource = await this.resourcesService.createResource(data, file);
        res.status(201).json({
            success: true,
            message: "Resource created successfully",
            data: newResource
        });
    })

    deleteResource = asyncHandler(async (req, res) => {
        const { resourceId } = req.params;
        await this.resourcesService.deleteResource(resourceId as string);
        res.status(200).json({
            success: true,
            message: "Resource deleted successfully"
        });
    })
    
    updateResource = asyncHandler(async (req, res) => {
        const { resourceId } = req.params;
        const data = req.body;
        const file = req.file ? req.file : null;
        const updatedResource = await this.resourcesService.updateResource(resourceId as string, data, file);
        res.status(200).json({
            success: true,
            message: "Resource updated successfully",
            data: updatedResource
        });
    })
}

