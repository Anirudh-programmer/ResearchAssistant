import { prisma } from '../db';
import { investmentResearchGraph } from '../agents/graph';
import { getLLMProviderName } from '../llm';
import nodemailer from 'nodemailer';
import { config } from '../config';

function getEmailHtmlTemplate(report: any, user: any) {
  const isInvest = report.verdict === 'INVEST';
  const badgeBg = isInvest ? '#143d31' : '#3d2620';
  const badgeBorder = isInvest ? '#1b7a5c' : '#a8432f';
  const badgeColor = isInvest ? '#4ade80' : '#f87171';
  const verdictText = report.verdict || 'PENDING';

  const investmentScore = report.investmentScore || 0;
  const confidenceScore = report.confidenceScore || 0;
  const reportUrl = `${config.FRONTEND_ORIGIN}/report/${report.id}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verdict Ready</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#0a0b0d; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0a0b0d; padding:40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background-color:#14161a; border:1px solid #2a2d33; border-radius:10px; border-collapse:separate; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#1b1e23; border-bottom:1px solid #2a2d33; padding:20px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="font-family:'Fraunces', Georgia, serif; font-size:24px; font-weight:bold; color:#f0f0ec; letter-spacing:-0.5px;">Verdict</span>
                    <span style="font-size:11px; font-family:'IBM Plex Mono', monospace; color:#4f7a9e; vertical-align:super; margin-left:6px; letter-spacing:1px; text-transform:uppercase;">AI Research</span>
                  </td>
                  <td align="right" style="font-family:'IBM Plex Mono', monospace; font-size:12px; color:#9a9da5;">
                    ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="margin:0 0 16px; font-size:16px; line-height:24px; color:#f0f0ec;">
                Hi <strong>${user.fullName || 'User'}</strong>,
              </p>
              <p style="margin:0 0 30px; font-size:16px; line-height:24px; color:#9a9da5;">
                Your AI investment analysis for <strong>${report.companyName}</strong> is complete. Here is the structured verdict:
              </p>
              
              <!-- Verdict Stamp Container -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:35px;">
                <tr>
                  <td align="center" style="background-color:#1b1e23; border:1px solid #2a2d33; border-radius:8px; padding:30px 20px;">
                    <div style="font-size:12px; text-transform:uppercase; color:#9a9da5; letter-spacing:1.5px; margin-bottom:10px; font-family:'IBM Plex Mono', monospace;">Verdict Outcome</div>
                    <div style="display:inline-block; padding:12px 35px; background-color:${badgeBg}; border:2px solid ${badgeBorder}; border-radius:6px; color:${badgeColor}; font-size:26px; font-weight:900; letter-spacing:3px; text-transform:uppercase; font-family:'IBM Plex Mono', monospace; text-shadow:0 0 8px ${badgeBorder}40;">
                      ${verdictText}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Scores Table -->
              <h3 style="margin:0 0 15px; font-size:14px; text-transform:uppercase; color:#9a9da5; letter-spacing:1px; font-family:'IBM Plex Mono', monospace; border-bottom:1px solid #2a2d33; padding-bottom:8px;">Metrics & Scores</h3>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:35px;">
                <!-- Investment Score -->
                <tr>
                  <td style="padding:10px 0 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left" style="font-size:15px; font-weight:bold; color:#f0f0ec;">Investment Score</td>
                        <td align="right" style="font-size:15px; font-weight:bold; color:#f0f0ec; font-family:'IBM Plex Mono', monospace;">${investmentScore}/100</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:8px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#2a2d33; border-radius:3px; height:6px;">
                            <tr>
                              <td style="background-color:#4f7a9e; width:${investmentScore}%; border-radius:3px; height:6px; font-size:0; line-height:0;">&nbsp;</td>
                              <td style="width:${100 - investmentScore}%; font-size:0; line-height:0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Confidence Score -->
                <tr>
                  <td style="padding:10px 0 10px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left" style="font-size:15px; font-weight:bold; color:#f0f0ec;">Confidence Score</td>
                        <td align="right" style="font-size:15px; font-weight:bold; color:#f0f0ec; font-family:'IBM Plex Mono', monospace;">${confidenceScore}/100</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:8px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#2a2d33; border-radius:3px; height:6px;">
                            <tr>
                              <td style="background-color:#4f7a9e; width:${confidenceScore}%; border-radius:3px; height:6px; font-size:0; line-height:0;">&nbsp;</td>
                              <td style="width:${100 - confidenceScore}%; font-size:0; line-height:0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;">
                <tr>
                  <td align="center">
                    <a href="${reportUrl}" target="_blank" style="display:inline-block; background-color:#4f7a9e; color:#f0f0ec; font-weight:bold; font-size:16px; text-decoration:none; padding:14px 40px; border-radius:6px; box-shadow:0 4px 10px rgba(79, 122, 158, 0.3); border:1px solid #6392b8;">
                      Read Full Report
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#1b1e23; border-top:1px solid #2a2d33; padding:25px 30px; font-family:'IBM Plex Mono', monospace; font-size:12px; color:#5d6168;">
              <p style="margin:0 0 8px; line-height:16px; color:#9a9da5;">This is an automated report summary from Verdict AI.</p>
              <p style="margin:0; line-height:16px;">Verdict AI Inc. &bull; Terminal-Density Investment Insights</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export async function sendReportEmail(report: any, userId: string) {
  try {
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });
    if (userSettings?.emailNotifications) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.email) {
        if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
          const mailOptions = {
            from: config.SMTP_FROM || config.SMTP_USER,
            to: user.email,
            subject: `Verdict Ready: ${report.companyName} (${report.ticker || 'N/A'})`,
            text: `Hi ${user.fullName || 'User'},\n\nYour AI investment analysis for ${report.companyName} is complete.\n\nVerdict: ${report.verdict}\nScore: ${report.investmentScore}/100\nConfidence Score: ${report.confidenceScore}/100\n\nRead the full report at: ${config.FRONTEND_ORIGIN}/report/${report.id}\n\nBest regards,\nVerdict AI Team`,
            html: getEmailHtmlTemplate(report, user),
          };

          // If in production on Render, standard SMTP ports are blocked, so relay through Vercel's serverless function
          if (config.NODE_ENV === 'production' && config.FRONTEND_ORIGIN.startsWith('https://')) {
            console.log(`📧 [EMAIL NOTIFICATION] Production detected. Relaying email via Vercel Serverless Function...`);
            try {
              const response = await fetch(`${config.FRONTEND_ORIGIN}/api/send-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  secret: config.SECRET_KEY,
                  to: mailOptions.to,
                  subject: mailOptions.subject,
                  text: mailOptions.text,
                  html: mailOptions.html,
                }),
              });
              if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`Vercel email relay failed: ${response.status} - ${errBody}`);
              }
              console.log(`📧 [SMTP EMAIL SENT] Real HTML email relayed successfully via Vercel for ${report.companyName}`);
            } catch (relayErr) {
              console.error('📧 [SMTP EMAIL ERROR] Vercel relay failed, attempting direct SMTP fallback:', relayErr);
              await sendDirectSmtp(mailOptions);
            }
          } else {
            // Local dev mode: send via direct SMTP
            await sendDirectSmtp(mailOptions);
          }

          async function sendDirectSmtp(options: typeof mailOptions) {
            const transporter = nodemailer.createTransport({
              host: config.SMTP_HOST,
              port: config.SMTP_PORT || 587,
              secure: config.SMTP_PORT === 465,
              auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
              },
            });
            await transporter.sendMail(options);
            console.log(`📧 [SMTP EMAIL SENT] Direct SMTP email sent to ${options.to} for ${report.companyName}`);
          }
        } else {
          console.log(`\n============================================================`);
          console.log(`📧 [EMAIL NOTIFICATION SIMULATION] SMTP not fully configured. Details:`);
          console.log(`To: ${user.email}`);
          console.log(`Subject: Verdict Ready: ${report.companyName} (${report.ticker || 'N/A'})`);
          console.log(`============================================================\n`);
        }
      }
    }
  } catch (emailErr) {
    console.error('Error sending email notification:', emailErr);
  }
}


