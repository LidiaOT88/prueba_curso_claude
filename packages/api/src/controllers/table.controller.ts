import type { Request, Response, NextFunction } from 'express'
import type { TableService } from '@services/table.service.js'
import { InvalidPeopleCountError } from '@errors/DomainErrors.js'

export class TableController {
    constructor(private readonly tableService: TableService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.create(req.params.restaurantId as string, {
                number: req.body.number,
                description: req.body.description,
                capacity: req.body.capacity
            })
            res.status(201).json(table)
        } catch (error) {
            next(error)
        }
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tables = await this.tableService.getByRestaurant(req.params.restaurantId as string)
            res.status(200).json(tables)
        } catch (error) {
            next(error)
        }
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.update(
                req.params.restaurantId as string,
                req.params.id as string,
                {
                    number: req.body.number,
                    description: req.body.description,
                    capacity: req.body.capacity
                }
            )
            res.status(200).json(table)
        } catch (error) {
            next(error)
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.tableService.delete(req.params.restaurantId as string, req.params.id as string)
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }

    changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.changeStatus(
                req.params.restaurantId as string,
                req.params.id as string,
                req.body.status
            )
            res.status(200).json(table)
        } catch (error) {
            next(error)
        }
    }

    getAvailable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const raw = req.query.people
            if (typeof raw !== 'string' || raw.trim() === '') {
                throw new InvalidPeopleCountError()
            }
            const tables = await this.tableService.listAvailable(req.params.restaurantId as string, Number(raw))
            res.status(200).json(tables)
        } catch (error) {
            next(error)
        }
    }

    occupy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.occupy(req.params.restaurantId as string, req.params.id as string)
            res.status(200).json(table)
        } catch (error) {
            next(error)
        }
    }
}
