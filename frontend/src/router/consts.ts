import { MainTabParamList } from './types'
import { type ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'

type TabIconName = ComponentProps<typeof Ionicons>['name']

export const TAB_ICONS: Record<
    keyof MainTabParamList,
    { active: TabIconName; inactive: TabIconName }
> = {
    Home: { active: 'home', inactive: 'home-outline' },
    Week: { active: 'barbell', inactive: 'barbell-outline' },
    CustomMachines: { active: 'fitness', inactive: 'fitness-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
}
