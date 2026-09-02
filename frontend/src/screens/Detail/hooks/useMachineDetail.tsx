import { formatDateLabel } from '@/src/utils/formatDateLabel'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../../contexts/I18nContext'
import { HistoryEntry } from '../../../dtos/HistoryEntry'
import { Machine } from '../../../dtos/Machine'
import {
    getMachineHistoryRecord,
    HistoryApiEntry,
    TransferMachineHistoryInput,
} from '../../../services/history'
import {
    loadMachineHistoryData,
    deleteMachineHistoryData,
    transferMachineHistoryData,
} from '../../../services/machineHistoryData'
import {
    getCachedMachineData,
    loadMachineData,
    updateMachinePhotoData,
} from '../../../services/machineData'

const HISTORY_PAGE_LIMIT = 20

export function useMachineDetail(machineId: string) {
    const { locale, t } = useI18n()
    const [machine, setMachine] = useState<Machine | null>(null)
    const [rawHistory, setRawHistory] = useState<HistoryApiEntry[]>([])
    const [recentHistory, setRecentHistory] = useState<HistoryApiEntry[]>([])
    const [recordEntry, setRecordEntry] = useState<HistoryApiEntry | null>(null)
    const [historyPage, setHistoryPage] = useState(1)
    const [historyTotalPages, setHistoryTotalPages] = useState(0)
    const [isHistoryLoading, setIsHistoryLoading] = useState(true)
    const [historyError, setHistoryError] = useState('')
    const requestIdRef = useRef(0)

    const formatEntries = useCallback(
        (entries: HistoryApiEntry[]): HistoryEntry[] =>
            entries.map((entry) => ({
                id: entry.id,
                sets: entry.sets,
                date: entry.date,
                label: formatDateLabel(entry.date, locale, t),
            })),
        [locale, t],
    )

    const history = useMemo(
        () => formatEntries(rawHistory),
        [formatEntries, rawHistory],
    )
    const statsHistory = useMemo(() => {
        const entries = [...recentHistory]
        if (
            recordEntry &&
            !entries.some((entry) => entry.id === recordEntry.id)
        ) {
            entries.push(recordEntry)
        }
        return formatEntries(entries)
    }, [formatEntries, recentHistory, recordEntry])

    const loadRecord = useCallback(async () => {
        try {
            const entry = await getMachineHistoryRecord(machineId)
            setRecordEntry(entry)
        } catch {
            setRecordEntry(null)
        }
    }, [machineId])

    const loadHistoryPage = useCallback(
        async (page: number) => {
            const requestId = ++requestIdRef.current
            setIsHistoryLoading(true)
            setHistoryError('')

            try {
                const response = await loadMachineHistoryData(
                    machineId,
                    page,
                    HISTORY_PAGE_LIMIT,
                )
                if (requestId !== requestIdRef.current) return
                setRawHistory(response.items)
                if (page === 1) setRecentHistory(response.items)
                setHistoryPage(response.page)
                setHistoryTotalPages(response.totalPages)
            } catch (error) {
                if (requestId !== requestIdRef.current) return
                setHistoryError(
                    error instanceof Error
                        ? error.message
                        : t('services.history.loadError'),
                )
            } finally {
                if (requestId === requestIdRef.current) {
                    setIsHistoryLoading(false)
                }
            }
        },
        [machineId, t],
    )

    useEffect(() => {
        let active = true
        setMachine(null)
        setRawHistory([])
        setRecentHistory([])
        setRecordEntry(null)
        setHistoryPage(1)
        setHistoryTotalPages(0)

        void (async () => {
            const cachedMachine = await getCachedMachineData(machineId)
            if (active && cachedMachine) setMachine(cachedMachine)

            try {
                const [loadedMachine] = await Promise.all([
                    loadMachineData(machineId),
                    loadHistoryPage(1),
                    loadRecord(),
                ])
                if (active) setMachine(loadedMachine)
            } catch {
                // The cached machine remains visible when the refresh fails.
            }
        })()

        return () => {
            active = false
            requestIdRef.current += 1
        }
    }, [loadHistoryPage, loadRecord, machineId])

    const updatePhoto = useCallback(
        async (uri: string) => {
            const updatedMachine = await updateMachinePhotoData(machineId, uri)
            setMachine(updatedMachine)
        },
        [machineId],
    )

    const removePhoto = useCallback(async () => {
        const updatedMachine = await updateMachinePhotoData(machineId)
        setMachine(updatedMachine)
    }, [machineId])

    const deleteHistoryEntry = useCallback(
        async (historyId: string) => {
            await deleteMachineHistoryData(historyId)
            const targetPage =
                rawHistory.length === 1 && historyPage > 1
                    ? historyPage - 1
                    : historyPage
            await Promise.all([loadHistoryPage(targetPage), loadRecord()])
        },
        [historyPage, loadHistoryPage, loadRecord, rawHistory.length],
    )

    const transferHistory = useCallback(
        async (input: TransferMachineHistoryInput) => {
            const response = await transferMachineHistoryData(machineId, input)
            setRawHistory([])
            setRecentHistory([])
            setRecordEntry(null)
            setHistoryPage(1)
            setHistoryTotalPages(0)
            return response
        },
        [machineId],
    )

    return {
        machine,
        history,
        statsHistory,
        historyPage,
        historyTotalPages,
        isHistoryLoading,
        historyError,
        changeHistoryPage: loadHistoryPage,
        updatePhoto,
        removePhoto,
        deleteHistoryEntry,
        transferHistory,
    }
}
