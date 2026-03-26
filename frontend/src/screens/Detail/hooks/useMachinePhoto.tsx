import { useCallback, useEffect, useState } from "react";
import { getData, saveData } from "../../../services/storage";

export function useMachinePhoto(machineId: string) {
    const [photo, setPhoto] = useState<string | undefined>();

    const updatePhoto = useCallback(
        async (uri: string) => {
            const data = await getData();
            if (data.machines[machineId]) {
                data.machines[machineId].photo = uri;
                await saveData(data);
                setPhoto(uri);
            }
        },
        [machineId],
    );

    const removePhoto = useCallback(async () => {
        const data = await getData();
        if (data.machines[machineId]) {
            delete data.machines[machineId].photo;
            await saveData(data);
            setPhoto(undefined);
        }
    }, [machineId]);

    useEffect(() => {
        getData().then((data) => setPhoto(data.machines[machineId]?.photo));
    }, [machineId]);

    return { photo, updatePhoto, removePhoto };
}
