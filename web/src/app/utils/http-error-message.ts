type ErrorRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === 'object' && value !== null;
}

export function getHttpErrorMessage(
  error: unknown,
  responseField: 'message' | 'detail',
  fallback: string
): string {
  if (!isRecord(error)) {
    return fallback;
  }

  const response = isRecord(error['response']) ? error['response'] : null;
  const responseData = response && isRecord(response['data']) ? response['data'] : null;
  const responseMessage = responseData?.[responseField];
  if (typeof responseMessage === 'string' && responseMessage) {
    return responseMessage;
  }

  const errorMessage = error['message'];
  return typeof errorMessage === 'string' && errorMessage ? errorMessage : fallback;
}