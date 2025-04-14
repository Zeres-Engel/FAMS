interface ScheduleEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    subject: string;
    classroomNumber?:string;
    teacher: string;
}
export type{
    ScheduleEvent
}