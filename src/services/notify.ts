import { MessagePlugin } from 'tdesign-react';

type Msg = string;

function callSafely(fn: ((m: Msg) => any) | undefined, msg: Msg, fallback?: (m: Msg) => void) {
  try {
    if (typeof fn === 'function') {
      fn(msg);
      return;
    }
    throw new Error('MessagePlugin function unavailable');
  } catch (e) {
    if (fallback) fallback(msg);
    else console.log('[notify]', msg);
  }
}

export const notify = {
  success: (msg: Msg) => callSafely(MessagePlugin?.success as any, msg, (m) => console.log(m)),
  error: (msg: Msg) => callSafely(MessagePlugin?.error as any, msg, (m) => alert(m)),
  warning: (msg: Msg) => callSafely(MessagePlugin?.warning as any, msg, (m) => console.warn(m)),
  info: (msg: Msg) => callSafely(MessagePlugin?.info as any, msg, (m) => console.log(m)),
};