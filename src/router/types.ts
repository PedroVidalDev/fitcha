export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Categories: undefined;
  Machines: { categoryId: string; categoryName: string };
  Detail: { categoryId: string; machineId: string; machineName: string };
};