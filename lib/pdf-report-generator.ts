/**
 * Automated PDF Report Generator
 * Wraps agency analytics into a clean, printable HTML/PDF report template.
 */

export function generateReportHtml(agencyName: string, metrics: {
  totalLeads: number
  totalDealsWon: number
  totalRevenue: number
  conversionRate: number
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${agencyName} - Monthly Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
          .header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .card-value { font-size: 28px; font-weight: bold; margin-top: 5px; }
          .footer { font-size: 12px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${agencyName} Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="grid">
          <div class="card">
            <div>Total Leads Acquired</div>
            <div class="card-value">${metrics.totalLeads}</div>
          </div>
          <div class="card">
            <div>Closed Deals</div>
            <div class="card-value">${metrics.totalDealsWon}</div>
          </div>
          <div class="card">
            <div>Total Generated Revenue</div>
            <div class="card-value">$${metrics.totalRevenue.toLocaleString()}</div>
          </div>
          <div class="card">
            <div>Funnel Conversion Rate</div>
            <div class="card-value">${metrics.conversionRate}%</div>
          </div>
        </div>

        <div class="footer">
          NEXLIN Platform Branded Executive Summary • Confidential
        </div>
      </body>
    </html>
  `
}
