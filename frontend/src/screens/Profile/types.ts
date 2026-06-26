import {
    type AuthenticatedUser,
    type ChangePasswordInput,
} from '@/src/@types/auth'
import { RootStackParamList } from '@/src/router/types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

export type ProfileScreenProps = NativeStackScreenProps<
    RootStackParamList,
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
