import { inject } from '@adonisjs/core'
import { DocService } from '#services/doc_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class DocsController {
  @inject()
  async handle({ response, params }: HttpContext, docService: DocService) {
    const permalink = params['*'].join('/')
    const doc = await docService.retrieveLlmPath(permalink)
    return response.download(doc)
  }
}
