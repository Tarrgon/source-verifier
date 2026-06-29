import type { Dimensions } from './types.d';

export type SourceDataMap = { [source: string]: SourceData | ScoredSourceData };

export type BaseSourceData = {
  _id: number
  date?: Date
  sources?: SourceDataMap
}

export type SourceData = {
  md5Match?: boolean
  unsupported?: boolean
  unknown?: boolean
  error?: boolean
  dimensionMatch?: boolean
  fileTypeMatch?: boolean
  fileType?: string
  phash?: string
  phashDistance?: number
  url?: string
  originalUrl?: string
  dimensions?: Dimensions
  isPreview?: boolean
  authors?: string[]
}

export type ScoredSourceData = SourceData & { score?: number };

export type DatabasePost = {
  _id: number
  sources: string[]
  isPending: boolean
  isDeleted: boolean
  md5: string
  dimensions: Dimensions
  fileType: string
  fileSize: number
  updatedAt: Date
  phash?: string
}

export type MainSchema = {
  latestId: number
}