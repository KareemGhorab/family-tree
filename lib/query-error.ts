export function getQueryErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      const msg = d.error ?? d.message;
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
