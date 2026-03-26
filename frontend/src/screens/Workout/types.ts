import { RootStackParamList } from "@/src/router/types";
import { RouteProp } from "@react-navigation/native";

export type WorkoutResult = { machineId: string; sets: [number, number, number] };
export type Route = RouteProp<RootStackParamList, "Workout">;