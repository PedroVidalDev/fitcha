import { Input } from '@/src/components/Input'
import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TouchableOpacity } from 'react-native'
import { ProfileCard } from '../ProfileCard'
import { ProfileSectionHeading } from '../ProfileSectionHeading'
import { type ProfilePasswordSectionProps } from './types'

export function ProfilePasswordSection(props: ProfilePasswordSectionProps) {
    const { values, errors, isSubmitting, setField, onSave } = props
    const { t: theme } = useTheme()
    const { t } = useI18n()

    return (
        <ProfileCard>
            <ProfileSectionHeading
                title={t('profile.form.title')}
                description={t('profile.form.description')}
            />

            <Input
                label={t('profile.form.currentPasswordLabel')}
                icon='key-outline'
                value={values.currentPassword}
                onChangeText={(value) => setField('currentPassword', value)}
                placeholder={t('profile.form.currentPasswordPlaceholder')}
                secure
                error={errors.currentPassword}
            />

            <Input
                label={t('profile.form.newPasswordLabel')}
                icon='lock-closed-outline'
                value={values.newPassword}
                onChangeText={(value) => setField('newPassword', value)}
                placeholder={t('profile.form.newPasswordPlaceholder')}
                secure
                error={errors.newPassword}
            />

            <Input
                label={t('profile.form.confirmNewPasswordLabel')}
                icon='shield-checkmark-outline'
                value={values.confirmPassword}
                onChangeText={(value) => setField('confirmPassword', value)}
                placeholder={t('profile.form.confirmNewPasswordPlaceholder')}
                secure
                error={errors.confirmPassword}
            />

            <TouchableOpacity
                activeOpacity={0.8}
                disabled={isSubmitting}
                onPress={onSave}
                style={{
                    marginTop: 8,
                    opacity: isSubmitting ? 0.8 : 1,
                }}
            >
                <LinearGradient
                    colors={theme.gradientAccent}
                    style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: 'center',
                    }}
                >
                    <Text
                        style={{
                            color: theme.btnColor,
                            fontSize: 16,
                            fontWeight: '900',
                        }}
                    >
                        {isSubmitting
                            ? t('profile.form.saving')
                            : t('profile.form.save')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </ProfileCard>
    )
}
