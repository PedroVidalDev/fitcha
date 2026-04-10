import { useCallback, useEffect, useState } from "react";
import {
    getCachedWorkoutData,
    loadWorkoutData,
    updateMachinePhoto,
} from "../../../services/workoutData";

export function useMachinePhoto(machineId: string) {
    const [photo, setPhoto] = useState<string | undefined>();

    const updatePhoto = useCallback(
        async (uri: string) => {
            const nextPhoto = await updateMachinePhoto(machineId, uri);
            setPhoto(nextPhoto);
        },
        [machineId],
    );

    const removePhoto = useCallback(async () => {
        const nextPhoto = await updateMachinePhoto(machineId);
        setPhoto(nextPhoto);
    }, [machineId]);

    useEffect(() => {
        const load = async () => {
            const cachedData = await getCachedWorkoutData();
            setPhoto(cachedData.machines[machineId]?.photo);

            const data = await loadWorkoutData();
            setPhoto(data.machines[machineId]?.photo);
        };

        void load();
    }, [machineId]);

    return { photo, updatePhoto, removePhoto };
}
