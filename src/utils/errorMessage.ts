/**
 * Utility functions for centralizing and standardizing all system error messages
 * into user-friendly, empathetic Vietnamese.
 */

export function formatErrorMessage(
  err: unknown,
  fallbackMessage: string = 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'
): string {
  if (!err) return fallbackMessage;

  let msg = '';
  if (typeof err === 'string') {
    msg = err;
  } else if (err instanceof Error) {
    msg = err.message;
  } else if (typeof err === 'object' && err !== null && 'message' in err) {
    msg = String((err as { message: unknown }).message);
  }

  if (!msg) return fallbackMessage;

  const m = msg.trim().toLowerCase();

  // 401 Unauthorized / Session expired
  if (
    m.includes('unauthorized') ||
    m.includes('401') ||
    m.includes('session expired') ||
    m.includes('phiên đăng nhập') ||
    m.includes('chưa đăng nhập') ||
    m.includes('token expired') ||
    m.includes('jwt expired')
  ) {
    return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại để tiếp tục sử dụng.';
  }

  // 403 Forbidden / Access denied
  if (
    m.includes('access denied') ||
    m.includes('forbidden') ||
    m.includes('403') ||
    m.includes('insufficient permissions') ||
    m.includes('không có quyền') ||
    m.includes('chỉ có quyền')
  ) {
    if (m.includes('chỉ có quyền') || m.includes('tác giả')) {
      return msg;
    }
    return 'Bạn không có quyền thực hiện thao tác này hoặc truy cập vào nội dung này.';
  }

  // 404 Not Found
  if (m.includes('not found') || m.includes('404') || m.includes('không tìm thấy')) {
    return 'Không tìm thấy dữ liệu yêu cầu hoặc tài nguyên này đã bị xóa.';
  }

  // 429 Too Many Requests / Rate limit
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('429') || m.includes('quá nhanh')) {
    return 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng chờ trong giây lát rồi thử lại.';
  }

  // Network / Connection errors
  if (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('network error') ||
    m.includes('connection refused') ||
    m.includes('econnrefused')
  ) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng của bạn.';
  }

  // 500 / 502 / 503 Server Error
  if (
    m.includes('500') ||
    m.includes('502') ||
    m.includes('503') ||
    m.includes('internal server error') ||
    m.includes('bad gateway')
  ) {
    return 'Máy chủ đang gặp sự cố gián đoạn tạm thời. Vui lòng thử lại sau ít phút.';
  }

  // Validation
  if (m.includes('validation failed') || m.includes('invalid argument') || m.includes('dữ liệu không hợp lệ')) {
    return 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại các thông tin đã nhập.';
  }

  // If already in friendly Vietnamese and doesn't contain raw HTTP codes, preserve it
  if (/[\u00C0-\u1EF9]/.test(msg) && !m.includes('http') && !m.includes('failed to fetch')) {
    return msg;
  }

  return fallbackMessage;
}

/**
 * Standard fetch response parser that handles JSON and extracts friendly Vietnamese error messages.
 */
export async function handleApiResponse<T>(response: Response, defaultErrorMsg: string): Promise<T> {
  if (!response.ok) {
    let errorData: { message?: string; errors?: Record<string, string> } | null = null;
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }

    const rawMessage = errorData?.message || `HTTP ${response.status}`;
    const formatted = formatErrorMessage(rawMessage, defaultErrorMsg);
    throw new Error(formatted);
  }

  if (response.status === 204) {
    return null as T;
  }

  return await response.json();
}
