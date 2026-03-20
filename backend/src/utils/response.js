// 统一响应格式
export function success(data = null, message = 'success') {
  return {
    code: 0,
    message,
    data
  }
}

export function error(code = 500, message = 'Internal Server Error') {
  return {
    code,
    message,
    data: null
  }
}

// 错误码
export const ErrorCodes = {
  PARAM_ERROR: 1001,
  NOT_LOGIN: 1002,
  NO_PERMISSION: 1003,
  USER_NOT_FOUND: 2001,
  FAMILY_NOT_FOUND: 2002,
  GOAL_NOT_FOUND: 3001,
  TASK_NOT_FOUND: 3002,
  STAR_NOT_ENOUGH: 3003
}
