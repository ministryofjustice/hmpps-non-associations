import type { Router, RequestHandler, NextFunction } from 'express'
import type { ParamsDictionary, PathParams, Query } from 'express-serve-static-core'
import { BadRequest, MethodNotAllowed } from 'http-errors'

import type { BaseData, BaseForm } from '../../forms'
import type { AppLocals } from './index'

/**
 * Extends express’ normal RequestHandler to be aware that forms are added to locals object
 */
export type FormGetRequestHandler<
  Forms extends Record<string, BaseForm<BaseData>>,
  Params = ParamsDictionary,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResBody = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReqBody = any,
  ReqQuery = Query,
  Locals extends AppLocals = AppLocals,
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
 * Adds request handlers to the router for processing forms submitted via GET query parameters.
 * All forms are constructed and the one whose formId matches is submitted
 * and is available from `res.locals.submittedForm`.
 */
export default function formGetRoute<Forms extends Record<string, BaseForm<BaseData>>>(
  router: Router,
  path: PathParams,
  formConstructors: {
    [Name in keyof Forms]: () => Forms[Name]
  },
  ...handlers: readonly FormGetRequestHandler<Forms>[]
): void {
  router.all(path, makeSubmissionHandler(formConstructors), ...handlers)
}

function makeSubmissionHandler<Forms extends Record<string, BaseForm<BaseData>>>(formConstructors: {
  [Name in keyof Forms]: () => Forms[Name]
}): FormGetRequestHandler<Forms> {
  return (req, res, next: NextFunction): void => {
    // limit request methods to GET
    if (req.method !== 'GET') {
      next(new MethodNotAllowed('Only GET method is allowed'))
      return
    }

    // construct forms and store in locals
    res.locals.submittedForm = null
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because locals.forms are not _yet_ set up
    res.locals.forms = res.locals.forms || {}
    // eslint-disable-next-line no-restricted-syntax
    for (const [formId, constructor] of Object.entries(formConstructors)) {
      res.locals.forms[formId as keyof Forms] = constructor()
    }

    // if no formId submitted, skip to next handler
    if (!req.query?.formId) {
      next()
      return
    }

    // if submitted with invalid formId, propagate 400 error
    if (!Object.keys(formConstructors).some(formId => formId === req.query.formId)) {
      next(new BadRequest(`Submitted with invalid formId: "${req.query.formId}"`))
      return
    }

    // submit form which triggers validation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because typescript cannot know that the right formId-to-class pairing is used
    res.locals.submittedForm = res.locals.forms[req.query.formId]
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because express typing does not allow overriding what the query type is
    res.locals.submittedForm.submit(req.query)

    // handle valid or invalid form
    next()
  }
}
