import { getCurrentUser } from '@/lib/auth';
import { successResponse, unauthorizedError } from '@/lib/errors';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedError();
  }

  return successResponse({
    id: user.userId,
    email: user.email,
  });
}
