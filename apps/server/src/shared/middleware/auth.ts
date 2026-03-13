import { auth } from "@agenda-genz/auth";
import { Elysia } from "elysia";
import { Errors } from "../constants/errors";


// user middleware (compute user and session and pass to routes)
export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers
        })

        if (!session?.user?.id) {
          throw status(
            Errors.AUTH.UNAUTHORIZED.httpStatus,
            Errors.AUTH.UNAUTHORIZED.message,
          );
        }

        return { userId: session.user.id, user: session.user };
      }
    },
    planGuard: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers
        })

        if (!session?.user?.id) {
          throw status(
            Errors.AUTH.UNAUTHORIZED.httpStatus,
            Errors.AUTH.UNAUTHORIZED.message,
          );
        }

        const planExpiresAt = session.user.planExpiresAt
          ? new Date(session.user.planExpiresAt)
          : null;

        if (!planExpiresAt || planExpiresAt <= new Date()) {
          throw status(
            Errors.BILLING.PLAN_EXPIRED.httpStatus,
            Errors.BILLING.PLAN_EXPIRED.message,
          );
        }

        return { userId: session.user.id, user: session.user };
      }
    }
  })