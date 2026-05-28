import { LoginResponse, SearchRequest, SearchResponse } from './api';
export declare class Helper {
  private username;
  private password;
  sid: string | undefined;
  private guestRating;
  /**
     * Inkbunny API Helper class
     *
     * Adds a few quality of life features for use with the api.
     * @docs Based on https://wiki.inkbunny.net/wiki/API
     */
  constructor();
  /**
     * Login using your Inkbunny credentials.
     * Please make sure that your account has the 'Enable API Access' option checked!
     *
     * Username and password can be omitted to use the api as guest user (not recommended).
     * @param [username] Your Inkbunny username
     * @param [password] Your Inkbunny password
     */
  login(username?: string, password?: string): Promise<LoginResponse & {
    rating: UserRating;
  }>;
  /**
     * Sign out to invalidate the current session.
     */
  logout(): Promise<import('./api').LogoutResponse>;
  /**
     * Update the user content rating (guest login only).
     * @param rating The new user rating
     */
  rating(rating: Partial<UserRating>): Promise<import('./api').RatingResponse>;
  /**
     * Search submissions based on various factors. All properties from the API are accessible.
     * @param params Request Parameters
     */
  search(params: Omit<SearchRequest, 'sid'>): Promise<SearchResponse & PageHelpers>;
  private searchRID;
  /**
     * Search submissions that contain certain tags.
     * @param tags Required tags
     * @param idsOnly Only return submission ids
     * @param page Request a certain page
     * @param submissionsPerPage Amount of submissions per page
     */
  searchTags(tags: string[], idsOnly?: boolean, page?: number, submissionsPerPage?: number): Promise<SearchResponse & PageHelpers>;
  /**
     * Access the full details about specified submissions.
     * @param ids Submissions ids to fetch
     * @param includeDescription Include the description
     * @param includePools Inlcude associated pools
     * @param includeWriting Inlcude writing (stories)
     */
  details(ids: string | string[], includeDescription?: boolean, includePools?: boolean, includeWriting?: boolean): Promise<import('./api').DetailsResponse>;
  private handleSID;
  private handleRID;
  private pagination;
}
export default Helper;
export interface PageHelpers {
  nextPage: () => Promise<SearchResponse & PageHelpers>;
  previousPage: () => Promise<SearchResponse & PageHelpers>;
}
export interface UserRating {
  nudity: boolean;
  violence: boolean;
  sexualThemes: boolean;
  strongViolence: boolean;
}
