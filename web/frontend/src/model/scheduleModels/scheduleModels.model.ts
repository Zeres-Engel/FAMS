interface ScheduleEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    subject: string;
    classroomNumber?:string;
    classroomId?:number;
    subjectId?:number;
    teacher: string;
    classId?: string;
    scheduleDate?: Date;
    slotId?: string | number;
    academicYear?: string;
}
export type{
    ScheduleEvent
}