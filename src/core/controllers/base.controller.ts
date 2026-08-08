import type { Request, Response } from "express";

import type { QueryResultRow } from "pg";

import { getRouteParam } from "@/shared/http/http.params.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { BaseService } from "@/core/services/base.service.js";
import { IMapper } from "@/core/dto/mapper.interface.js";
import { FindContext } from "@/core/repositories/repository.interface.js";
import { z } from "zod";
import { PaginatedResponse } from "@/shared/http/paginated-response.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";

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

  findAll = async (req: Request, res: Response): Promise<void> => {
    const options = this.getFindAllOptions(req) ?? {};

    const pagination =
      options.pagination ??
      new BasePagination({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

    const { entities, total } = await this.service.findAll({
      ...options,
      pagination,
    });

    if (this.mapper) {
      const mappedData = this.mapper.toResponseCollection(entities);
      res
        .status(200)
        .json(
          PaginatedResponse.create<TResponse>(mappedData, total, pagination),
        );
      return;
    }

    res
      .status(200)
      .json(PaginatedResponse.create<TEntity>(entities, total, pagination));
  };

  protected getFindAllOptions(_req: Request): FindContext<TEntity> | undefined {
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
