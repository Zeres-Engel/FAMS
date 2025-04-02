interface ScheduleEvent {
    id: number,
    title: string,
    start: Date,
    end: Date,
    resource?: {
        classroom?: {
            name?: string;
        };
        teacher?: {
            name?: string;
        };
    };
}

export type {
    ScheduleEvent
}