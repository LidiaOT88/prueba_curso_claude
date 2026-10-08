import { describe, it, expect } from 'vitest'
import { normalizeTableStatus } from '@models/table.model.js'

describe('normalizeTableStatus', () => {
    it('should accept all valid statuses', () => {
        for (const s of ['libre', 'ocupada', 'reservada']) {
            expect(normalizeTableStatus(s)).toBe(s)
        }
    })

    it('should normalize case and whitespace', () => {
        expect(normalizeTableStatus('  OCUPADA ')).toBe('ocupada')
    })

    it('should throw InvalidTableStatusError for invalid status', () => {
        expect(() => normalizeTableStatus('roto')).toThrow('Invalid table status')
    })
})
