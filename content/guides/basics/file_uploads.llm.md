# File Uploads

AdonisJS has built-in support for parsing multipart requests and processing file uploads through its bodyparser.

## Basic File Upload

Create form with `enctype="multipart/form-data"`:
```edge
@form({ route: 'profile_avatar.update', enctype: 'multipart/form-data' })
  @field.root({ name: 'avatar' })
    @!input.control({ type: 'file' })
    @!field.label({ text: 'Upload new avatar' })
  @end
  @!button({ type: 'Submit', text: 'Update Avatar' })
@end
```

Access uploaded file in controller:
```typescript
import { HttpContext } from '@adonisjs/core/http'

export default class ProfileAvatarController {
  async update({ request, response }: HttpContext) {
    const avatar = request.file('avatar')

    if (!avatar) {
      return response.badRequest('Please upload an avatar image')
    }

    // File properties: tmpPath, clientName, size, extname, type
    console.log(avatar)
    return 'Avatar uploaded successfully'
  }
}
```

## Validating Files

### Inline Validation

```typescript
const avatar = request.file('avatar', {
  size: '2mb',
  extnames: ['jpg', 'png', 'jpeg']
})

if (!avatar || avatar.hasErrors) {
  return response.badRequest(avatar?.errors)
}
```

### VineJS Validation (Recommended)

Create validator:
```typescript
import vine from '@vinejs/vine'

export const updateAvatarValidator = vine.create({
  avatar: vine.file({
    size: '2mb',
    extnames: ['jpg', 'png', 'jpeg']
  })
})
```

Use in controller:
```typescript
import { updateAvatarValidator } from '#validators/user'

export default class ProfileAvatarController {
  async update({ request }: HttpContext) {
    const payload = await request.validateUsing(updateAvatarValidator)
    console.log(payload.avatar)
    return 'Avatar uploaded and validated successfully'
  }
}
```

AdonisJS uses magic number detection to validate file types. Even if someone renames `.exe` to `.jpg`, it will detect actual file type and reject it.

## Permanent Storage

Install FlyDrive:
```bash
node ace add @adonisjs/drive
```

Move file to permanent storage:
```typescript
import { updateAvatarValidator } from '#validators/user'
import string from '@adonisjs/core/helpers/string'

export default class ProfileAvatarController {
  async update({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(updateAvatarValidator)

    const fileName = `${string.uuid()}.${payload.avatar.extname}`
    await payload.avatar.moveToDisk(fileName)

    const user = auth.getUserOrFail()
    user.avatarFileName = fileName
    await user.save()

    return 'Avatar uploaded and saved successfully'
  }
}
```

Access uploaded files in templates:
```edge
<img src="{{ await driveUrl(user.avatarFileName) }}" alt="User avatar">
```

Built-in file server serves files at `/uploads/` prefix.

## Multiple Files

Accept multiple files:
```edge
@form({ route: 'projects.documents.store', enctype: 'multipart/form-data' })
  @field.root({ name: 'documents[]' })
    @!input.control({ type: 'file', multiple: true })
  @end
  <button type="submit">Upload Documents</button>
@end
```

Validate array of files:
```typescript
export const uploadDocumentsValidator = vine.compile(
  vine.object({
    documents: vine.array(
      vine.file({
        size: '5mb',
        extnames: ['pdf', 'doc', 'docx', 'txt']
      })
    )
  })
)
```

Process multiple files:
```typescript
async store({ request }: HttpContext) {
  const payload = await request.validateUsing(uploadDocumentsValidator)
  const fileNames: string[] = []

  for (const document of payload.documents) {
    const fileName = `${string.uuid()}.${document.extname}`
    await document.moveToDisk(fileName)
    fileNames.push(fileName)
  }

  return { message: 'Documents uploaded', count: fileNames.length }
}
```

## Direct Uploads

Upload directly from browser to cloud storage (S3, R2, GCS), bypassing your server.

Generate signed upload URL:
```typescript
import drive from '@adonisjs/drive/services/main'

router.post('/signed-upload-url', async ({ request }) => {
  const fileName = request.input('file_name')

  const url = await drive.use('r2').getSignedUploadUrl(fileName, {
    expiresIn: '30 mins'
  })

  return { signedUrl: url }
})
```

Client-side upload:
```javascript
async function uploadFile(file) {
  // Step 1: Get signed URL
  const response = await fetch('/signed-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: file.name })
  })

  const { signedUrl } = await response.json()

  // Step 2: Upload to cloud storage
  await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  })
}
```

## Security

Restrict file uploads to specific routes:
```typescript
// config/bodyparser.ts
export default defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  multipart: {
    enabled: ['/profile/avatar', '/users/:id', '/projects/:id/files']
  }
})
```

Apply rate limiting to public upload endpoints.
