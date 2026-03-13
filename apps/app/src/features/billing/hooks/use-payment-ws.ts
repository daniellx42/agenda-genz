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

type ReactNativeWebSocketConstructor = {
  new(
    url: string,
    protocols?: string | string[] | null,
    options?: {
      headers?: Record<string, string>;
      [optionName: string]: unknown;
    } | null,
  ): WebSocket;
};

export function usePaymentWs({ onPaymentApproved }: UsePaymentWsOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onPaymentApprovedRef = useRef(onPaymentApproved);
  onPaymentApprovedRef.current = onPaymentApproved;

  const connect = useCallback(() => {
    const cookie = authClient.getCookie();
    const wsUrl =
      env.EXPO_PUBLIC_SERVER_URL.replace(/^http/, "ws") + "/ws/billing";
    // This is only a TypeScript assertion for React Native's extended constructor.
    const ReactNativeWebSocket =
      WebSocket as unknown as ReactNativeWebSocketConstructor;

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
        const msg = JSON.parse(event.data);
        if (msg.type === "payment_approved") {
          onPaymentApprovedRef.current(msg);
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
