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
    slotNumber?: number;
    academicYear?: string;
    semesterId?: number;
    semesterNumber?: number;
    customStartTime?: string;
    customEndTime?: string;
    className?: string;
    grade?: number;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    // Attendance-related fields
    attendanceStatus?: string;
    attendanceId?: number;
    checkIn?: string | null;
    note?: string;
}
export type{
    ScheduleEvent
}