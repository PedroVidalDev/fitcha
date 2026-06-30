import { Text } from 'react-native'
import { type CreditPurchaseErrorMessageProps } from './types'

export function CreditPurchaseErrorMessage(
    props: CreditPurchaseErrorMessageProps,
) {
    const { message } = props

    return (
        <Text
            style={{
                color: '#EF5350',
                fontSize: 13,
                fontWeight: '700',
                marginTop: 16,
                lineHeight: 19,
            }}
        >
            {message}
        </Text>
    )
}
