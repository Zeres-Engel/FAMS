import { Data, HeadCell } from "../../../model/tableModels/tableDataModels.model";

interface useTableHeaderHookProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
  headCellsData: HeadCell[];
}
function useTableHeaderHook(props: useTableHeaderHookProps) {
  const {onRequestSort,headCellsData} = props
    // const headCells: readonly HeadCell[] = [
    //     {
    //       id: 'name',
    //       numeric: false,
    //       disablePadding: true,
    //       label: 'Dessert (100g serving)',
    //     },
    //     {
    //       id: 'calories',
    //       numeric: true,
    //       disablePadding: false,
    //       label: 'Calories',
    //     },
    //     {
    //       id: 'fat',
    //       numeric: true,
    //       disablePadding: false,
    //       label: 'Fat (g)',
    //     },
    //     {
    //       id: 'carbs',
    //       numeric: true,
    //       disablePadding: false,
    //       label: 'Carbs (g)',
    //     },
    //     {
    //       id: 'protein',
    //       numeric: true,
    //       disablePadding: false,
    //       label: 'Protein (g)',
    //     },
    //   ];
        const createSortHandler =
          (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
            onRequestSort(event, property);
          };
    const state = {headCellsData};
    const handler = {createSortHandler};
    return { state, handler };
  }
  export default useTableHeaderHook;