import { ClassData } from "../../../model/classModels/classModels.model";
import {
  AttendanceHeadCell,
  AttendanceLog,
  ClassArrangementData,
  ClassArrangementHeadCellProps,
  ClassHeadCell,
  ClassStudent,
  ClassStudentHeadCell,
  Data,
  HeadCell,
  NotifyHeadCell,
  NotifyProps,
  RFIDData,
  RFIDHeadCell,
  UserHeadCell,
} from "../../../model/tableModels/tableDataModels.model";
import { UserData } from "../../../model/userModels/userDataModels.model";

interface useTableHeaderHookProps {
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property:
      | keyof Data
      | keyof UserData
      | keyof ClassData
      | keyof AttendanceLog
      | keyof ClassArrangementData
      | keyof NotifyProps 
      | keyof RFIDData
      | keyof ClassStudent
  ) => void;
  headCellsData:
    | HeadCell[]
    | UserHeadCell[]
    | ClassHeadCell[]
    | AttendanceHeadCell[]
    | ClassArrangementHeadCellProps[]
    | NotifyHeadCell[]
    | RFIDHeadCell[]
    | ClassStudentHeadCell[];
}
function useTableHeaderHook(props: useTableHeaderHookProps) {
  const { onRequestSort, headCellsData } = props;
  const createSortHandler =
    (
      property:
        | keyof Data
        | keyof UserData
        | keyof ClassData
        | keyof AttendanceLog
        | keyof ClassArrangementData
        | keyof NotifyProps
        | keyof RFIDData
        | keyof ClassStudent
    ) =>
    (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };
  const state = { headCellsData };
  const handler = { createSortHandler };
  return { state, handler };
}
export default useTableHeaderHook;
