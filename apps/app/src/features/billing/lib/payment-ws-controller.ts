import {
  parsePaymentApprovedMessage,
  type PaymentApprovedData,
} from "./billing-ws-message";

export interface PaymentWsSocket {
  readyState: number;
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  send: (data: string) => void;
  close: () => void;
}

interface PaymentWsControllerOptions {
  getPaymentId: () => string | null;
  onPaymentApproved: (data: PaymentApprovedData) => void;
  onConnected?: () => void;
  createSocket: () => PaymentWsSocket;
  socketOpenState?: number;
  pingIntervalMs?: number;
  pongTimeoutMs?: number;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
}

export interface PaymentWsController {
  connect: () => void;
  disconnect: () => void;
}

export function createPaymentWsController({
  getPaymentId,
  onPaymentApproved,
  onConnected,
  createSocket,
  socketOpenState = WebSocket.OPEN,
  pingIntervalMs = 25_000,
  pongTimeoutMs = 10_000,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
}: PaymentWsControllerOptions): PaymentWsController {
  let socket: PaymentWsSocket | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let pongTimeout: ReturnType<typeof setTimeout> | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  let shouldReconnect = false;

  const clearSideEffects = () => {
    if (pingInterval) {
      clearIntervalFn(pingInterval);
      pingInterval = null;
    }

    if (pongTimeout) {
      clearTimeoutFn(pongTimeout);
      pongTimeout = null;
    }

    if (reconnectTimeout) {
      clearTimeoutFn(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  const scheduleReconnect = () => {
    if (!shouldReconnect || !getPaymentId() || reconnectTimeout) return;

    const attempt = reconnectAttempts;
    const delay = Math.min(1000 * 2 ** attempt, 10_000);
    reconnectAttempts += 1;

    reconnectTimeout = setTimeoutFn(() => {
      reconnectTimeout = null;
      if (!shouldReconnect || !getPaymentId()) return;
      socket = null;
      connect();
    }, delay);
  };

  const connect = () => {
    if (!getPaymentId()) return;

    shouldReconnect = true;
    clearSideEffects();

    if (socket?.readyState === socketOpenState) {
      onConnected?.();
      return;
    }

    socket?.close();
    socket = createSocket();

    socket.onopen = () => {
      reconnectAttempts = 0;
      pingInterval = setIntervalFn(() => {
        if (!socket || socket.readyState !== socketOpenState) return;

        if (pongTimeout) {
          socket.close();
          return;
        }

        socket.send("ping");
        pongTimeout = setTimeoutFn(() => {
          pongTimeout = null;
          if (socket?.readyState === socketOpenState) {
            socket.close();
          }
        }, pongTimeoutMs);
      }, pingIntervalMs);

      onConnected?.();
    };

    socket.onmessage = (event) => {
      if (String(event.data) === "pong") {
        if (pongTimeout) {
          clearTimeoutFn(pongTimeout);
          pongTimeout = null;
        }
        return;
      }

      const parsedMessage = parsePaymentApprovedMessage(String(event.data));
      if (parsedMessage && parsedMessage.paymentId === getPaymentId()) {
        onPaymentApproved(parsedMessage);
      }
    };

    socket.onerror = () => {
      socket?.close();
    };

    socket.onclose = () => {
      clearSideEffects();
      socket = null;
      scheduleReconnect();
    };
  };

  const disconnect = () => {
    shouldReconnect = false;
    reconnectAttempts = 0;
    clearSideEffects();
    socket?.close();
    socket = null;
  };

  return { connect, disconnect };
}
