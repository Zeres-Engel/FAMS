// class.model.ts

interface ClassData {
  _id: string;
  id?:string;
  className: string;
  grade: string;
  homeroomTeacherd: string;
  homeroomTeacherId?: string;
  createdAt: string;
  updatedAt: string;
  academicYear?: string;
  role?: string;
  classId?:number;
  batchId?:number;
  name?:string;
  studentNumber?:string;
  // Thêm các field khác nếu API trả về thêm
}

interface SearchClassFilters {
  search?: string;
  grade?: string;
  homeroomTeacherId?: string;
  academicYear?: string;
  preserveAcademicYears?: boolean;
}

export type { SearchClassFilters, ClassData };
