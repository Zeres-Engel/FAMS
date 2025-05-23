import { ClassArrangementData } from "../../model/tableModels/tableDataModels.model";

const firstNames = ['An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Khoa', 'Lan', 'Minh', 'Ngọc', 'Phúc'];
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Phan', 'Đặng'];
const classNames = ['A1', 'B2', 'C3', 'D4'];
const grades = ['10', '11', '12'];

const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const generateId = () => Math.random().toString(36).substring(2, 10);

const generatePhone = () => '09' + Math.floor(10000000 + Math.random() * 90000000).toString();

const generateAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

export const generateFakeClassArrangementData = (count: number): ClassArrangementData[] => {
  return Array.from({ length: count }, () => {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const fullName = `${lastName} ${firstName}`;
    const username = `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
    const email = `${username}@example.com`;

    return {
      id: generateId(),
      username,
      className: randomItem(classNames),
      grade: randomItem(grades),
      avatar: generateAvatar(fullName),
      email,
      phone: generatePhone(),
      name: fullName,
      action: 'Edit',
    };
  });
};