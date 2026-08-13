import MastodonSourceChecker from './Mastodon';

export default class BaraagSourceChecker extends MastodonSourceChecker {
  constructor() {
    super('Baraag', 'baraag', [
      /^https?:\/\/(?:www\.)?baraag\.net\/@.*\/(\d+).*/,
    ]);
  }
}