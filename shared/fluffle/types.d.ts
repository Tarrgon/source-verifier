export type FluffleAuthor = {
  id: string
  name: string
}

export type FluffleThumbnail = {
  width: number
  centerX: number
  height: number
  centerY: number
  url: string
}

export type FluffleResult = {
  id: string
  distance: number
  match: 'exact' | 'probable' | 'unlikely'
  platform: string
  url: string
  isSfw: boolean
  thumbnail: FluffleThumbnail | null
  authors: FluffleAuthor[]
}

export type FluffleResponse = {
  id: string
  results: FluffleResult[]
}

export type FluffleError = {
  code: string | null
  message: strring
}

export type FluffleErrorResponse = {
  errors: FluffleError[]
}