import edge from 'edge.js'
import { dirname } from 'node:path'
import { Vite } from '@adonisjs/vite'
import { inject } from '@adonisjs/core'
import { Router } from '@adonisjs/core/http'
import { type Infer } from '@vinejs/vine/types'
import { BaseCommand } from '@adonisjs/core/ace'
import { type singleDoc } from '#collections/docs'
import { mkdir, writeFile } from 'node:fs/promises'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { RequestFactory } from '@adonisjs/core/factories/http'

export default class CompileDocs extends BaseCommand {
  static commandName = 'compile:docs'
  static description = 'Compile docs to static HTML files'

  static options: CommandOptions = {
    startApp: true,
  }

  async #compileDoc(doc: Infer<typeof singleDoc>) {
    const { DocService } = await import('#services/doc_service')
    const docsService = await this.app.container.make(DocService)
    const request = new RequestFactory().create()
    request.request.url = `/${doc.permalink}`

    const html = await docsService.renderDoc(
      doc.permalink,
      edge.share({
        request,
      })
    )

    const outputPath = this.app.makePath('build/public', `${doc.permalink}.html`)
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, html)
  }

  @inject()
  async prepare(vite: Vite, router: Router) {
    router.commit()
    await vite.createDevServer()
  }

  @inject()
  async completed(vite: Vite) {
    await vite.stopDevServer()
  }

  async run() {
    const { docsSections } = await import('#collections/docs')
    const guides = await docsSections.guides.load()
    const start = await docsSections.start.load()
    const reference = await docsSections.reference.load()

    for (const group of [...guides.all(), ...start.all(), ...reference.all()]) {
      for (const doc of group.children) {
        const action = this.logger.action(`Compiling ${doc.permalink}`)
        try {
          await this.#compileDoc(doc)
          action.succeeded()
        } catch (error) {
          action.failed(error)
        }
      }
    }
  }
}
