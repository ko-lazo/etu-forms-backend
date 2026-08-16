import type { Request, Response } from "express";
import type { QueryResultRow } from "pg";

import { BaseController } from "./base.controller.js";
import { getRouteParam } from "@/shared/http/http.params.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { ForbiddenError } from "@/shared/errors/forbidden.error.js";
import { ISubResourcePolicy } from "@/core/policies/policy.interface.js";

// todo refactor
export abstract class BaseSubController<
  TEntity extends QueryResultRow,
  TCreate,
  TUpdate,
  TResponse,
> extends BaseController<TEntity, TCreate, TUpdate, TResponse> {
  declare protected policy?: ISubResourcePolicy<TEntity>;

  protected constructor(
    service: BaseController<TEntity, TCreate, TUpdate, TResponse>["service"],
    policy?: ISubResourcePolicy<TEntity>,
    mapper?: BaseController<TEntity, TCreate, TUpdate, TResponse>["mapper"],
  ) {
    super(service, policy, mapper);
  }

  protected abstract getParentId(req: Request): string;

  protected abstract belongsToParent(
    entity: TEntity,
    parentId: string,
  ): boolean;

  protected override buildCreateData(req: Request): TCreate {
    return this.buildCreateDataForParent(req, this.getParentId(req));
  }

  protected abstract buildCreateDataForParent(
    req: Request,
    parentId: string,
  ): TCreate;

  override create = async (req: Request, res: Response): Promise<void> => {
    const parentId = this.getParentId(req);

    if (this.policy && this.policy.create) {
      const allowed = await this.policy.create(req.user?.id, parentId);
      if (!allowed) {
        throw req.user ? new ForbiddenError() : new UnauthorizedError();
      }
    }

    const data = this.buildCreateDataForParent(req, parentId);
    const entity = await this.service.create(data);
    const response = this.mapper ? this.mapper.toResponse(entity) : entity;

    res.status(201).json(response);
  };

  override findById = async (req: Request, res: Response): Promise<void> => {
    const parentId = this.getParentId(req);
    const id = getRouteParam(req, "id");

    const entity = await this.service.findById(id);

    if (!entity || !this.belongsToParent(entity, parentId)) {
      throw new NotFoundError("Entity not found");
    }

    if (this.policy) {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const allowed = await this.policy.view(req.user.id, entity);

      if (!allowed) {
        throw new ForbiddenError();
      }
    }

    const data = this.mapper ? this.mapper.toResponse(entity) : entity;

    res.status(200).json(data);
  };

  override update = async (req: Request, res: Response): Promise<void> => {
    const parentId = this.getParentId(req);
    const id = getRouteParam(req, "id");

    const entity = await this.service.findById(id);

    if (!entity || !this.belongsToParent(entity, parentId)) {
      throw new NotFoundError("Entity not found");
    }

    if (this.policy) {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const allowed = await this.policy.update(req.user.id, entity);

      if (!allowed) {
        throw new ForbiddenError();
      }
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

  override delete = async (req: Request, res: Response): Promise<void> => {
    const parentId = this.getParentId(req);
    const id = getRouteParam(req, "id");

    const entity = await this.service.findById(id);

    if (!entity || !this.belongsToParent(entity, parentId)) {
      throw new NotFoundError("Entity not found");
    }

    if (this.policy) {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const allowed = await this.policy.delete(req.user.id, entity);

      if (!allowed) {
        throw new ForbiddenError();
      }
    }

    await this.service.delete(id);

    res.status(204).send();
  };
}
