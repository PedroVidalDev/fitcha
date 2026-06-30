import { useI18n } from '@/src/contexts/I18nContext'
import { View } from 'react-native'
import { ProfileAccountInfoField } from '../ProfileAccountInfoField'
import { ProfileCard } from '../ProfileCard'
import { ProfileSectionHeading } from '../ProfileSectionHeading'
import { type ProfileAccountSectionProps } from './types'

export function ProfileAccountSection(props: ProfileAccountSectionProps) {
    const { name, email } = props
    const { t } = useI18n()

    return (
        <ProfileCard>
            <ProfileSectionHeading
                title={t('profile.account.title')}
                description={t('profile.account.description')}
            />

            <View style={{ gap: 10 }}>
                <ProfileAccountInfoField
                    label={t('auth.register.nameLabel')}
                    value={name}
                />
                <ProfileAccountInfoField
                    label={t('auth.register.emailLabel')}
                    value={email}
                />
            </View>
        </ProfileCard>
    )
}
