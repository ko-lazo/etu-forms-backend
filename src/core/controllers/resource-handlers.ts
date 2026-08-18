import type { Request, Response } from "express";
import type { QueryResultRow } from "pg";

import { type IMapper } from "@/core/dto/mapper.interface.js";
import {
  type IReadPolicy,
  type IResourcePolicy,
} from "@/core/policies/policy.interface.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import {
  type FindContext,
  type PaginationQuery,
} from "@/core/repositories/repository.interface.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { ensureAllowed } from "@/shared/http/authorize.js";
import { getRouteParam, getValidatedQuery } from "@/shared/http/http.params.js";
import { paginatedResponse } from "@/shared/http/paginated-response.js";

export type Handler = (req: Request, res: Response) => Promise<void>;

export type ReadableService<TEntity extends object> = {
  findById(id: string): Promise<TEntity | null>;
  findAll(
    options?: FindContext<TEntity>,
  ): Promise<{ entities: TEntity[]; total: number }>;
};

export type ResourceService<
  TEntity extends object,
  TCreate,
  TUpdate,
> = ReadableService<TEntity> & {
  create(data: TCreate): Promise<TEntity>;
  update(id: string, data: TUpdate): Promise<TEntity>;
  delete(id: string): Promise<void>;
};

type ReadDefinition<TEntity extends QueryResultRow, TResponse> = {
  readonly service: ReadableService<TEntity>;

  readonly policy: IReadPolicy<TEntity>;

  /** Преобразование сущности БД в DTO ответа */
  readonly mapper: IMapper<TEntity, TResponse>;

  /** Сборка контекста выборки (область видимости, фильтрация, пагинация). */
  readonly buildFindContext: (req: Request) => FindContext<TEntity>;

  /** Принадлежность сущности маршруту, по которому её запрашивают */
  readonly belongsTo?: (entity: TEntity, req: Request) => boolean;
};

type ResourceDefinition<
  TEntity extends QueryResultRow,
  TCreate,
  TUpdate,
  TResponse,
  TCreateContext,
> = ReadDefinition<TEntity, TResponse> & {
  readonly service: ResourceService<TEntity, TCreate, TUpdate>;

  readonly policy: IResourcePolicy<TEntity, TCreateContext>;

  readonly buildCreateContext: (req: Request) => TCreateContext;

  readonly buildCreateData?: (req: Request, context: TCreateContext) => TCreate;

  readonly buildUpdateData?: (req: Request, entity: TEntity) => TUpdate;
};

type FindOrFailDefinition<TEntity extends object> = {
  readonly service: ReadableService<TEntity>;

  readonly param?: string | undefined;

  readonly belongsTo?: ((entity: TEntity, req: Request) => boolean) | undefined;
};

export function createFindOrFail<TEntity extends object>({
  service,
  param = "id",
  belongsTo,
}: FindOrFailDefinition<TEntity>) {
  return async (req: Request): Promise<TEntity> => {
    const entity = await service.findById(getRouteParam(req, param));

    if (!entity || (belongsTo && !belongsTo(entity, req))) {
      throw new NotFoundError();
    }

    return entity;
  };
}

export function createReadHandlers<TEntity extends QueryResultRow, TResponse>(
  definition: ReadDefinition<TEntity, TResponse>,
) {
  const { service, policy, mapper, belongsTo } = definition;
  const findOrFail = createFindOrFail({ service, belongsTo });

  const findAll: Handler = async (req, res) => {
    const context = definition.buildFindContext(req);
    const pagination =
      context.pagination ??
      new BasePagination(getValidatedQuery<PaginationQuery>(req));

    const { entities, total } = await service.findAll({
      ...context,
      pagination,
    });

    const response = paginatedResponse(
      mapper.toResponseCollection(entities),
      total,
      pagination,
    );

    res.status(200).json(response);
  };

  const findById: Handler = async (req, res) => {
    const entity = await findOrFail(req);
    ensureAllowed(req.user?.id, await policy.view(req.user?.id, entity));

    res.status(200).json(mapper.toResponse(entity));
  };

  return { findAll, findById, findOrFail };
}

export function createResourceHandlers<
  TEntity extends QueryResultRow & { id: string },
  TCreate,
  TUpdate,
  TResponse,
  TCreateContext,
>(
  definition: ResourceDefinition<
    TEntity,
    TCreate,
    TUpdate,
    TResponse,
    TCreateContext
  >,
) {
  const { service, policy, mapper } = definition;
  const read = createReadHandlers(definition);
  const { findOrFail } = read;
  const buildCreateData =
    definition.buildCreateData ?? ((req: Request) => req.body as TCreate);
  const buildUpdateData =
    definition.buildUpdateData ?? ((req: Request) => req.body as TUpdate);

  const create: Handler = async (req, res) => {
    const context = definition.buildCreateContext(req);
    ensureAllowed(req.user?.id, await policy.create(req.user?.id, context));

    const entity = await service.create(buildCreateData(req, context));

    res.status(201).json(mapper.toResponse(entity));
  };

  const update: Handler = async (req, res) => {
    const entity = await findOrFail(req);
    ensureAllowed(req.user?.id, await policy.update(req.user?.id, entity));

    const updated = await service.update(
      entity.id,
      buildUpdateData(req, entity),
    );

    res.status(200).json(mapper.toResponse(updated));
  };

  const remove: Handler = async (req, res) => {
    const entity = await findOrFail(req);
    ensureAllowed(req.user?.id, await policy.delete(req.user?.id, entity));

    await service.delete(entity.id);

    res.status(204).send();
  };

  return { ...read, create, update, delete: remove };
}
