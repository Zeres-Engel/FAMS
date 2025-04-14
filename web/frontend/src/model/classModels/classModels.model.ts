// class.model.ts

interface ClassData {
  _id: string;
  className: string;
  grade: string;
  homeroomTeacherd: string;
  createdAt: string;
  updatedAt: string;
  // Thêm các field khác nếu API trả về thêm
}

interface SearchClassFilters {
  search?: string;
  grade?: string;
  homeroomTeacherd?: string;
}

export type { SearchClassFilters, ClassData };
