import { useI18n } from '@/src/contexts/I18nContext'
import { useTheme } from '@/src/contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import { PaginationControlsProps } from './types'

export function PaginationControls(props: PaginationControlsProps) {
    const { page, totalPages, disabled = false, onChangePage } = props
    const { t } = useTheme()
    const { t: translate } = useI18n()

    if (totalPages <= 1) return null

    const hasPrevious = page > 1
    const hasNext = page < totalPages

    const renderButton = (
        direction: 'previous' | 'next',
        enabled: boolean,
        targetPage: number,
    ) => (
        <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel={translate(
                direction === 'previous'
                    ? 'common.pagination.previous'
                    : 'common.pagination.next',
            )}
            disabled={disabled || !enabled}
            onPress={() => onChangePage(targetPage)}
            style={{
                minWidth: 42,
                height: 38,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.chipBg,
                borderWidth: 1,
                borderColor: t.border,
                opacity: disabled || !enabled ? 0.4 : 1,
            }}
        >
            <Ionicons
                name={
                    direction === 'previous'
                        ? 'chevron-back-outline'
                        : 'chevron-forward-outline'
                }
                size={19}
                color={t.accent}
            />
        </TouchableOpacity>
    )

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                marginTop: 16,
            }}
        >
            {renderButton('previous', hasPrevious, page - 1)}
            <Text
                style={{
                    color: t.textMuted,
                    fontSize: 12,
                    fontWeight: '800',
                    minWidth: 92,
                    textAlign: 'center',
                }}
            >
                {translate('common.pagination.summary', {
                    page,
                    totalPages,
                })}
            </Text>
            {renderButton('next', hasNext, page + 1)}
        </View>
    )
}
