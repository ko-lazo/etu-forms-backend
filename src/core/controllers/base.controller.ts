import type { Request, Response } from "express";

import type { QueryResultRow } from "pg";

import { getRouteParam } from "@/shared/http/http.params.js";
import { NotFoundError } from '@/shared/errors/not-found.error.js';
import { BaseService } from "@/core/services/base.service.js";

export abstract class BaseController<
  TEntity extends QueryResultRow,
  TCreate,
  TUpdate,
> {
  protected constructor(
    protected readonly service: BaseService<TEntity, TCreate, TUpdate>,
  ) {}

  findAll = async (_req: Request, res: Response): Promise<void> => {
    const entities = await this.service.findAll();

    res.status(200).json(entities);
  };

  findById = async (req: Request, res: Response): Promise<void> => {
    const id = getRouteParam(req, "id");
    const entity = await this.service.findById(id);

    if (!entity) {
      throw new NotFoundError("Entity not found");
    }

    res.status(200).json(entity);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const entity = await this.service.create(req.body);

    res.status(201).json(entity);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = getRouteParam(req, "id");

    const entity = await this.service.update(id, req.body);

    res.status(200).json(entity);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const id = getRouteParam(req, "id");

    await this.service.delete(id);

    res.status(204).send();
  };
}
