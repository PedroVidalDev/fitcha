import Constants from 'expo-constants'
import { axiosApp, ensureApiUrlConfigured } from './axios'

export type AppReleaseInfo = {
    latestVersion: string
    minimumVersion?: string
    releaseTag?: string
    releaseUrl: string
    releasedAt?: string
}

function normalizeVersion(version: string) {
    return version
        .trim()
        .replace(/^v/i, '')
        .split('.')
        .map((segment) => {
            const match = segment.match(/\d+/)
            return match ? Number(match[0]) : 0
        })
}

export function getInstalledAppVersion() {
    return (
        Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.0.0'
    )
}

export function isRemoteVersionNewer(
    remoteVersion: string,
    localVersion: string,
) {
    const remoteSegments = normalizeVersion(remoteVersion)
    const localSegments = normalizeVersion(localVersion)
    const maxLength = Math.max(remoteSegments.length, localSegments.length)

    for (let index = 0; index < maxLength; index += 1) {
        const remoteSegment = remoteSegments[index] ?? 0
        const localSegment = localSegments[index] ?? 0

        if (remoteSegment > localSegment) return true
        if (remoteSegment < localSegment) return false
    }

    return false
}

export async function fetchCurrentAppRelease() {
    ensureApiUrlConfigured()

    const response = await axiosApp.get<AppReleaseInfo | ''>('/app/release')

    if (
        response.status === 204 ||
        !response.data ||
        typeof response.data === 'string'
    ) {
        return null
    }

    if (!response.data.latestVersion || !response.data.releaseUrl) {
        return null
    }

    return response.data
}
