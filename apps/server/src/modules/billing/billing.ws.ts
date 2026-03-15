import { auth } from "@agenda-genz/auth";
import { Elysia, t } from "elysia";
import type { ElysiaWS } from "elysia/ws";

interface BillingSocketData {
  headers: Record<string, string | undefined>;
  userId?: string;
}

type BillingSocket = ElysiaWS<BillingSocketData>;

const connectedClients = new Map<string, Set<BillingSocket>>();

function buildHeaders(headersMap: Record<string, string | undefined>): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(headersMap)) {
    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  return headers;
}

export function notifyPaymentApproved(
  userId: string,
  data: { paymentId: string; planExpiresAt: string },
) {
  const sockets = connectedClients.get(userId);
  if (!sockets) return;
  for (const ws of sockets) {
    try {
      ws.send(
        JSON.stringify({
          type: "payment_approved",
          paymentId: data.paymentId,
          planExpiresAt: data.planExpiresAt,
        }),
      );
    } catch {
      // Socket may have closed
    }
  }
}

export const billingWs = new Elysia().ws("/ws/billing", {
  async open(ws: BillingSocket) {
    // Authenticate via cookie from upgrade request headers
    const session = await auth.api.getSession({
      headers: buildHeaders(ws.data.headers),
    });

    if (!session?.user?.id) {
      ws.close(4001, "Unauthorized");
      return;
    }

    const userId = session.user.id;
    ws.data.userId = userId;

    if (!connectedClients.has(userId)) {
      connectedClients.set(userId, new Set());
    }
    connectedClients.get(userId)!.add(ws);
  },

  message(ws: BillingSocket, message) {
    // Client can send "ping" to keep alive
    if (message === "ping") {
      ws.send("pong");
    }
  },

  close(ws: BillingSocket) {
    const userId = ws.data.userId;
    if (userId) {
      connectedClients.get(userId)?.delete(ws);
      if (connectedClients.get(userId)?.size === 0) {
        connectedClients.delete(userId);
      }
    }
  },

  body: t.String(),
});
