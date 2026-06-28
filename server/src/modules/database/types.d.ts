import type { ObjectId, WithId } from 'mongodb';

export type TokenSites = 'pixiv' | 'deviantart';

export type SiteTokensIds = WithId<{ id: TokenSites }>;

export type PixivTokens = SiteTokensIds & { id: 'pixiv', token: string };
// export type DeviantArtTokens = SiteTokensIds & { id: 'deviantart', accessToken: string, refreshToken: string, expiresAt: Date };

export type SiteTokens = PixivTokens | DeviantArtTokens;