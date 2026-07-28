import { assignmentRepository } from "../repositories/assignments.repository.js";
import { EnrollmentsRepository } from "../repositories/enrollments.repository.js";
import { resourcesRepository } from "../repositories/resources.repository.js";

const resourceRepo  = new resourcesRepository();
const enrollmentRepo = new EnrollmentsRepository();
const assignmentRepo  = new assignmentRepository();


export const handleAssignmentCreatedEvent = async (event : any) =>{
    
    const { assignmentId, classId } = event;

    // fetch the assignment details using the assignmentId
    const existingAssignment = await assignmentRepo.getAssignmentById(assignmentId);

    // fetch all the students enrolled in the class
    const students = await enrollmentRepo.getStudentsByClassId(classId);

    // send notification to each student
    for(const enrollment of students){
        const studentId = enrollment.studentId;
        // Here you would implement the logic to send a notification to the student.
        // This could be an email, push notification, etc.
        console.log(`Sending notification to student ${studentId} about new assignment ${assignmentId}`);
    }

}

export const handleResourceUploadedEvent = async (event : any) => {
    
    const { resourceId, classId } = event;

    // fetch the resource details using the resourceId
    const existingResource = await resourceRepo.getResourceById(resourceId);

    // fetch all the students enrolled in the class
    const students = await enrollmentRepo.getStudentsByClassId(classId);

    // send notification to each student
    for(const enrollment of students){
        const studentId = enrollment.studentId;
        // Here you would implement the logic to send a notification to the student.
        // This could be an email, push notification, etc.
        console.log(`Sending notification to student ${studentId} about new resource ${resourceId}`);
    }

}

export const handleClassroomCreatedEvent = async (event : any) => {
    const { classId } = event;

    console.log(`Classroom created with ID: ${classId}`);

    // fetch all the students enrolled in the class
    const students = await enrollmentRepo.getStudentsByClassId(classId);

    // send notification to each student
    for(const enrollment of students){
        const studentId = enrollment.studentId;
        // Here you would implement the logic to send a notification to the student.
        // This could be an email, push notification, etc.
        console.log(`Sending notification to student ${studentId} about new class ${classId}`);
    }
    

}
