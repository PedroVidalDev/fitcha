import { type ImageProps } from 'expo-image'

export type MachineImageProps = Omit<ImageProps, 'cachePolicy' | 'source'> & {
    uri: string
    cacheKey?: string
}
