import { randomUUID } from 'crypto'
import type { Table } from '@models/table.model.js'
import { normalizeTableStatus } from '@models/table.model.js'
import type { TableRepository } from '@repositories/table.repository.js'
import {
    TableNotFoundError,
    InvalidTableCapacityError,
    InvalidTableNumberError,
    DuplicatedTableNumberError,
    TableNotAvailableError,
    TableOccupiedError,
    InvalidPeopleCountError
} from '@errors/DomainErrors.js'

export interface TableInput {
    number: number
    description: string
    capacity: number
}

export class TableService {
    constructor(private readonly tableRepository: TableRepository) {}

    async create(restaurantId: string, input: TableInput): Promise<Table> {
        this.validate(input)
        await this.ensureNumberIsFree(restaurantId, input.number, null)

        const now = new Date().toISOString()
        const table: Table = {
            id: randomUUID(),
            restaurantId,
            number: input.number,
            description: input.description ?? '',
            capacity: input.capacity,
            status: 'libre',
            createdAt: now,
            updatedAt: now
        }
        await this.tableRepository.save(table)
        return table
    }

    async update(restaurantId: string, id: string, input: TableInput): Promise<Table> {
        const existing = await this.getById(restaurantId, id)
        this.validate(input)
        await this.ensureNumberIsFree(restaurantId, input.number, id)

        const updated: Table = {
            ...existing,
            number: input.number,
            description: input.description ?? '',
            capacity: input.capacity,
            updatedAt: new Date().toISOString()
        }
        await this.tableRepository.save(updated)
        return updated
    }

    async getById(restaurantId: string, id: string): Promise<Table> {
        const table = await this.tableRepository.findById(id)
        if (!table || table.restaurantId !== restaurantId) {
            throw new TableNotFoundError()
        }
        return table
    }

    async getByRestaurant(restaurantId: string): Promise<Table[]> {
        return this.tableRepository.findByRestaurant(restaurantId)
    }

    async delete(restaurantId: string, id: string): Promise<void> {
        const table = await this.getById(restaurantId, id)
        if (table.status === 'ocupada') {
            throw new TableOccupiedError()
        }
        await this.tableRepository.delete(id)
    }

    async changeStatus(restaurantId: string, id: string, status: string): Promise<Table> {
        const table = await this.getById(restaurantId, id)
        const updated: Table = {
            ...table,
            status: normalizeTableStatus(status),
            updatedAt: new Date().toISOString()
        }
        await this.tableRepository.save(updated)
        return updated
    }

    async listAvailable(restaurantId: string, people: number): Promise<Table[]> {
        if (!Number.isInteger(people) || people < 1) {
            throw new InvalidPeopleCountError()
        }
        return this.tableRepository.findAvailable(restaurantId, people)
    }

    async occupy(restaurantId: string, id: string): Promise<Table> {
        await this.getById(restaurantId, id)
        const occupied = await this.tableRepository.occupyIfFree(id)
        if (!occupied) {
            throw new TableNotAvailableError()
        }
        return this.getById(restaurantId, id)
    }

    private validate(input: TableInput): void {
        if (!Number.isInteger(input.number) || input.number < 1) {
            throw new InvalidTableNumberError()
        }
        if (!Number.isInteger(input.capacity) || input.capacity < 1) {
            throw new InvalidTableCapacityError()
        }
    }

    private async ensureNumberIsFree(restaurantId: string, number: number, ownId: string | null): Promise<void> {
        const other = await this.tableRepository.findByNumber(restaurantId, number)
        if (other && other.id !== ownId) {
            throw new DuplicatedTableNumberError()
        }
    }
}
