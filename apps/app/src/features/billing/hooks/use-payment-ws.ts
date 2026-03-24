import { authClient } from "@/lib/auth-client";
import { env } from "@agenda-genz/env/native";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import {
  createPaymentWsController,
  type PaymentWsSocket,
} from "../lib/payment-ws-controller";
import type { PaymentApprovedData } from "../lib/billing-ws-message";

interface UsePaymentWsOptions {
  paymentId: string | null;
  onPaymentApproved: (data: PaymentApprovedData) => void;
  onConnected?: () => void;
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

export function usePaymentWs({
  paymentId,
  onPaymentApproved,
  onConnected,
}: UsePaymentWsOptions) {
  const onPaymentApprovedRef = useRef(onPaymentApproved);
  const onConnectedRef = useRef(onConnected);
  const paymentIdRef = useRef(paymentId);
  const controllerRef = useRef<ReturnType<typeof createPaymentWsController> | null>(
    null,
  );
  onPaymentApprovedRef.current = onPaymentApproved;
  onConnectedRef.current = onConnected;
  paymentIdRef.current = paymentId;

  if (!controllerRef.current) {
    controllerRef.current = createPaymentWsController({
      getPaymentId: () => paymentIdRef.current,
      onPaymentApproved: (data) => onPaymentApprovedRef.current(data),
      onConnected: () => onConnectedRef.current?.(),
      createSocket: () => {
        const cookie = authClient.getCookie();
        const wsUrl =
          env.EXPO_PUBLIC_SERVER_URL.replace(/^http/, "ws") + "/ws/billing";
        const ReactNativeWebSocket: ReactNativeWebSocketConstructor =
          WebSocket;

        return (
          Platform.OS === "web"
            ? new WebSocket(wsUrl)
            : new ReactNativeWebSocket(
              wsUrl,
              undefined,
              cookie ? { headers: { Cookie: cookie } } : undefined,
            )
        ) as PaymentWsSocket;
      },
    });
  }

  useEffect(() => () => controllerRef.current?.disconnect(), []);

  return controllerRef.current;
}
