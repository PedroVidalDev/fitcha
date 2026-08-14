import { Image } from 'expo-image'
import { MachineImageProps } from './types'

export function MachineImage(props: MachineImageProps) {
    const {
        uri,
        cacheKey = uri,
        contentFit = 'cover',
        transition = 140,
        ...imageProps
    } = props

    return (
        <Image
            {...imageProps}
            source={{ uri, cacheKey }}
            cachePolicy='memory-disk'
            contentFit={contentFit}
            transition={transition}
        />
    )
}
