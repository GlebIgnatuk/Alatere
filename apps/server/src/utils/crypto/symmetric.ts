import crypto from 'crypto'

export function generateSymmetricKey() {
  return crypto.randomBytes(32).toString('base64')
}

export function encryptSymmetric(key: string, data: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), iv)

  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])

  const tag = cipher.getAuthTag()

  return {
    iv: iv.toString('base64'),
    content: encrypted.toString('base64'),
    tag: tag.toString('base64'),
    fullchain: `${iv.toString('base64')}:${encrypted.toString('base64')}:${tag.toString('base64')}`,
  }
}

export function decryptSymmetric(key: string, data: string | { iv: string; content: string; tag: string }) {
  let iv: string, content: string, tag: string
  if (typeof data === 'string') {
    ;[iv, content, tag] = data.split(':')
  } else {
    iv = data.iv
    content = data.content
    tag = data.tag
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))

  decipher.setAuthTag(Buffer.from(tag, 'base64'))

  const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'base64')), decipher.final()])

  return decrypted.toString('utf8')
}
