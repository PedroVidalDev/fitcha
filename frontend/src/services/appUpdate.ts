import * as Updates from 'expo-updates'
import {
    AppReleaseInfo,
    fetchCurrentAppRelease,
    getInstalledAppVersion,
    isRemoteVersionNewer,
} from './appRelease'

export type AvailableAppUpdate =
    | {
          kind: 'ota'
      }
    | {
          kind: 'native'
          release: AppReleaseInfo
          required: boolean
      }

export async function resolveAvailableAppUpdate(): Promise<AvailableAppUpdate | null> {
    const currentVersion = getInstalledAppVersion()

    const [release, hasOtaUpdate] = await Promise.all([
        fetchCurrentAppRelease().catch(() => null),
        checkForOtaUpdateAvailability().catch(() => false),
    ])

    const isNativeUpdateRequired =
        !!release?.minimumVersion &&
        isRemoteVersionNewer(release.minimumVersion, currentVersion)

    if (release && isNativeUpdateRequired) {
        return {
            kind: 'native',
            release,
            required: true,
        }
    }

    if (hasOtaUpdate) {
        return { kind: 'ota' }
    }

    const isNativeUpdateAvailable =
        !!release && isRemoteVersionNewer(release.latestVersion, currentVersion)

    if (release && isNativeUpdateAvailable) {
        return {
            kind: 'native',
            release,
            required: false,
        }
    }

    return null
}

export async function applyOtaUpdate() {
    if (__DEV__ || !Updates.isEnabled) {
        return false
    }

    const update = await Updates.checkForUpdateAsync()
    if (!update.isAvailable) {
        return false
    }

    await Updates.fetchUpdateAsync()
    await Updates.reloadAsync()

    return true
}

async function checkForOtaUpdateAvailability() {
    if (__DEV__ || !Updates.isEnabled) {
        return false
    }

    const update = await Updates.checkForUpdateAsync()
    return update.isAvailable
}
