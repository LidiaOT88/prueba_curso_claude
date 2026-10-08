import { InvalidTableStatusError } from '@errors/DomainErrors.js'

const VALID_TABLE_STATUSES = ['libre', 'ocupada', 'reservada'] as const

export type TableStatus = typeof VALID_TABLE_STATUSES[number]

export interface Table {
    id: string
    restaurantId: string
    number: number
    description: string
    capacity: number
    status: TableStatus
    createdAt: string
    updatedAt: string
}

export function normalizeTableStatus(value: string): TableStatus {
    const normalized = typeof value === 'string' ? value.toLowerCase().trim() : ''
    if (!VALID_TABLE_STATUSES.includes(normalized as TableStatus)) {
        throw new InvalidTableStatusError(`Invalid table status: ${value}. Must be one of: ${VALID_TABLE_STATUSES.join(', ')}`)
    }
    return normalized as TableStatus
}
