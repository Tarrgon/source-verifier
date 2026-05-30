'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.api = exports.APIError = void 0;
const node_fetch_1 = __importDefault(require('node-fetch'));
const debug_1 = __importDefault(require('debug'));
const debug = (0, debug_1.default)('api');
/* TYPES */
class APIError extends Error {
  constructor(error_code, error_message) {
    super();
    this.error_code = error_code;
    this.error_message = error_message;
    this.message = `[${this.error_code}] - ${this.error_message}`;
  }
}
exports.APIError = APIError;
/**
 * Access the Inkbunny API directly
 * @docs https://wiki.inkbunny.net/wiki/API
 */
exports.api = {
  login: params => request('https://inkbunny.net/api_login.php', params),
  logout: params => request('https://inkbunny.net/api_logout.php', params),
  rating: params => request('https://inkbunny.net/api_userrating.php', params),
  search: params => request('https://inkbunny.net/api_search.php', params),
  searchRid: params => request('https://inkbunny.net/api_search.php', params),
  details: params => request('https://inkbunny.net/api_submissions.php', params),
};
exports.default = exports.api;
const request = async (url, params) => {
  // Filter parameters
  let keys = Object.keys(params);
  keys.forEach((k) => {
    if (params[k] === undefined) {
      delete params[k];
    }
  });
  // Construct query string
  keys = Object.keys(params);
  const queryString = keys.map(key => key + '=' + params[key]).join('&');
  // Send request
  let data;
  try {
    debug(`[FETCH] ${url}?output_mode=json&${queryString}`);
    const response = await (0, node_fetch_1.default)(`${url}?output_mode=json&${queryString}`, { method: 'POST' });
    const resText = await response.text();
    data = (resText.trim());
  } catch (error) {
    throw new APIError(-1, error.message);
  }
  // Throw custom error if request fails
  if (data.error_code) {
    throw new APIError(data.error_code, data.error_message);
  }
  return data;
};
