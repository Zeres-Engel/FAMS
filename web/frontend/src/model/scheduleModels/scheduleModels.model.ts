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
    teacherId?: number;
    classId?: string;
    scheduleDate?: Date;
    slotId?: string | number;
    academicYear?: string;
    semesterId?: number;
    semesterNumber?: number;
    customStartTime?: string;
    customEndTime?: string;
    className?:string;
}
export type{
    ScheduleEvent
}