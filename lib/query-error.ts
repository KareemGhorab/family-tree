export function getQueryErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (data && typeof data === "object" && "error" in data) {
      const msg = (data as { error: unknown }).error;
      if (typeof msg === "string") return msg;
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
