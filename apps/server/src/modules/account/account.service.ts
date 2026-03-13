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

    // Remove user media first so we don't leave orphaned files behind if the
    // account deletion succeeds.
    await UploadService.deleteAllUserObjects(userId);

    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { userId } }),
      prisma.timeSlotException.deleteMany({ where: { userId } }),
      prisma.client.deleteMany({ where: { userId } }),
      prisma.service.deleteMany({ where: { userId } }),
      prisma.timeSlot.deleteMany({ where: { userId } }),
      prisma.verification.deleteMany({ where: { identifier: user.email } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
  }
}
