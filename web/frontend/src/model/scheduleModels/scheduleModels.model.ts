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
}
export type{
    ScheduleEvent
}