import type { Router, RequestHandler, NextFunction } from 'express'
import type { ParamsDictionary, PathParams, Query } from 'express-serve-static-core'
import { BadRequest, MethodNotAllowed } from 'http-errors'

import type { BaseData, BaseForm } from '../forms'

/**
 * Extends express’ normal RequestHandler to be aware that forms are added to locals object
 */
export type FormRequestHandler<
  Forms extends Record<string, BaseForm<BaseData>>,
  Params = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
  Locals extends Record<string, unknown> = Record<string, unknown>,
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
  } & {
    user: Express.User
  } & Locals
>

/**
 * Instantiates the form stored in `res.locals.forms` under it’s own `formId`.
 * Submits the form if the request method was a POST,
 * calling the formValid callback on valid forms and formInvalid otherwise.
 */
export default function formRoute<Forms extends Record<string, BaseForm<BaseData>>>(
  router: Router,
  path: PathParams,
  formConstructors: {
    [Name in keyof Forms]: () => Forms[Name]
  },
  ...handlers: readonly FormRequestHandler<Forms>[]
): void {
  router.all(path, makeSubmissionHandler(formConstructors), ...handlers)
}

function makeSubmissionHandler<Forms extends Record<string, BaseForm<BaseData>>>(formConstructors: {
  [Name in keyof Forms]: () => Forms[Name]
}): FormRequestHandler<Forms> {
  return (req, res, next: NextFunction): void => {
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
    // eslint-disable-next-line no-restricted-syntax
    for (const [formId, constructor] of Object.entries(formConstructors)) {
      res.locals.forms[formId as keyof Forms] = constructor()
    }

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
  }
}
