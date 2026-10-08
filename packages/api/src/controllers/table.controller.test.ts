import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response } from 'express'
import { TableController } from './table.controller.js'
import { TableService } from '@services/table.service.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'
import { errorHandler } from '@shared/infrastructure/http/errorHandler.js'

function mockRes() {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    res.send = vi.fn().mockReturnValue(res)
    return res as Response & { status: any; json: any; send: any }
}

function mockReq(parts: Partial<Request>): Request {
    return { params: { restaurantId: 'r1' }, body: {}, query: {}, ...parts } as Request
}

describe('TableController', () => {
    let controller: TableController
    let service: TableService

    beforeEach(() => {
        service = new TableService(new MockTableRepository())
        controller = new TableController(service)
    })

    it('create should respond 201 with the table', async () => {
        const res = mockRes()
        await controller.create(mockReq({ body: { number: 1, description: 'A', capacity: 4 } }), res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json.mock.calls[0][0]).toMatchObject({ number: 1, capacity: 4, status: 'libre', restaurantId: 'r1' })
    })

    it('create should forward domain errors to next', async () => {
        const next = vi.fn()
        await controller.create(mockReq({ body: { number: 1, capacity: 0 } }), mockRes(), next)
        expect(next).toHaveBeenCalledOnce()
        expect(next.mock.calls[0]![0].name).toBe('InvalidTableCapacityError')
    })

    it('getAll should respond 200 with the list', async () => {
        await service.create('r1', { number: 1, description: '', capacity: 2 })
        const res = mockRes()
        await controller.getAll(mockReq({}), res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json.mock.calls[0][0]).toHaveLength(1)
    })

    it('update should respond 200', async () => {
        const table = await service.create('r1', { number: 1, description: '', capacity: 2 })
        const res = mockRes()
        await controller.update(mockReq({ params: { restaurantId: 'r1', id: table.id } as any, body: { number: 1, description: 'x', capacity: 6 } }), res, vi.fn())
        expect(res.json.mock.calls[0][0]).toMatchObject({ capacity: 6, description: 'x' })
    })

    it('delete should respond 204', async () => {
        const table = await service.create('r1', { number: 1, description: '', capacity: 2 })
        const res = mockRes()
        await controller.delete(mockReq({ params: { restaurantId: 'r1', id: table.id } as any }), res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(204)
    })

    it('changeStatus should respond 200 with new status', async () => {
        const table = await service.create('r1', { number: 1, description: '', capacity: 2 })
        const res = mockRes()
        await controller.changeStatus(mockReq({ params: { restaurantId: 'r1', id: table.id } as any, body: { status: 'reservada' } }), res, vi.fn())
        expect(res.json.mock.calls[0][0].status).toBe('reservada')
    })

    it('getAvailable should parse people from query', async () => {
        await service.create('r1', { number: 1, description: '', capacity: 2 })
        await service.create('r1', { number: 2, description: '', capacity: 6 })
        const res = mockRes()
        await controller.getAvailable(mockReq({ query: { people: '4' } }), res, vi.fn())
        expect(res.json.mock.calls[0][0].map((t: any) => t.number)).toEqual([2])
    })

    it('getAvailable should reject a missing people param', async () => {
        const next = vi.fn()
        await controller.getAvailable(mockReq({ query: {} }), mockRes(), next)
        expect(next.mock.calls[0]![0].name).toBe('InvalidPeopleCountError')
    })

    it('occupy should respond 200 and then fail the second time', async () => {
        const table = await service.create('r1', { number: 1, description: '', capacity: 2 })
        const req = mockReq({ params: { restaurantId: 'r1', id: table.id } as any })
        const res = mockRes()
        await controller.occupy(req, res, vi.fn())
        expect(res.json.mock.calls[0][0].status).toBe('ocupada')
        const next = vi.fn()
        await controller.occupy(req, mockRes(), next)
        expect(next.mock.calls[0]![0].name).toBe('TableNotAvailableError')
    })
})

describe('errorHandler table errors', () => {
    const cases: [string, number][] = [
        ['TableNotFoundError', 404],
        ['DuplicatedTableNumberError', 409],
        ['TableNotAvailableError', 409],
        ['TableOccupiedError', 409]
    ]

    it.each(cases)('should map %s to %i', async (name, status) => {
        const errors = await import('@errors/DomainErrors.js') as any
        const res = mockRes()
        errorHandler(new errors[name](), {} as Request, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(status)
    })
})
