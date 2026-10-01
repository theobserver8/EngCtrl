import type { ApiError } from "../api/client";
import type { Messages } from "../i18n/locales/en";

/** Maps an API error to a translated, user-facing message (backend messages are never shown raw). */
export function getErrorMessage(error: ApiError, messages: Messages["errors"]): string {
  if (error.isNetworkError) return messages.network;
  if (error.status === 404) return messages.notFound;
  if (error.status === 422) return messages.validation;
  if (error.status >= 500) return messages.server;
  return messages.generic;
}
