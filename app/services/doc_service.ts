import { type Edge } from 'edge.js'
import { errors } from '@adonisjs/core'
import { findDoc, resolveAsset, resolveLink } from '#collections/docs'

export class DocService {
  async renderDoc(permalink: string, view: ReturnType<Edge['share']>) {
    const doc = await findDoc(permalink)
    if (!doc) {
      throw new errors.E_ROUTE_NOT_FOUND(['GET', permalink])
    }

    return view.share({ resolveLink, resolveAsset }).render('pages/doc', {
      ...doc,
      permalink,
    })
  }
}
