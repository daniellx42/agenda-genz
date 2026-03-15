import { authClient } from "@/lib/auth-client";
import { env } from "@agenda-genz/env/native";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

interface PaymentApprovedData {
  paymentId: string;
  planExpiresAt: string;
}

interface UsePaymentWsOptions {
  onPaymentApproved: (data: PaymentApprovedData) => void;
}

interface ReactNativeWebSocketOptions {
  headers?: Record<string, string>;
  origin?: string;
  [optionName: string]:
    | string
    | number
    | boolean
    | Record<string, string>
    | undefined;
}

type ReactNativeWebSocketConstructor = {
  new(
    url: string,
    protocols?: string | string[],
    options?: ReactNativeWebSocketOptions | null,
  ): WebSocket;
};

interface PaymentApprovedMessage extends PaymentApprovedData {
  type: "payment_approved";
}

function isPaymentApprovedMessage(
  value: string | PaymentApprovedData | Record<string, string>,
): value is PaymentApprovedMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "payment_approved" &&
    "paymentId" in value &&
    typeof value.paymentId === "string" &&
    "planExpiresAt" in value &&
    typeof value.planExpiresAt === "string"
  );
}

export function usePaymentWs({ onPaymentApproved }: UsePaymentWsOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onPaymentApprovedRef = useRef(onPaymentApproved);
  onPaymentApprovedRef.current = onPaymentApproved;

  const connect = useCallback(() => {
    const cookie = authClient.getCookie();
    const wsUrl =
      env.EXPO_PUBLIC_SERVER_URL.replace(/^http/, "ws") + "/ws/billing";
    // This is only a TypeScript assertion for React Native's extended constructor.
    const ReactNativeWebSocket: ReactNativeWebSocketConstructor = WebSocket;

    const ws =
      Platform.OS === "web"
        ? new WebSocket(wsUrl)
        : new ReactNativeWebSocket(
          wsUrl,
          undefined,
          cookie ? { headers: { Cookie: cookie } } : undefined,
        );

    ws.onmessage = (event) => {
      try {
        const parsedMessage: string | PaymentApprovedData | Record<string, string> =
          JSON.parse(event.data);

        if (isPaymentApprovedMessage(parsedMessage)) {
          onPaymentApprovedRef.current(parsedMessage);
        }
      } catch {
        // Ignore invalid messages
      }
    };

    // Ping every 25s to keep alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 25_000);

    ws.onclose = () => clearInterval(pingInterval);
    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return { connect, disconnect };
}
