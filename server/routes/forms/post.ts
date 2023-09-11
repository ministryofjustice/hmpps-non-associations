import type { Router, Request, RequestHandler, Response, NextFunction } from 'express'
import type { ParamsDictionary, PathParams, Query } from 'express-serve-static-core'
import { BadRequest, MethodNotAllowed } from 'http-errors'

import asyncMiddleware from '../../middleware/asyncMiddleware'
import type { BaseData, BaseForm } from '../../forms'

/**
 * Form-initialising function
 */
export type FormPostConstructor<
  Forms extends Record<string, BaseForm<BaseData>>,
  Name extends keyof Forms,
  Params = ParamsDictionary,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResBody = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReqBody = any,
  ReqQuery = Query,
  Locals extends Express.Locals = Express.Locals,
> = (
  req: Request<Params, ResBody, ReqBody, ReqQuery, Locals>,
  res: Response<ResBody, Locals>,
) => Forms[Name] | Promise<Forms[Name]>

/**
 * Extends express’ normal RequestHandler to be aware that forms are added to locals object
 */
export type FormPostRequestHandler<
  Forms extends Record<string, BaseForm<BaseData>>,
  Params = ParamsDictionary,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResBody = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReqBody = any,
  ReqQuery = Query,
  Locals extends Express.Locals = Express.Locals,
> = RequestHandler<
  Params,
  ResBody,
  {
    formId?: string
  } & ReqBody,
  ReqQuery,
  {
    forms: Forms
    submittedForm: Forms[keyof Forms] | null
  } & Locals
>

/**
 * Adds request handlers to the router for processing forms submitted via POST payload.
 * All forms are constructed and, for POST calls, the one whose formId matches is submitted
 * and is available from `res.locals.submittedForm`.
 */
export default function formPostRoute<Forms extends Record<string, BaseForm<BaseData>>>(
  router: Router,
  path: PathParams,
  formConstructors: {
    [Name in keyof Forms]: FormPostConstructor<Forms, Name>
  },
  ...handlers: readonly FormPostRequestHandler<Forms>[]
): void {
  router.all(path, makeSubmissionHandler(formConstructors), ...handlers)
}

function makeSubmissionHandler<Forms extends Record<string, BaseForm<BaseData>>>(formConstructors: {
  [Name in keyof Forms]: FormPostConstructor<Forms, Name>
}): FormPostRequestHandler<Forms> {
  return asyncMiddleware(async (req, res, next: NextFunction): Promise<void> => {
    // limit request methods to GET or POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      next(new MethodNotAllowed('Only GET or POST methods are allowed'))
      return
    }

    // construct forms and store in locals
    res.locals.submittedForm = null
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because locals.forms are not _yet_ set up
    res.locals.forms = res.locals.forms || {}
    await Promise.all(
      Object.entries(formConstructors).map(([formId, constructor]): Promise<void> => {
        return (async () => {
          res.locals.forms[formId as keyof Forms] = await constructor(req, res)
        })()
      }),
    )

    // if not a POST, skip to next handler
    if (req.method !== 'POST') {
      next()
      return
    }

    // if submitted with invalid formId, propagate 400 error
    if (!req?.body?.formId || !Object.keys(formConstructors).some(formId => formId === req.body.formId)) {
      next(new BadRequest(`POST with invalid formId: "${req.body.formId}"`))
      return
    }

    // submit form which triggers validation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because typescript cannot know that the right formId-to-class pairing is used
    res.locals.submittedForm = res.locals.forms[req.body.formId]
    res.locals.submittedForm.submit(req.body)

    // handle valid or invalid form
    next()
  })
}
