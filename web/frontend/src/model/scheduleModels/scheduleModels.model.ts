interface ScheduleEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    subject: string;
    classroomNumber?:string;
    classroomId?:string;
    subjectId?:string;
    teacher: string;
}
export type{
    ScheduleEvent
}