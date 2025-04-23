// class.model.ts

interface ClassData {
  _id: string;
  id?:string;
  className: string;
  grade: string;
  homeroomTeacherd: string;
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
  homeroomTeacherd?: string;
  academicYear?: string;
}

export type { SearchClassFilters, ClassData };
