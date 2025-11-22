import type { HttpContext } from '@adonisjs/core/http'
import { docsZones } from '#collections/docs'
import { errors } from '@adonisjs/core'

export default class DocsController {
  async handle({ view, params, request }: HttpContext) {
    const permalink = params['*'].join('/')
    const start = await docsZones.start.load()
    const guides = await docsZones.guides.load()

    if (start.findByPermalink(permalink)) {
      return view.render('pages/doc', {
        menu: start,
        menuItem: start.findByPermalink(permalink),
        permalink,
      })
    }

    if (guides.findByPermalink(permalink)) {
      return view.render('pages/doc', {
        menu: guides,
        menuItem: start.findByPermalink(permalink),
        permalink,
      })
    }

    throw new errors.E_ROUTE_NOT_FOUND(['GET', request.url()])
  }
}
