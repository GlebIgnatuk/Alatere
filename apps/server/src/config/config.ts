export const mustGetEnv = (name: string) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const shouldGetEnv = (name: string, defaultValue: string) => {
  return process.env[name] ?? defaultValue
}

export const getEnv = (name: string, defaultValue?: string) => {
  return process.env[name] ?? defaultValue ?? null
}
