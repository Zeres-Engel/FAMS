interface UserData {
  id: string;
  username: string;
  email: string;
  backup_email: string;
  name: string;
  role: string;
  updatedAt: string;
  createdAt: string;
  details?: UserDataDetails;
  phoneSub?: string;
  classSubId?: number;
  gradeSub?:string;
}
interface UserDataDetails {
        studentId: string;
        firstName: string;
        lastName: string;
        fullName: string;
        phone: string;
        dateOfBirth: string;
        address: string;
        classId: number;
        batchId: number;
        className: string;
        grade: string;
}
interface SearchFilters {
    search?: string;
    grade?: string;
    roles?: string[];
    className?: string;
    limit?: number;
    phone?: string;
  }
export type { UserData,SearchFilters };
