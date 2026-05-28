'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
  Object.defineProperty(o, 'default', { enumerable: true, value: v });
}) : function(o, v) {
  o['default'] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.Helper = void 0;
const api_1 = __importStar(require('./api'));
const debug_1 = __importDefault(require('debug'));
const debug = (0, debug_1.default)('helper');
class Helper {
  /**
     * Inkbunny API Helper class
     *
     * Adds a few quality of life features for use with the api.
     * @docs Based on https://wiki.inkbunny.net/wiki/API
     */
  constructor() {
    // SID Error Handler - Refreshes the current session.
    this.handleSID = async () => {
      const response = await api_1.default.login({ username: this.username, password: this.password });
      this.sid = response.sid;
      // Readjust ratings if using guest
      if (this.username === 'guest' && this.guestRating) {
        await this.rating(this.guestRating);
      }
    };
    // RID Error Handler - Executes the orignial search instead.
    this.handleRID = (originalRequest) => {
      return async () => {
        return originalRequest;
      };
    };
    this.username = 'guest';
    this.password = '';
  }
  /**
     * Login using your Inkbunny credentials.
     * Please make sure that your account has the 'Enable API Access' option checked!
     *
     * Username and password can be omitted to use the api as guest user (not recommended).
     * @param [username] Your Inkbunny username
     * @param [password] Your Inkbunny password
     */
  async login(username = 'guest', password = '') {
    // Warn in guest mode
    if (username === 'guest') {
      console.warn('Using the API as guest user can be significantly slower! Use proper credentials instead!');
    } else {
      this.username = username;
      this.password = password;
    }
    // Send login request
    const response = await api_1.default.login({ username: this.username, password: this.password });
    this.sid = response.sid;
    // Parse rating
    const data = {
      ...response,
      rating: parseUserRating(response.ratingsmask),
    };
    return data;
  }
  /**
     * Sign out to invalidate the current session.
     */
  async logout() {
    const request = () => {
      return api_1.default.logout({
        sid: this.sid || '',
      });
    };
    const data = requestWithRetry(request, {
      2: this.handleSID,
    });
    // Invalidate session
    this.sid = undefined;
    this.username = '';
    this.password = '';
    this.guestRating = undefined;
    return data;
  }
  /**
     * Update the user content rating (guest login only).
     * @param rating The new user rating
     */
  async rating(rating) {
    const request = () => {
      return api_1.default.rating({
        sid: this.sid || '',
        'tag[2]': rating.nudity ? 'yes' : 'no',
        'tag[3]': rating.violence ? 'yes' : 'no',
        'tag[4]': rating.sexualThemes ? 'yes' : 'no',
        'tag[5]': rating.strongViolence ? 'yes' : 'no',
      });
    };
    const data = await requestWithRetry(request, {
      2: this.handleSID,
    });
    this.guestRating = rating;
    return data;
  }
  /**
     * Search submissions based on various factors. All properties from the API are accessible.
     * @param params Request Parameters
     */
  async search(params) {
    const request = () => {
      return api_1.default.search({
        sid: this.sid || '',
        ...params,
      });
    };
    const response = await requestWithRetry(request, {
      2: this.handleSID,
    });
    // Inject pagination functions
    const pageHelpers = this.pagination({
      sid: this.sid || '',
      ...params,
    }, response);
    const data = {
      ...response,
      ...pageHelpers,
    };
    return data;
  }
  async searchRID(request, params) {
    const r = () => {
      return api_1.default.searchRid({
        sid: this.sid || '',
        ...params,
      });
    };
    const response = await requestWithRetry(r, {
      2: this.handleSID,
    });
    // Inject pagination functions
    const pageHelpers = this.pagination({
      ...request,
      sid: this.sid || '',
    }, response);
    const data = {
      ...response,
      ...pageHelpers,
    };
    return data;
  }
  /**
     * Search submissions that contain certain tags.
     * @param tags Required tags
     * @param idsOnly Only return submission ids
     * @param page Request a certain page
     * @param submissionsPerPage Amount of submissions per page
     */
  async searchTags(tags, idsOnly = false, page = 1, submissionsPerPage = 30) {
    const params = {
      submission_ids_only: idsOnly ? 'yes' : 'no',
      submissions_per_page: submissionsPerPage,
      page,
      get_rid: 'yes',
      string_join_type: 'and',
      text: tags.map(t => t.replace(' ', '_')).join(','),
      keywords: 'yes',
    };
    const request = () => {
      return api_1.default.search({
        sid: this.sid || '',
        ...params,
      });
    };
    const response = await requestWithRetry(request, {
      2: this.handleSID,
    });
    // Inject pagination functions
    const pageHelpers = this.pagination({
      sid: this.sid || '',
      ...params,
    }, response);
    const data = {
      ...response,
      ...pageHelpers,
    };
    return data;
  }
  /**
     * Access the full details about specified submissions.
     * @param ids Submissions ids to fetch
     * @param includeDescription Include the description
     * @param includePools Inlcude associated pools
     * @param includeWriting Inlcude writing (stories)
     */
  async details(ids, includeDescription = false, includePools = false, includeWriting = false) {
    const request = () => {
      let idsString;
      if (Array.isArray(ids)) {
        idsString = ids.join(',');
      } else {
        idsString = ids;
      }
      return api_1.default.details({
        sid: this.sid || '',
        submission_ids: idsString,
        show_description: includeDescription ? 'yes' : 'no',
        show_description_bbcode_parsed: includeDescription ? 'yes' : 'no',
        show_pools: includePools ? 'yes' : 'no',
        show_writing: includeWriting ? 'yes' : 'no',
        show_writing_bbcode_parsed: includeWriting ? 'yes' : 'no',
        sort_keywords_by: 'alphabetical',
      });
    };
    return requestWithRetry(request, {
      2: this.handleSID,
    });
  }
  pagination(request, response) {
    const params = {
      get_rid: 'yes',
      rid: response.rid,
      keywords_list: request.keywords_list,
      no_submissions: request.no_submissions,
      submission_ids_only: request.submission_ids_only,
      submissions_per_page: request.submissions_per_page,
    };
    const pageHelpers = {
      /** Returns the next page of submissions. */
      nextPage: () => {
        const r = () => {
          if (params.rid === undefined) {
            throw new api_1.APIError(3, "Invalid Results ID sent as variable 'rid'. It contains invalid characters.");
          }
          return this.searchRID(request, {
            ...params,
            page: response.page ? response.page + 1 : undefined,
          });
        };
        const alt = () => {
          return this.search({
            ...request,
            page: response.page ? response.page + 1 : undefined,
          });
        };
        return requestWithRetry(r, {
          2: this.handleSID,
          3: this.handleRID(alt),
          4: this.handleRID(alt),
        });
      },
      /** Returns the previous page of submissions. */
      previousPage: () => {
        const r = () => {
          if (params.rid === undefined) {
            throw new api_1.APIError(3, "Invalid Results ID sent as variable 'rid'. It contains invalid characters.");
          }
          return this.searchRID(request, {
            ...params,
            page: response.page ? response.page - 1 : undefined,
          });
        };
        const alt = () => {
          return this.search({
            ...request,
            page: response.page ? response.page - 1 : undefined,
          });
        };
        return requestWithRetry(r, {
          2: this.handleSID,
          3: this.handleRID(alt),
          4: this.handleRID(alt),
        });
      },
    };
    return pageHelpers;
  }
}
exports.Helper = Helper;
exports.default = Helper;
const requestWithRetry = async (request, handlers, lastError) => {
  try {
    return await request();
  } catch (e) {
    // Typecast error
    let error;
    if ('error_code' in e && 'error_message' in e) {
      error = e;
    } else {
      throw e;
    }
    debug(`[${error.error_code}] - ${error.error_message}`);
    // Throw error if retry failed
    if (lastError === error.error_code) {
      throw e;
    }
    // Execute handler
    const handler = handlers[error.error_code];
    if (handler === undefined) {
      throw e;
    }
    const override = await handler();
    if (override === undefined) {
      return requestWithRetry(request, handlers, error.error_code);
    } else {
      return requestWithRetry(override, handlers, error.error_code);
    }
  }
};
function parseUserRating(mask) {
  mask = mask.padEnd(5, '0');
  const rating = {
    nudity: mask[1] === '1',
    violence: mask[2] === '1',
    sexualThemes: mask[3] === '1',
    strongViolence: mask[4] === '1',
  };
  return rating;
}
