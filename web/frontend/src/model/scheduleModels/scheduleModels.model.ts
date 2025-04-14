interface ScheduleEvent {
    id: number,
    title: string,
    start: Date,
    end: Date,
    resource?: any // To store the original schedule data
}
export type{
    ScheduleEvent
}