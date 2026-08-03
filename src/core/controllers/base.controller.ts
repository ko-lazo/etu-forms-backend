import type { Request, Response } from "express";

import type { QueryResultRow } from "pg";

import { getRouteParam } from "@/shared/http/http.params.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { BaseService } from "@/core/services/base.service.js";
import { IMapper } from "@/core/dto/mapper.interface.js";
import { FindAllOptions } from "@/core/repositories/repository.interface.js";

export abstract class BaseController<
  TEntity extends QueryResultRow,
  TCreate,
  TUpdate,
  TResponse,
> {
  protected constructor(
    protected readonly service: BaseService<TEntity, TCreate, TUpdate>,
    protected readonly mapper?: IMapper<TEntity, TResponse>,
  ) {}

  findAll = async (_req: Request, res: Response): Promise<void> => {
    const options = this.getFindAllOptions(_req);
    const entities = await this.service.findAll(options);
    const data = this.mapper
      ? this.mapper.toResponseCollection(entities)
      : entities;
    res.status(200).json(data);
  };

  // todo refactor
  protected getFindAllOptions(_req: Request): FindAllOptions | undefined {
    return undefined;
  }

  findById = async (req: Request, res: Response): Promise<void> => {
    const id = getRouteParam(req, "id");
    const entity = await this.service.findById(id);

    if (!entity) {
      throw new NotFoundError("Entity not found");
    }

    const data = this.mapper ? this.mapper.toResponse(entity) : entity;
    res.status(200).json(data);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const entity = await this.service.create(req.body);
    const data = this.mapper ? this.mapper.toResponse(entity) : entity;
    res.status(201).json(data);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = getRouteParam(req, "id");
    const entity = await this.service.update(id, req.body);
    const data = this.mapper ? this.mapper.toResponse(entity) : entity;
    res.status(200).json(data);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const id = getRouteParam(req, "id");

    await this.service.delete(id);

    res.status(204).send();
  };
}
