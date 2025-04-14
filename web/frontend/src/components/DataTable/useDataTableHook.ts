import React, { useEffect, useState } from "react";
import {
  AddUserForm,
  Data,
  editClassForm,
  Order,
} from "../../model/tableModels/tableDataModels.model";
import getComparator from "../utils/TableDataUtils/useTableDataUtils";
import { UserData } from "../../model/userModels/userDataModels.model";

interface UseDataTableHookProps {
  tableMainData: Data[] | UserData[];
}
function useDataTableHook(props: UseDataTableHookProps) {
  const { tableMainData } = props;
  const editClassDefaul: editClassForm = {
    className: "",
    teacherId: "",
    batch: "",
  };
  const editUserDefault: AddUserForm = {
    fullName: "",
    dob: "",
    gender: "",
    address: "",
    phone: "",
    parentNames: "",
    careers: "",
    parentPhones: "",
    parentGenders: "",
    major: "",
    weeklyCapacity: "",
    role: "",
  };
  const rows = React.useMemo(() => [...tableMainData], [tableMainData]);
  const [isCreateUser, setIsCreateUser] = useState<boolean>(false);
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof Data | keyof UserData>("id");
  const [selected, setSelected] = React.useState<readonly number[]>([]);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingUser, setEditingUser] =
    React.useState<AddUserForm>(editUserDefault);
  const [editingClass, setEditingClass] =
    React.useState<editClassForm>(editClassDefaul);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<Data | UserData | null>(
    null
  );
  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data | keyof UserData
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };
  const handleEditClick = (user: AddUserForm) => {
    setEditingUser(user);
    setIsEditOpen(true);
  };
  const handleEditClassClick = (classData: editClassForm) => {
    setEditingClass(classData);
    setIsEditOpen(true);
  };
  const handleDeleteClick = (user: Data | UserData) => {
    setSelectedUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUserToDelete) {
      console.log("Deleting user:", selectedUserToDelete.id);
      // Gọi API xóa nếu muốn
    }
    setIsDeleteDialogOpen(false);
    setSelectedUserToDelete(null);
  };
  const handleEditSave = (userFormData: AddUserForm) => {
    console.log("Saving edited user:", userFormData);
    setIsEditOpen(false);
  };
  const handleEditClassSave = (classFormData: editClassForm) => {
    console.log("Saving edited class:", classFormData);
    setIsEditOpen(false);
  };
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    // if (event.target.checked) {
    //   const newSelected = rows.map(n => n.id);
    //   setSelected(newSelected);
    //   return;
    // }
    // setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      [...rows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, rows]
  );
  const state = {
    emptyRows,
    visibleRows,
    selected,
    order,
    orderBy,
    rows,
    rowsPerPage,
    page,
    isCreateUser,
    isEditOpen,
    editingUser,
    isDeleteDialogOpen,
    selectedUserToDelete,
    editingClass,
  };
  const handler = {
    handleRequestSort,
    handleSelectAllClick,
    handleClick,
    handleChangeRowsPerPage,
    handleChangePage,
    setIsCreateUser,
    handleEditClick,
    setIsEditOpen,
    handleEditSave,
    setIsDeleteDialogOpen,
    handleConfirmDelete,
    handleDeleteClick,
    handleEditClassSave,
    handleEditClassClick,
  };

  return { state, handler };
}
export default useDataTableHook;
