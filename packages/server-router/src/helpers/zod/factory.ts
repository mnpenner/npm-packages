import type {AnyContext, Handler, Route, RouteSchema} from '../../types'
import type {
    ZodHandlerOptions,
    ZodRouteHelperDefaults,
    ZodRouteOptions,
    ZodRouteSchemaInput
} from './zod'
import {zodHandler, zodPartial, zodRoute} from './zod'

/**
 * Reusable factory for Zod-backed handlers and routes with shared defaults.
 *
 * @example
 * ```ts
 * const factory = new ZodRouteFactory({
 *   schema: {
 *     response: {
 *       body: {
 *         400: z.object({message: z.string()}),
 *       },
 *     },
 *   },
 *   validateResponse: false,
 * })
 *
 * router.add(factory.route({
 *   path: '/users/:id',
 *   schema: {
 *     request: {
 *       path: z.object({id: z.string()}),
 *     },
 *   },
 *   handler: ({params}) => ({id: params.path.id}),
 * }))
 * ```
 */
export class ZodRouteFactory {
    private readonly _defaults: ZodRouteHelperDefaults

    /**
     * Create a Zod route factory with shared helper defaults.
     *
     * @param defaults - Default schema fragments, response validation, and request validation error handling.
     */
    constructor(defaults: ZodRouteHelperDefaults = {}) {
        this._defaults = defaults
    }

    private _mergeSchema(
        schema: ZodRouteSchemaInput<any, any, any, any> | undefined
    ): ZodRouteSchemaInput<any, any, any, any> | undefined {
        const defaultSchema = this._defaults.schema
        if (!defaultSchema) return schema
        if (!schema) return defaultSchema

        const request = (!defaultSchema.request && !schema.request)
            ? undefined
            : {
                ...defaultSchema.request,
                ...schema.request,
            }

        const responseBody = (!defaultSchema.response?.body && !schema.response?.body)
            ? undefined
            : {
                ...(defaultSchema.response?.body ?? {}),
                ...(schema.response?.body ?? {}),
            }

        const response = responseBody ? {body: responseBody} : undefined

        return {
            ...(request ? {request} : {}),
            ...(response ? {response} : {}),
        }
    }

    private _mergeHandlerOptions<
        Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
        Ctx extends object,
    >(options: ZodHandlerOptions<Schema, Ctx>): ZodHandlerOptions<ZodRouteSchemaInput<any, any, any, any>, Ctx> {
        const schema = this._mergeSchema(options.schema)
        return {
            ...this._defaults,
            ...options,
            ...(schema === undefined ? {} : {schema}),
        }
    }

    private _mergeRouteOptions<
        Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
        Ctx extends object,
    >(options: ZodRouteOptions<Schema, Ctx>): ZodRouteOptions<ZodRouteSchemaInput<any, any, any, any>, Ctx> {
        const schema = this._mergeSchema(options.schema)
        return {
            ...this._defaults,
            ...options,
            ...(schema === undefined ? {} : {schema}),
        }
    }

    /**
     * Build a validated handler using the factory defaults.
     *
     * @param options - Per-handler options that override the factory defaults.
     * @returns A handler compatible with the core router.
     */
    handler<
        Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
        Ctx extends object = AnyContext,
    >(options: ZodHandlerOptions<Schema, Ctx>): Handler<any, Ctx> {
        return zodHandler(this._mergeHandlerOptions(options))
    }

    /**
     * Build a validated handler plus generated route schema using the factory defaults.
     *
     * @param options - Per-handler options that override the factory defaults.
     * @returns An object containing the validated handler and generated route schema.
     */
    partial<
        Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
        Ctx extends object = AnyContext,
    >(options: ZodHandlerOptions<Schema, Ctx>): {handler: Handler<any, Ctx>; schema?: RouteSchema} {
        return zodPartial(this._mergeHandlerOptions(options))
    }

    /**
     * Build a full route using the factory defaults.
     *
     * @param options - Per-route options that override the factory defaults.
     * @returns A route definition compatible with the core router.
     */
    route<
        Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
        Ctx extends object = AnyContext,
    >(options: ZodRouteOptions<Schema, Ctx>): Route<Ctx> {
        return zodRoute(this._mergeRouteOptions(options))
    }
}
