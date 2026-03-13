import { auth } from "@agenda-genz/auth";
import { Elysia, t } from "elysia";

// In-memory map of userId → Set<ws>
const connectedClients = new Map<string, Set<any>>();

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
  async open(ws) {
    // Authenticate via cookie from upgrade request headers
    const headers = ws.data.headers as Record<string, string | undefined>;
    const session = await auth.api.getSession({
      headers: headers as any,
    });

    if (!session?.user?.id) {
      ws.close(4001, "Unauthorized");
      return;
    }

    const userId = session.user.id;
    (ws.data as any).userId = userId;

    if (!connectedClients.has(userId)) {
      connectedClients.set(userId, new Set());
    }
    connectedClients.get(userId)!.add(ws);
  },

  message(ws, message) {
    // Client can send "ping" to keep alive
    if (message === "ping") {
      ws.send("pong");
    }
  },

  close(ws) {
    const userId = (ws.data as any).userId as string | undefined;
    if (userId) {
      connectedClients.get(userId)?.delete(ws);
      if (connectedClients.get(userId)?.size === 0) {
        connectedClients.delete(userId);
      }
    }
  },

  body: t.String(),
});
