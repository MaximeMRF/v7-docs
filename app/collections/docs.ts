import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import { Collection } from '@adonisjs/content'
import { type Infer } from '@vinejs/vine/types'
import { loaders } from '@adonisjs/content/loaders'

const singleDoc = vine.object({
  title: vine.string(),
  permalink: vine.string(),
  contentPath: vine.string().toAbsolutePath(),
})

const categoryDocs = vine.object({
  category: vine.string(),
  children: vine.array(singleDoc.clone()),
})

const menuSchema = vine.array(categoryDocs)
const ZONES = ['guides', 'start'] as const

export const docsZones = ZONES.reduce(
  (collections, zone) => {
    const ZONE_DB_FILE = app.makePath('content', zone, 'db.json')

    collections[zone] = Collection.create({
      schema: menuSchema.clone(),
      cache: app.inProduction,
      loader: loaders.jsonLoader(ZONE_DB_FILE),
      views: {
        tree(data) {
          return data.reduce<Record<string, Infer<typeof singleDoc>>>((result, node) => {
            node.children.forEach((doc) => {
              result[doc.permalink] = doc
            })
            return result
          }, {})
        },
        findByPermalink(data, permalink: string) {
          return this.tree(data)[permalink] ?? this.tree(data)[`/${permalink}`]
        },
      },
    })

    return collections
  },
  {} as {
    [K in 'guides' | 'start']: Collection<
      typeof menuSchema,
      {
        tree(data: Infer<typeof menuSchema>): Record<string, Infer<typeof singleDoc>>
        findByPermalink(
          data: Infer<typeof menuSchema>,
          permalink: string
        ): Infer<typeof singleDoc> | undefined
      }
    >
  }
)
