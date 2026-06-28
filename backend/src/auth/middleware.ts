import { Request, Response, NextFunction } from 'express';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { config, settings } from '../config';
import { prisma } from '../db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    clerkUserId: string;
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
  };
}

const DEV_USER_CLERK_ID = 'dev-mode-user';
const DEV_USER_EMAIL = 'dev@example.com';

const clerkClient = createClerkClient({ secretKey: config.CLERK_SECRET_KEY });

async function getOrCreateUser(clerkUserId: string, email: string, fullName?: string | null, avatarUrl?: string | null) {
  let user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkUserId,
        email,
        fullName,
        avatarUrl,
      },
    });
    // Initialize default settings for the user
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        theme: 'dark',
        preferredLlmProvider: 'gemini',
      },
    });
  } else if (user.email.includes("@unknown.clerk") && !email.includes("@unknown.clerk")) {
    // Automatically update database record once the actual email is retrieved
    user = await prisma.user.update({
      where: { clerkUserId },
      data: {
        email,
        fullName: fullName || user.fullName,
        avatarUrl: avatarUrl || user.avatarUrl,
      },
    });
  }
  return user;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!settings.authConfigured) {
      if (config.NODE_ENV === 'production') {
        return res.status(500).json({
          error: 'Clerk auth is not configured. Set CLERK_SECRET_KEY, CLERK_JWKS_URL, and CLERK_ISSUER in production.',
        });
      }
      // Fallback to dev user
      const devUser = await getOrCreateUser(DEV_USER_CLERK_ID, DEV_USER_EMAIL, 'Dev User');
      req.user = devUser;
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify Clerk token using Clerk backend
    const payload = await verifyToken(token, {
      secretKey: config.CLERK_SECRET_KEY,
      issuer: config.CLERK_ISSUER,
    } as any);

    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Token missing subject claim' });
    }

    let email = `${clerkUserId}@unknown.clerk`;
    let fullName = (payload as any).name || null;
    let avatarUrl = (payload as any).picture || null;

    // Fetch real email and user profile info directly from Clerk API
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const primaryEmail = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

      if (primaryEmail) {
        email = primaryEmail;
      }
      if (clerkUser.firstName || clerkUser.lastName) {
        fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ');
      }
      if (clerkUser.imageUrl) {
        avatarUrl = clerkUser.imageUrl;
      }
    } catch (clerkErr) {
      console.warn('Failed to fetch user details from Clerk API, using claims fallback:', clerkErr);
      if ((payload as any).email) {
        email = (payload as any).email;
      }
    }

    const user = await getOrCreateUser(clerkUserId, email, fullName, avatarUrl);
    req.user = user;
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: error.message || 'Unauthorized' });
  }
}
