import { Database } from '@config/database.js'
import type { Table } from '@models/table.model.js'

const TABLE_COLUMNS = 'id, restaurant_id as restaurantId, number, description, capacity, status, created_at as createdAt, updated_at as updatedAt'

export interface TableRepository {
    findById(id: string): Promise<Table | null>
    findByRestaurant(restaurantId: string): Promise<Table[]>
    findByNumber(restaurantId: string, number: number): Promise<Table | null>
    findAvailable(restaurantId: string, people: number): Promise<Table[]>
    occupyIfFree(id: string): Promise<boolean>
    save(table: Table): Promise<void>
    delete(id: string): Promise<void>
}

export class SqliteTableRepository implements TableRepository {
    constructor(private db: Database) {}

    async findById(id: string): Promise<Table | null> {
        const row = await this.db.get<Table>(`SELECT ${TABLE_COLUMNS} FROM tables WHERE id = ?`, [id])
        return row ?? null
    }

    async findByRestaurant(restaurantId: string): Promise<Table[]> {
        return this.db.all<Table>(
            `SELECT ${TABLE_COLUMNS} FROM tables WHERE restaurant_id = ? ORDER BY number`,
            [restaurantId]
        )
    }

    async findByNumber(restaurantId: string, number: number): Promise<Table | null> {
        const row = await this.db.get<Table>(
            `SELECT ${TABLE_COLUMNS} FROM tables WHERE restaurant_id = ? AND number = ?`,
            [restaurantId, number]
        )
        return row ?? null
    }

    async findAvailable(restaurantId: string, people: number): Promise<Table[]> {
        return this.db.all<Table>(
            `SELECT ${TABLE_COLUMNS} FROM tables WHERE restaurant_id = ? AND status = 'libre' AND capacity >= ? ORDER BY capacity, number`,
            [restaurantId, people]
        )
    }

    async occupyIfFree(id: string): Promise<boolean> {
        const result = await this.db.run(
            "UPDATE tables SET status = 'ocupada', updated_at = ? WHERE id = ? AND status = 'libre'",
            [new Date().toISOString(), id]
        )
        return result.changes > 0
    }

    async save(table: Table): Promise<void> {
        const existing = await this.findById(table.id)
        if (existing) {
            await this.db.run(
                'UPDATE tables SET number = ?, description = ?, capacity = ?, status = ?, updated_at = ? WHERE id = ?',
                [table.number, table.description, table.capacity, table.status, table.updatedAt, table.id]
            )
        } else {
            await this.db.run(
                'INSERT INTO tables (id, restaurant_id, number, description, capacity, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [table.id, table.restaurantId, table.number, table.description, table.capacity, table.status, table.createdAt, table.updatedAt]
            )
        }
    }

    async delete(id: string): Promise<void> {
        await this.db.run('DELETE FROM tables WHERE id = ?', [id])
    }
}
