import MastodonSourceChecker from './Mastodon';

export default class PawooSourceChecker extends MastodonSourceChecker {
  constructor() {
    super('Pawoo', 'pawoo', [
      /^https?:\/\/(?:www\.)?pawoo\.net\/@.*\/(\d+).*/,
    ]);
  }
}