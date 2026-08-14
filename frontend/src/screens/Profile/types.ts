import {
    type AuthenticatedUser,
    type ChangePasswordInput,
} from '@/src/@types/auth'
import { MainTabParamList } from '@/src/router/types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

export type ProfileScreenProps = BottomTabScreenProps<
    MainTabParamList,
    'Profile'
>

export type ProfileFormValues = {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export type UseProfileFormParams = {
    user: AuthenticatedUser | null
    onSubmitPasswordChange: (input: ChangePasswordInput) => Promise<void>
}

export type UseProfileFormResult = {
    values: ProfileFormValues
    errors: Record<string, string>
    isSubmitting: boolean
    setField: (field: keyof ProfileFormValues, value: string) => void
    handleSubmit: () => Promise<boolean>
}
