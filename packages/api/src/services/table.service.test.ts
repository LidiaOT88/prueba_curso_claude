import { describe, it, expect, beforeEach } from 'vitest'
import { TableService } from './table.service.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'

describe('TableService', () => {
    let repo: MockTableRepository
    let service: TableService

    const validInput = { number: 1, description: 'Window', capacity: 4 }

    beforeEach(() => {
        repo = new MockTableRepository()
        service = new TableService(repo)
    })

    describe('create', () => {
        it('should create a free table', async () => {
            const table = await service.create('r1', validInput)
            expect(table.id).toBeTruthy()
            expect(table.restaurantId).toBe('r1')
            expect(table.status).toBe('libre')
            expect(await repo.findById(table.id)).toEqual(table)
        })

        it('should reject invalid capacity', async () => {
            await expect(service.create('r1', { ...validInput, capacity: 0 })).rejects.toThrow('capacity')
            await expect(service.create('r1', { ...validInput, capacity: 2.5 })).rejects.toThrow('capacity')
        })

        it('should reject invalid number', async () => {
            await expect(service.create('r1', { ...validInput, number: 0 })).rejects.toThrow('number must be')
        })

        it('should reject duplicated number in the same restaurant', async () => {
            await service.create('r1', validInput)
            await expect(service.create('r1', validInput)).rejects.toThrow('already exists')
        })

        it('should allow same number in another restaurant', async () => {
            await service.create('r1', validInput)
            await expect(service.create('r2', validInput)).resolves.toBeTruthy()
        })
    })

    describe('update', () => {
        it('should update fields and keep the table in its restaurant', async () => {
            const table = await service.create('r1', validInput)
            const updated = await service.update('r1', table.id, { number: 2, description: 'Terrace', capacity: 6 })
            expect(updated).toMatchObject({ id: table.id, number: 2, description: 'Terrace', capacity: 6, status: 'libre' })
        })

        it('should throw not found for a table of another restaurant', async () => {
            const table = await service.create('r1', validInput)
            await expect(service.update('r2', table.id, validInput)).rejects.toThrow('Table not found')
        })

        it('should reject a number used by another table', async () => {
            await service.create('r1', validInput)
            const second = await service.create('r1', { ...validInput, number: 2 })
            await expect(service.update('r1', second.id, validInput)).rejects.toThrow('already exists')
        })

        it('should allow keeping its own number', async () => {
            const table = await service.create('r1', validInput)
            await expect(service.update('r1', table.id, { ...validInput, capacity: 8 })).resolves.toBeTruthy()
        })
    })

    describe('read and delete', () => {
        it('should list tables of a restaurant', async () => {
            await service.create('r1', validInput)
            await service.create('r1', { ...validInput, number: 2 })
            await service.create('r2', validInput)
            expect((await service.getByRestaurant('r1')).map(t => t.number)).toEqual([1, 2])
        })

        it('should throw not found for unknown table', async () => {
            await expect(service.getById('r1', 'nope')).rejects.toThrow('Table not found')
        })

        it('should delete a free table', async () => {
            const table = await service.create('r1', validInput)
            await service.delete('r1', table.id)
            expect(await repo.findById(table.id)).toBeNull()
        })

        it('should not delete an occupied table', async () => {
            const table = await service.create('r1', validInput)
            await service.occupy('r1', table.id)
            await expect(service.delete('r1', table.id)).rejects.toThrow('occupied')
        })
    })

    describe('changeStatus', () => {
        it('should change status with normalization', async () => {
            const table = await service.create('r1', validInput)
            const updated = await service.changeStatus('r1', table.id, ' Reservada ')
            expect(updated.status).toBe('reservada')
        })

        it('should reject invalid status', async () => {
            const table = await service.create('r1', validInput)
            await expect(service.changeStatus('r1', table.id, 'roto')).rejects.toThrow('Invalid table status')
        })

        it('should throw not found for another restaurant', async () => {
            const table = await service.create('r1', validInput)
            await expect(service.changeStatus('r2', table.id, 'libre')).rejects.toThrow('Table not found')
        })
    })

    describe('listAvailable', () => {
        it('should return free tables that fit the people count', async () => {
            await service.create('r1', { number: 1, description: '', capacity: 2 })
            await service.create('r1', { number: 2, description: '', capacity: 4 })
            const available = await service.listAvailable('r1', 3)
            expect(available.map(t => t.number)).toEqual([2])
        })

        it('should reject invalid people count', async () => {
            await expect(service.listAvailable('r1', 0)).rejects.toThrow('People count')
            await expect(service.listAvailable('r1', NaN)).rejects.toThrow('People count')
        })
    })

    describe('occupy', () => {
        it('should occupy a free table', async () => {
            const table = await service.create('r1', validInput)
            const occupied = await service.occupy('r1', table.id)
            expect(occupied.status).toBe('ocupada')
        })

        it('should throw TableNotAvailableError when already occupied', async () => {
            const table = await service.create('r1', validInput)
            await service.occupy('r1', table.id)
            await expect(service.occupy('r1', table.id)).rejects.toThrow('not available')
        })

        it('should throw not found for another restaurant', async () => {
            const table = await service.create('r1', validInput)
            await expect(service.occupy('r2', table.id)).rejects.toThrow('Table not found')
        })
    })
})
