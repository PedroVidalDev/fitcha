import { Image, type ImageProps } from 'expo-image'

type MachineImageProps = Omit<ImageProps, 'cachePolicy' | 'source'> & {
    uri: string
    cacheKey?: string
}

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
