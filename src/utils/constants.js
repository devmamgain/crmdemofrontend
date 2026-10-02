export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'];
export const DEAL_STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
export const SERVICE_TYPES = ['IT Asset Recovery', 'Equipment Buyback', 'Data Center Decommissioning', 'Lease Return Remarketing', 'Refresh Trade-in', 'Secure Data Destruction'];
export const INDUSTRIES = ['Healthcare', 'Financial Services', 'Education', 'Manufacturing', 'Government', 'Technology', 'Retail', 'Professional Services'];
export const ASSET_CATEGORIES = ['Laptop', 'Desktop', 'Server', 'Monitor', 'Networking', 'Phone', 'Tablet', 'Storage', 'Other'];
// Display names for deal stages (API values stay unchanged).
export const STAGE_LABEL = { New: 'New Inquiry', Qualified: 'Qualified', Proposal: 'Valuation Proposal', Negotiation: 'Negotiation', Won: 'Won', Lost: 'Lost' };
export const stageLabel = (s) => STAGE_LABEL[s] || s;
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const LEAD_SOURCES = ['Website', 'Referral', 'LinkedIn', 'Trade show', 'Cold outreach', 'Partner', 'AI Suggestion', 'Manual'];
export const CHART_COLORS = ['#4f46e5', '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
