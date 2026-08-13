import MastodonSourceChecker from './Mastodon';

export default class PawbSourceChecker extends MastodonSourceChecker {
  constructor() {
    super('Pawb', 'pawb', [
      /^https?:\/\/(?:www\.)?pawb\.fun\/@.*\/(\d+).*/,
    ]);
  }
}