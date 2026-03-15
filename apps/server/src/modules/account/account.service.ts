import prisma from "@agenda-genz/db";
import { status } from "elysia";
import { Errors } from "../../shared/constants/errors";
import { UploadService } from "../uploads/upload.service";

export abstract class AccountService {
  static async delete(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw status(
        Errors.AUTH.UNAUTHORIZED.httpStatus,
        Errors.AUTH.UNAUTHORIZED.message,
      );
    }

    // Remove user media first so we don't leave orphaned files behind.
    await UploadService.deleteAllUserObjects(userId);

    await prisma.verification.deleteMany({ where: { identifier: user.email } });
    await prisma.user.delete({ where: { id: userId } });
    // Client, Service, TimeSlot, Appointment are cascade-deleted by the DB.
    // BillingPayment.userId is set to null (SetNull) for dashboard history.
  }
}
