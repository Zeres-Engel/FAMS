type Order = 'asc' | 'desc';
interface Data {
    id: number;
    avatar: string;
    creationAt: string;
    email: string;
    name: string;
    role: string;
    updatedAt: string;
  };
  interface HeadCell {
    disablePadding: boolean;
    id: keyof Data;
    label: string;
    numeric: boolean;
  }
export type{
    Order,Data,HeadCell
}