export enum ReportStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum Verdict {
  INVEST = 'INVEST',
  PASS = 'PASS',
}

export async function createPendingReport(userId: string, companyName: string) {
  return prisma.report.create({
    data: {
      userId,
      companyName,
      status: ReportStatus.PENDING,
    },
  });
}

export async function logApiCall(
  userId: string,
  reportId: string | null,
  provider: string,
  endpoint: string,
  success: boolean,
  latencyMs?: number,
  errorMessage?: string | null
) {
  return prisma.apiLog.create({
    data: {
      userId,
      reportId,
      provider,
      endpoint,
      success,
      latencyMs: latencyMs || null,
      errorMessage: errorMessage || null,
    },
  });
}

export async function runAnalysis(reportId: string, userId: string, llmProviderOverride?: string | null) {
  const report = await prisma.report.findFirst({
    where: { id: reportId, userId },
  });

  if (!report) {
    throw new Error('Report not found');
  }

  // Update status to running
  await prisma.report.update({
    where: { id: reportId },
    data: { status: ReportStatus.RUNNING },
  });

  const startTime = Date.now();

  try {
    const result = await investmentResearchGraph.invoke({
      companyName: report.companyName,
      llmProviderOverride: llmProviderOverride || null,
    });

    const latencyMs = Date.now() - startTime;

    if (result.error || !result.structuredReport) {
      const errMsg = result.error || 'Agent produced no structured report';
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.FAILED,
          errorMessage: errMsg,
        },
      });
      await logApiCall(userId, reportId, 'agent_pipeline', 'analyze', false, latencyMs, errMsg);
      return updated;
    }

    const structured = result.structuredReport;
    const providerUsed = getLLMProviderName(llmProviderOverride || null);

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.COMPLETED,
        ticker: structured.ticker || null,
        verdict: structured.verdict === 'INVEST' ? Verdict.INVEST : Verdict.PASS,
        investmentScore: structured.investment_score || null,
        confidenceScore: structured.confidence_score || null,
        reportData: structured as any,
        completedAt: new Date(),
        llmProviderUsed: providerUsed,
      },
    });

    await logApiCall(userId, reportId, 'agent_pipeline', 'analyze', true, latencyMs);

    // Trigger real SMTP email notification if enabled in settings
    await sendReportEmail(updated, userId);

    return updated;
  } catch (error: any) {
    console.error('Unhandled service error running analysis:', error);
    const latencyMs = Date.now() - startTime;
    const errMsg = `Unexpected error: ${error.message || error}`;

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.FAILED,
        errorMessage: errMsg,
      },
    });

    await logApiCall(userId, reportId, 'agent_pipeline', 'analyze', false, latencyMs, errMsg);
    return updated;
  }
}

export async function getReportById(reportId: string, userId: string) {
  return prisma.report.findFirst({
    where: { id: reportId, userId },
  });
}

export async function listReports(userId: string, page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  
  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.report.count({
      where: { userId },
    }),
  ]);

  return { items, total };
}

export async function deleteReport(reportId: string, userId: string) {
  const report = await getReportById(reportId, userId);
  if (!report) {
    return false;
  }
  await prisma.report.delete({
    where: { id: reportId },
  });
  return true;
}

export async function setFavorite(reportId: string, userId: string, isFavorite: boolean) {
  const report = await getReportById(reportId, userId);
  if (!report) {
    return null;
  }
  return prisma.report.update({
    where: { id: reportId },
    data: { isFavorite },
  });
}
