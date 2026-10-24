export {
  MAX_RETRY_AFTER_SECONDS,
  parseRetryAfterSeconds,
  requestJson,
  requestText,
} from "./HttpClient";

export {
  ExternalHttpRequestError,
} from "@wooly/contracts/infrastructure/http/ExternalHttpTypes";

export type {
  ExternalHttpError,
  ExternalHttpErrorCode,
  ExternalRequestOptions,
  ExternalResult,
} from "@wooly/contracts/infrastructure/http/ExternalHttpTypes";
