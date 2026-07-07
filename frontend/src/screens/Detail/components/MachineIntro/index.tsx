import { CategoryBadge } from '@/src/components/CategoryBadge'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Text, View } from 'react-native'
import { MachineIntroProps } from './types'

export function MachineIntro(props: MachineIntroProps) {
    const { machine } = props
    const { t } = useTheme()

    return (
        <>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                }}
            >
                <CategoryBadge categoryKey={machine.categoryKey} />
            </View>
            {machine.description && (
                <Text
                    style={{
                        color: t.textMuted,
                        fontSize: 14,
                        lineHeight: 20,
                        marginBottom: 16,
                    }}
                >
                    {machine.description}
                </Text>
            )}
        </>
    )
}
