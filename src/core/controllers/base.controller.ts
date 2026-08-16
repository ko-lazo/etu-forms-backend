import type { Request, Response } from "express";

import type { QueryResultRow } from "pg";

import { getRouteParam } from "@/shared/http/http.params.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { type BaseService } from "@/core/services/base.service.js";
import { type IMapper } from "@/core/dto/mapper.interface.js";
import { type FindContext } from "@/core/repositories/repository.interface.js";
import { paginatedResponse } from "@/shared/http/paginated-response.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { ForbiddenError } from "@/shared/errors/forbidden.error.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { type IResourcePolicy } from "@/core/policies/policy.interface.js";

export abstract class BaseController<
  TEntity extends QueryResultRow,
  TCreate,
  TUpdate,
  TResponse,
> {
  protected constructor(
    protected readonly service: BaseService<TEntity, TCreate, TUpdate>,
    protected readonly policy?: IResourcePolicy<TEntity>,
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
        .json(paginatedResponse<TResponse>(mappedData, total, pagination));
      return;
    }

    res
      .status(200)
      .json(paginatedResponse<TEntity>(entities, total, pagination));
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

    if (this.policy) {
      const allowed = await this.policy.view(req.user?.id, entity);
      if (!allowed) {
        throw req.user ? new ForbiddenError() : new UnauthorizedError();
      }
    }

    const data = this.mapper ? this.mapper.toResponse(entity) : entity;

    res.status(200).json(data);
  };

  protected buildCreateData(req: Request): TCreate {
    return req.body as TCreate;
  }

  protected buildUpdateData(req: Request): TUpdate {
    return req.body as TUpdate;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const entity = await this.service.create(this.buildCreateData(req));
    const data = this.mapper ? this.mapper.toResponse(entity) : entity;
    res.status(201).json(data);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = getRouteParam(req, "id");
    const entity = await this.service.findById(id);

    if (!entity) {
      throw new NotFoundError("Entity not found");
    }

    if (this.policy) {
      if (!req.user) throw new UnauthorizedError();
      const allowed = await this.policy.update(req.user.id, entity);
      if (!allowed) throw new ForbiddenError();
    }

    const updatedEntity = await this.service.update(
      id,
      this.buildUpdateData(req),
    );
    const data = this.mapper
      ? this.mapper.toResponse(updatedEntity)
      : updatedEntity;
    res.status(200).json(data);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const id = getRouteParam(req, "id");
    const entity = await this.service.findById(id);

    if (!entity) {
      throw new NotFoundError("Entity not found");
    }

    if (this.policy) {
      if (!req.user) throw new UnauthorizedError();
      const allowed = await this.policy.delete(req.user.id, entity);
      if (!allowed) throw new ForbiddenError();
    }

    await this.service.delete(id);
    res.status(204).send();
  };
}
