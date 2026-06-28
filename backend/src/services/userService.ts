import { prisma } from '../db';

export async function getOrCreateSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
        theme: 'dark',
        preferredLlmProvider: 'gemini',
      },
    });
  }

  return settings;
}

export async function updateSettings(
  userId: string,
  params: {
    theme?: string;
    preferredLlmProvider?: string | null;
    emailNotifications?: boolean;
  }
) {
  // Ensure row exists
  await getOrCreateSettings(userId);

  return prisma.userSettings.update({
    where: { userId },
    data: {
      theme: params.theme,
      preferredLlmProvider: params.preferredLlmProvider,
      emailNotifications: params.emailNotifications,
    },
  });
}

export async function listSavedCompanies(userId: string) {
  return prisma.savedCompany.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}


export async function listSavedCompanyBookmarks(userId: string) {
  const [savedCompanies, favoriteReports] = await Promise.all([
    prisma.savedCompany.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.report.findMany({
      where: { userId, isFavorite: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        ticker: true,
        createdAt: true,
      },
    }),
  ]);

  const seen = new Set<string>();
  const bookmarks: Array<{
    id: string;
    companyName: string;
    ticker: string | null;
    notes: string | null;
    createdAt: Date;
    source: 'manual' | 'report';
  }> = [];

  for (const company of savedCompanies) {
    const key = `${company.companyName.trim().toLowerCase()}|${company.ticker?.trim().toLowerCase() || ''}`;
    seen.add(key);
    bookmarks.push({ ...company, source: 'manual' });
  }

  for (const report of favoriteReports) {
    const key = `${report.companyName.trim().toLowerCase()}|${report.ticker?.trim().toLowerCase() || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    bookmarks.push({
      id: `report:${report.id}`,
      companyName: report.companyName,
      ticker: report.ticker,
      notes: 'Saved from report',
      createdAt: report.createdAt,
      source: 'report',
    });
  }

  return bookmarks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
export async function addSavedCompany(
  userId: string,
  companyName: string,
  ticker?: string | null,
  notes?: string | null
) {
  return prisma.savedCompany.create({
    data: {
      userId,
      companyName,
      ticker: ticker || null,
      notes: notes || null,
    },
  });
}

export async function removeSavedCompany(savedCompanyId: string, userId: string) {
  const saved = await prisma.savedCompany.findFirst({
    where: { id: savedCompanyId, userId },
  });

  if (!saved) {
    return false;
  }

  await prisma.savedCompany.delete({
    where: { id: savedCompanyId },
  });

  return true;
}


export async function removeSavedCompanyBookmark(savedCompanyId: string, userId: string) {
  if (savedCompanyId.startsWith('report:')) {
    const reportId = savedCompanyId.replace('report:', '');
    const report = await prisma.report.findFirst({
      where: { id: reportId, userId },
    });

    if (!report) return false;

    await prisma.report.update({
      where: { id: reportId },
      data: { isFavorite: false },
    });
    return true;
  }

  return removeSavedCompany(savedCompanyId, userId);
}
export async function getApiUsageSummary(userId: string) {
  // Find distinct providers
  const logs = await prisma.apiLog.findMany({
    where: { userId },
    select: { provider: true },
    distinct: ['provider'],
  });

  const providers = logs.map(l => l.provider);
  const summaries = [];

  for (const provider of providers) {
    const total = await prisma.apiLog.count({
      where: { userId, provider },
    });

    const success = await prisma.apiLog.count({
      where: { userId, provider, success: true },
    });

    const avgRes = await prisma.apiLog.aggregate({
      where: { userId, provider, latencyMs: { not: null } },
      _avg: {
        latencyMs: true,
      },
    });

    const avgLatency = avgRes._avg.latencyMs;

    summaries.push({
      provider,
      total_calls: total,
      success_count: success,
      failure_count: total - success,
      avg_latency_ms: avgLatency ? Math.round(avgLatency * 10) / 10 : null,
    });
  }

  return summaries;
}
