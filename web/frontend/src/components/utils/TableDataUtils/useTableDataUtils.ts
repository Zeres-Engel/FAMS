import { Order } from "../../../model/tableModels/tableDataModels.model";

export default function getComparator<T extends { [key: string]: any }>(
  order: Order,
  orderBy: keyof T | string // dùng string để tránh lỗi strict
): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T | string): number {
  if (b[orderBy as keyof T] < a[orderBy as keyof T]) {
    return -1;
  }
  if (b[orderBy as keyof T] > a[orderBy as keyof T]) {
    return 1;
  }
  return 0;
}
