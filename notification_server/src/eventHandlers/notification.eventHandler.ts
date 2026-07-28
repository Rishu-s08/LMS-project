import { logger } from "../shared/logger.js";
import { assignmentRepository } from "../repositories/assignments.repository.js";
import { EnrollmentsRepository } from "../repositories/enrollments.repository.js";
import { resourcesRepository } from "../repositories/resources.repository.js";

const resourceRepo = new resourcesRepository();
const enrollmentRepo = new EnrollmentsRepository();
const assignmentRepo = new assignmentRepository();


export const handleAssignmentCreatedEvent = async (event: any) => {
    const { assignmentId, classId } = event;

    const existingAssignment = await assignmentRepo.getAssignmentById(assignmentId);
    const students = await enrollmentRepo.getStudentsByClassId(classId);

    for (const enrollment of students) {
        // TODO: send FCM / email
        logger.info({ studentId: enrollment.studentId, assignmentId }, "Notify student: new assignment");
    }

    logger.info({ assignmentId, classId, studentCount: students.length }, "Assignment notifications dispatched");
}

export const handleResourceUploadedEvent = async (event: any) => {
    const { resourceId, classId } = event;

    const existingResource = await resourceRepo.getResourceById(resourceId);
    const students = await enrollmentRepo.getStudentsByClassId(classId);

    for (const enrollment of students) {
        // TODO: send FCM / email
        logger.info({ studentId: enrollment.studentId, resourceId }, "Notify student: new resource");
    }

    logger.info({ resourceId, classId, studentCount: students.length }, "Resource notifications dispatched");
}

export const handleClassroomCreatedEvent = async (event: any) => {
    const { classId } = event;

    const students = await enrollmentRepo.getStudentsByClassId(classId);

    for (const enrollment of students) {
        // TODO: send FCM / email
        logger.info({ studentId: enrollment.studentId, classId }, "Notify student: new class");
    }

    logger.info({ classId, studentCount: students.length }, "Classroom notifications dispatched");
}
