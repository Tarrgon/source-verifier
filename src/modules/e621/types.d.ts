import { Dimensions } from '../database';

export type E621Post = {
  id: number
  files: {
    meta: {
      md5: string
      ext: string
      size: number
    }
    original: {
      width: number
      height: number
    }
  }
  sources: string[]
  flags: {
    pending: boolean
    deleted: boolean
  },
  updated_at: string
}