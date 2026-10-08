import { SqliteTableRepository } from './table.repository.js'
import { Database } from '@config/database.js'
import type { Table } from '@models/table.model.js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

const now = new Date().toISOString()

function makeTable(overrides: Partial<Table> = {}): Table {
    return {
        id: 't1',
        restaurantId: 'r1',
        number: 1,
        description: 'Window',
        capacity: 4,
        status: 'libre',
        createdAt: now,
        updatedAt: now,
        ...overrides
    }
}

describe('SqliteTableRepository (Integration)', () => {
    let db: Database
    let repo: SqliteTableRepository

    beforeAll(async () => {
        process.env.NODE_ENV = 'test'
        db = new Database()
        await db.initialize()
        await db.run(
            "INSERT INTO restaurants (id, name, address, email, phone, owner_first_name, owner_last_name, created_at, updated_at) VALUES ('r1', 'R', 'A', 'e@e.com', '+34600000000', 'O', 'W', ?, ?)",
            [now, now]
        )
        repo = new SqliteTableRepository(db)
    })

    afterAll(async () => {
        await db.close()
    })

    beforeEach(async () => {
        await db.run('DELETE FROM tables')
    })

    it('should save and find a table by id', async () => {
        await repo.save(makeTable())
        expect(await repo.findById('t1')).toEqual(makeTable())
    })

    it('should return null when table does not exist', async () => {
        expect(await repo.findById('nope')).toBeNull()
    })

    it('should update an existing table on save', async () => {
        await repo.save(makeTable())
        await repo.save(makeTable({ capacity: 6, status: 'reservada' }))
        const found = await repo.findById('t1')
        expect(found?.capacity).toBe(6)
        expect(found?.status).toBe('reservada')
    })

    it('should list tables of a restaurant ordered by number', async () => {
        await repo.save(makeTable({ id: 't2', number: 2 }))
        await repo.save(makeTable({ id: 't1', number: 1 }))
        const tables = await repo.findByRestaurant('r1')
        expect(tables.map(t => t.number)).toEqual([1, 2])
    })

    it('should find a table by restaurant and number', async () => {
        await repo.save(makeTable({ number: 7 }))
        expect((await repo.findByNumber('r1', 7))?.id).toBe('t1')
        expect(await repo.findByNumber('r1', 8)).toBeNull()
    })

    it('should delete a table', async () => {
        await repo.save(makeTable())
        await repo.delete('t1')
        expect(await repo.findById('t1')).toBeNull()
    })

    it('should find only free tables with enough capacity ordered by capacity', async () => {
        await repo.save(makeTable({ id: 'a', number: 1, capacity: 6 }))
        await repo.save(makeTable({ id: 'b', number: 2, capacity: 2 }))
        await repo.save(makeTable({ id: 'c', number: 3, capacity: 4 }))
        await repo.save(makeTable({ id: 'd', number: 4, capacity: 4, status: 'ocupada' }))
        await repo.save(makeTable({ id: 'e', number: 5, capacity: 4, status: 'reservada' }))
        const available = await repo.findAvailable('r1', 3)
        expect(available.map(t => t.id)).toEqual(['c', 'a'])
    })

    it('should occupy a free table only once', async () => {
        await repo.save(makeTable())
        expect(await repo.occupyIfFree('t1')).toBe(true)
        expect(await repo.occupyIfFree('t1')).toBe(false)
        expect((await repo.findById('t1'))?.status).toBe('ocupada')
    })

    it('should not occupy a reserved table', async () => {
        await repo.save(makeTable({ status: 'reservada' }))
        expect(await repo.occupyIfFree('t1')).toBe(false)
    })
})
