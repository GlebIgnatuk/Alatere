import crypto from 'crypto'

export function generateAssymetricKeyPair() {
  const keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  }
}

export function encryptAssymmetric(data: string, publicKey: string) {
  const buffer = Buffer.from(data, 'utf8')

  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer,
  )

  return encrypted.toString('base64')
}

export function decryptAssymmetric(privateKey: string, data: string) {
  const buffer = Buffer.from(data, 'base64')

  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer,
  )

  return decrypted.toString('utf8')
}
