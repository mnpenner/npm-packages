import { createValibotRoutes } from '@mpen/routekit/routes'
import { jsonResponse } from '@mpen/routekit'
import * as v from 'valibot'
import { HttpStatus } from '@mpen/http-helpers'
import type { BaseIssue } from 'valibot'

interface SerializedBaseIssue extends Omit<BaseIssue<unknown>, 'issues' | 'path'> {
    readonly path?: unknown
    readonly issues?: SerializedBaseIssue[] | undefined
    readonly skipPipe?: boolean | undefined
}

const IssueKindSchema = v.picklist(['schema', 'validation', 'transformation'])

// Keep these opaque unless you want to fully model Valibot internals.
const IssuePathSchema = v.unknown()

export const BaseIssueSchema: v.GenericSchema<unknown, SerializedBaseIssue> = v.object({
    // Required info
    kind: IssueKindSchema,
    type: v.string(),
    input: v.unknown(),
    expected: v.nullable(v.string()),
    received: v.string(),
    message: v.string(),

    // Optional info
    requirement: v.optional(v.unknown()),
    path: v.optional(IssuePathSchema),
    issues: v.optional(v.lazy(() => v.array(BaseIssueSchema))),
    lang: v.optional(v.string()),
    abortEarly: v.optional(v.boolean()),
    abortPipeEarly: v.optional(v.boolean()),
    skipPipe: v.optional(v.boolean()),
})

export const valibotRoute = createValibotRoutes({
    validateResponse: 'parse',
    validationError(component, issues) {
        console.error('validationError', { component, issues })
        return jsonResponse({ component, issues }, HttpStatus.BAD_REQUEST)
    },
    schema: {
        response: {
            body: {
                default: v.unknown(),
                [HttpStatus.BAD_REQUEST]: v.object({
                    component: v.pipe(v.number(), v.integer()),
                    issues: v.array(BaseIssueSchema),
                }),
            },
        },
    },
})
