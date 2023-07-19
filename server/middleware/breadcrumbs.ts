import type { Request, Response, NextFunction, RequestHandler } from 'express'

type Breadcrumb = { href: string } & ({ text: string } | { html: string })

class Breadcrumbs {
  breadcrumbs: Breadcrumb[]

  constructor(res: Response) {
    this.breadcrumbs = [
      {
        text: 'Digital Prison Services',
        href: res.app.locals.dpsUrl,
      },
      {
        text: 'Jones, David',
        href: `${res.app.locals.dpsUrl}/prisoner/A8469DY`,
      },
    ]
  }

  addItems(...items: Breadcrumb[]): void {
    this.breadcrumbs.push(...items)
  }

  get items(): readonly Breadcrumb[] {
    return [...this.breadcrumbs]
  }
}

export default function breadcrumbs(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.breadcrumbs = new Breadcrumbs(res)
    next()
  }
}
