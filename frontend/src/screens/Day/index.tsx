import { AddMachineModal } from '@/src/components/AddMachineModal'
import { WorkoutFormModal } from '@/src/components/WorkoutFormModal'
import { View } from 'react-native'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import { DayActionButtons } from './components/DayActionButtons'
import { DayDeleteMachineModal } from './components/DayDeleteMachineModal'
import { DayDeleteWorkoutModal } from './components/DayDeleteWorkoutModal'
import { DayHeroCard } from './components/DayHeroCard'
import { DayLoadingState } from './components/DayLoadingState'
import { DayMachineList } from './components/DayMachineList'
import { DayNotFoundState } from './components/DayNotFoundState'
import { DayStartWorkoutButton } from './components/DayStartWorkoutButton'
import { type DayScreenProps } from './types'
import { useDayScreen } from './useDayScreen'

export default function DayScreen(props: DayScreenProps) {
    const {
        navigation,
        route: {
            params: { workoutId },
        },
    } = props

    const { t } = useTheme()
    const { t: translate } = useI18n()
    const {
        workout,
        machines,
        isLoading,
        deleteTarget,
        isAddModalVisible,
        isEditModalVisible,
        isDeleteWorkoutVisible,
        handleOpenAddModal,
        handleCloseAddModal,
        handleOpenEditModal,
        handleCloseEditModal,
        handleOpenDeleteWorkoutModal,
        handleCloseDeleteWorkoutModal,
        handleCloseDeleteMachineModal,
        handlePressMachine,
        handleLongPressMachine,
        handleStartWorkout,
        handleEditWorkout,
        handleAddMachine,
        handleConfirmDeleteMachine,
        handleConfirmDeleteWorkout,
    } = useDayScreen({
        navigation,
        workoutId,
    })

    if (isLoading) {
        return <DayLoadingState />
    }

    if (!workout) {
        return <DayNotFoundState />
    }

    return (
        <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
            <DayHeroCard workout={workout} totalMachines={machines.length} />

            <DayActionButtons
                onAddMachine={handleOpenAddModal}
                onEditWorkout={handleOpenEditModal}
                onDeleteWorkout={handleOpenDeleteWorkoutModal}
            />

            <DayMachineList
                machines={machines}
                onPressMachine={handlePressMachine}
                onLongPressMachine={handleLongPressMachine}
            />

            {machines.length > 0 && (
                <DayStartWorkoutButton onPress={handleStartWorkout} />
            )}

            <WorkoutFormModal
                visible={isEditModalVisible}
                title={translate('workoutForm.editTitle')}
                initialName={workout.title}
                initialDescription={workout.description}
                submitLabel={translate('workoutForm.saveAction')}
                onClose={handleCloseEditModal}
                onSubmit={handleEditWorkout}
            />

            <AddMachineModal
                visible={isAddModalVisible}
                onClose={handleCloseAddModal}
                onAdd={handleAddMachine}
                excludedMachineIds={machines
                    .map((machine) => machine.catalogMachineId)
                    .filter((id): id is string => !!id)}
                excludedUserMachineIds={machines
                    .filter((machine) => !machine.catalogMachineId)
                    .map((machine) => machine.id)}
            />

            <DayDeleteMachineModal
                target={deleteTarget}
                onClose={handleCloseDeleteMachineModal}
                onConfirm={() => void handleConfirmDeleteMachine()}
            />

            <DayDeleteWorkoutModal
                visible={isDeleteWorkoutVisible}
                workoutTitle={workout.title}
                onClose={handleCloseDeleteWorkoutModal}
                onConfirm={() => void handleConfirmDeleteWorkout()}
            />
        </View>
    )
}
