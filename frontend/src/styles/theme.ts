export type Mode = 'dark' | 'light'

export type ThemePalette = {
    mode: Mode
    bg: string
    btnColor: string
    card: string
    surface: string
    border: string
    accent: string
    accentDark: string
    textPrimary: string
    textMuted: string
    textDim: string
    overlay: string
    chipBg: string
    gradientScreen: [string, string, string]
    gradientCard: [string, string]
    gradientHero: [string, string]
    gradientAccent: [string, string]
    gradientModal: [string, string]
    headerBg: string
    inputBg: string
    histBg: string
    shadow: string
    home: {
        background: string[]
        border: string[]
        iconBg: string[]
        iconColor: string[]
        record: {
            cardBg: string
            cardBorder: string
            cardGlow: string
            sequence: string
            volume: string
        }
        chart: {
            latest: [string, string]
            palette: [string, string][]
        }
        danger: string
        buttonText: string
    }
}

export const dark: ThemePalette = {
    mode: 'dark',
    bg: '#0B1118',
    card: '#121A23',
    btnColor: '#25160A',
    surface: '#182331',
    border: 'rgba(116, 137, 170, 0.18)',
    accent: '#F38C2B',
    accentDark: '#D86A15',
    textPrimary: '#F6F2EB',
    textMuted: '#A7B1C2',
    textDim: '#768093',
    overlay: 'rgba(4, 8, 13, 0.8)',
    chipBg: 'rgba(243, 140, 43, 0.14)',
    gradientScreen: ['#24160C', '#112733', '#25173F'],
    gradientCard: ['#1A2230', '#19172A'],
    gradientHero: ['#43210F', '#163745'],
    gradientAccent: ['#FFC47D', '#F38C2B'],
    gradientModal: ['#1A2230', '#151A24'],
    headerBg: '#0E151D',
    inputBg: 'rgba(130, 150, 181, 0.11)',
    histBg: 'rgba(15, 22, 31, 0.88)',
    shadow: '#F38C2B',
    home: {
        background: [
            'rgba(243, 140, 43, 0.12)',
            'rgba(44, 186, 200, 0.12)',
            'rgba(155, 109, 255, 0.12)',
        ],
        border: [
            'rgba(243, 140, 43, 0.24)',
            'rgba(44, 186, 200, 0.22)',
            'rgba(155, 109, 255, 0.22)',
        ],
        iconBg: [
            'rgba(243, 140, 43, 0.18)',
            'rgba(44, 186, 200, 0.18)',
            'rgba(155, 109, 255, 0.18)',
        ],
        iconColor: ['#F38C2B', '#2CBAC8', '#9B6DFF'],
        record: {
            cardBg: 'rgba(243, 140, 43, 0.14)',
            cardBorder: 'rgba(255, 196, 125, 0.24)',
            cardGlow: 'rgba(243, 140, 43, 0.12)',
            sequence: '#FFF4E7',
            volume: '#FFC47D',
        },
        chart: {
            latest: ['#F38C2B', '#2CBAC8'],
            palette: [
                ['#FB923C', '#EA580C'],
                ['#4FD1C5', '#0EA5A6'],
                ['#A78BFA', '#7C3AED'],
            ],
        },
        danger: '#EF5350',
        buttonText: '#25160A',
    },
}

export const light: ThemePalette = {
    mode: 'light',
    bg: '#F3F6FA',
    card: '#FCFDFE',
    btnColor: '#FFF8F2',
    surface: '#E7EDF4',
    border: 'rgba(112, 133, 162, 0.18)',
    accent: '#D96E1E',
    accentDark: '#B75512',
    textPrimary: '#1D2530',
    textMuted: '#617084',
    textDim: '#8A96A7',
    overlay: 'rgba(10, 16, 22, 0.36)',
    chipBg: 'rgba(217, 110, 30, 0.12)',
    gradientScreen: ['#FFF3E5', '#EAF8F8', '#F2EDFF'],
    gradientCard: ['#FFFFFF', '#EDF2F7'],
    gradientHero: ['#FFF0E1', '#E5F7F6'],
    gradientAccent: ['#FFC07A', '#D96E1E'],
    gradientModal: ['#FFFFFF', '#EEF2F7'],
    headerBg: '#F7FAFC',
    inputBg: 'rgba(112, 133, 162, 0.08)',
    histBg: 'rgba(233, 239, 246, 0.86)',
    shadow: '#D96E1E',
    home: {
        background: ['#FFF3E7', '#EAF8F7', '#F3EEFF'],
        border: [
            'rgba(217, 110, 30, 0.18)',
            'rgba(44, 186, 200, 0.16)',
            'rgba(155, 109, 255, 0.16)',
        ],
        iconBg: ['#FFE3C8', '#DDF8F7', '#EEE6FF'],
        iconColor: ['#D96E1E', '#159EAC', '#8B5CF6'],
        record: {
            cardBg: '#FFF4E8',
            cardBorder: 'rgba(255, 192, 122, 0.24)',
            cardGlow: '#FFF0D9',
            sequence: '#332014',
            volume: '#B75512',
        },
        chart: {
            latest: ['#D96E1E', '#159EAC'],
            palette: [
                ['#FDBA74', '#EA580C'],
                ['#5EEAD4', '#0F766E'],
                ['#C4B5FD', '#7C3AED'],
            ],
        },
        danger: '#EF5350',
        buttonText: '#FFF',
    },
}
