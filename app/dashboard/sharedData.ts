export interface DashboardData {
  status: string;
  solver_time_seconds: number;
  budget: number;
  total_cost: number;
  total_risk_reduction: number;
  budget_utilization_pct: number;
  budget_remaining: number;
  selected_controls: Array<{
    id: string; name: string; cost: number;
    risk_reduction: number; category: string; efficiency: number;
  }>;
  deferred_controls: Array<{
    id: string; name: string; cost: number;
    risk_reduction: number; category: string; efficiency: number;
    priority_rank: number;
  }>;
  financial: {
    capital_at_risk_before: number;
    capital_at_risk_after: number;
    portfolio_roi: number;
    risk_trend_labels: string[];
    risk_trend_values: number[];
    loss_exceedance: Array<{threshold: number; probability: number}>;
  };
  future_budget: {
    deferred_count: number;
    total_deferred_cost: number;
    total_deferred_reduction: number;
    approx_next_cycle_budget: number;
    approx_full_coverage_budget: number;
  };
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Identity': '#a78bfa', 'Endpoint': '#f59e0b', 'Network': '#60a5fa',
  'Data': '#10b981', 'People': '#f472b6', 'Monitoring': '#22d3ee',
  'Assessment': '#c084fc', 'Email': '#fb923c', 'Cloud': '#818cf8',
  'Physical': '#94a3b8', 'Response': '#fbbf24', 'Remediation': '#ef4444'
};

export const DEFAULT_DATA: DashboardData = {
  status: 'Optimal',
  solver_time_seconds: 2.1139,
  budget: 75,
  total_cost: 75,
  total_risk_reduction: 251,
  budget_utilization_pct: 100.0,
  budget_remaining: 0,
  selected_controls: [
    {id:'C09', name:'Email Security Gateway', cost:6, risk_reduction:30, category:'Email', efficiency:5.00},
    {id:'C17', name:'Patch Management System', cost:6, risk_reduction:27, category:'Assessment', efficiency:4.50},
    {id:'C05', name:'Security Awareness Training', cost:5, risk_reduction:22, category:'People', efficiency:4.40},
    {id:'C01', name:'Multi-Factor Authentication (MFA)', cost:8, risk_reduction:35, category:'Identity', efficiency:4.38},
    {id:'C24', name:'Anti-Phishing Solution', cost:6, risk_reduction:23, category:'Email', efficiency:3.83},
    {id:'C02', name:'Endpoint Detection & Response (EDR)', cost:15, risk_reduction:42, category:'Endpoint', efficiency:2.80},
    {id:'C12', name:'VPN / Zero Trust Network Access', cost:9, risk_reduction:24, category:'Network', efficiency:2.67},
    {id:'C08', name:'Web Application Firewall (WAF)', cost:8, risk_reduction:20, category:'Network', efficiency:2.50},
    {id:'C04', name:'Backup & Recovery System', cost:12, risk_reduction:28, category:'Data', efficiency:2.33},
  ],
  deferred_controls: [
    {id:'C11', name:'Encryption at Rest', cost:7, risk_reduction:18, category:'Data', efficiency:2.57, priority_rank:1},
    {id:'C07', name:'Vulnerability Management', cost:10, risk_reduction:25, category:'Assessment', efficiency:2.50, priority_rank:2},
    {id:'C23', name:'Mobile Device Management (MDM)', cost:7, risk_reduction:17, category:'Endpoint', efficiency:2.43, priority_rank:3},
    {id:'C16', name:'Intrusion Detection System (IDS)', cost:8, risk_reduction:19, category:'Network', efficiency:2.38, priority_rank:4},
    {id:'C15', name:'Network Segmentation', cost:11, risk_reduction:26, category:'Network', efficiency:2.36, priority_rank:5},
    {id:'C13', name:'Identity & Access Management (IAM)', cost:14, risk_reduction:33, category:'Identity', efficiency:2.36, priority_rank:6},
    {id:'C14', name:'Privileged Access Management (PAM)', cost:16, risk_reduction:36, category:'Identity', efficiency:2.25, priority_rank:7},
    {id:'C18', name:'Cloud Security Posture Management', cost:13, risk_reduction:29, category:'Cloud', efficiency:2.23, priority_rank:8},
    {id:'C03', name:'Next-Gen Firewall', cost:20, risk_reduction:38, category:'Network', efficiency:1.90, priority_rank:9},
    {id:'C06', name:'SIEM Platform', cost:25, risk_reduction:45, category:'Monitoring', efficiency:1.80, priority_rank:10},
    {id:'C10', name:'Data Loss Prevention (DLP)', cost:18, risk_reduction:32, category:'Data', efficiency:1.78, priority_rank:11},
    {id:'C25', name:'Threat Intelligence Platform', cost:12, risk_reduction:21, category:'Monitoring', efficiency:1.75, priority_rank:12},
    {id:'C19', name:'SOC-as-a-Service', cost:30, risk_reduction:50, category:'Monitoring', efficiency:1.67, priority_rank:13},
    {id:'C22', name:'Physical Security Controls', cost:5, risk_reduction:8, category:'Physical', efficiency:1.60, priority_rank:14},
    {id:'C20', name:'Incident Response Retainer', cost:10, risk_reduction:15, category:'Response', efficiency:1.50, priority_rank:15},
    {id:'C21', name:'Annual Penetration Testing', cost:8, risk_reduction:12, category:'Assessment', efficiency:1.50, priority_rank:16},
  ],
  financial: {
    capital_at_risk_before: 420,
    capital_at_risk_after: 169,
    portfolio_roi: 3.35,
    risk_trend_labels: ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'],
    risk_trend_values: [510, 495, 480, 468, 455, 448, 435, 420, 405, 388, 375, 169],
    loss_exceedance: [
      {threshold: 20, probability: 0.95},
      {threshold: 50, probability: 0.85},
      {threshold: 100, probability: 0.62},
      {threshold: 150, probability: 0.41},
      {threshold: 200, probability: 0.23},
      {threshold: 300, probability: 0.09},
      {threshold: 500, probability: 0.02}
    ]
  },
  future_budget: {
    deferred_count: 16,
    total_deferred_cost: 214,
    total_deferred_reduction: 424,
    approx_next_cycle_budget: 110,
    approx_full_coverage_budget: 250
  }
};
