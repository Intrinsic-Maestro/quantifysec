export type UserRole = 
  | "CISO" 
  | "CFO" 
  | "Security Analyst" 
  | "Administrator" 
  | "Executive" 
  | "Viewer"
  | "Cloud Security Engineer"
  | "IAM Administrator"
  | "SOC Analyst"
  | "Compliance Manager"
  | "Team Lead";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  status: "Active" | "Inactive" | "Invited";
  lastLogin?: string;
  mfa?: boolean;
}

export const USERS: Record<string, UserProfile> = {
  CISO: {
    id: "usr-ciso",
    name: "Ram Kumar Sharma",
    email: "ram.sharma@acme.com",
    role: "CISO",
    department: "Security",
    status: "Active",
    lastLogin: "2h ago",
    mfa: true
  },
  CFO: {
    id: "usr-cfo",
    name: "Priya Mehta",
    email: "priya.mehta@acme.com",
    role: "CFO",
    department: "Finance",
    status: "Active",
    lastLogin: "4h ago",
    mfa: true
  },
  ANALYST_1: {
    id: "usr-ana-1",
    name: "Arjun Verma",
    email: "arjun.verma@acme.com",
    role: "Security Analyst",
    department: "Security Operations",
    status: "Active",
    lastLogin: "1h ago",
    mfa: true
  },
  ANALYST_2: {
    id: "usr-ana-2",
    name: "Aditi Singh",
    email: "aditi.singh@acme.com",
    role: "Security Analyst",
    department: "Security Operations",
    status: "Active",
    lastLogin: "1h ago",
    mfa: true
  },
  ADMIN: {
    id: "usr-adm-1",
    name: "Rohan Gupta",
    email: "rohan.gupta@acme.com",
    role: "Administrator",
    department: "IT",
    status: "Active",
    lastLogin: "4h ago",
    mfa: true
  },
  EXEC: {
    id: "usr-exec-1",
    name: "Vikram Malhotra",
    email: "vikram.malhotra@acme.com",
    role: "Executive",
    department: "Management",
    status: "Active",
    lastLogin: "1d ago",
    mfa: true
  },
  CLOUD_ENG: {
    id: "usr-cloud-1",
    name: "Neha Kapoor",
    email: "neha.kapoor@acme.com",
    role: "Cloud Security Engineer",
    department: "Security",
    status: "Active",
    lastLogin: "3h ago",
    mfa: true
  },
  IAM_ADMIN: {
    id: "usr-iam-1",
    name: "Karan Patel",
    email: "karan.patel@acme.com",
    role: "IAM Administrator",
    department: "IT",
    status: "Active",
    lastLogin: "5h ago",
    mfa: true
  },
  SOC_ANALYST: {
    id: "usr-soc-1",
    name: "Aditya Mishra",
    email: "aditya.mishra@acme.com",
    role: "SOC Analyst",
    department: "Security Operations",
    status: "Active",
    lastLogin: "30m ago",
    mfa: true
  },
  COMPLIANCE: {
    id: "usr-comp-1",
    name: "Ananya Sharma",
    email: "ananya.sharma@acme.com",
    role: "Compliance Manager",
    department: "Compliance",
    status: "Active",
    lastLogin: "2d ago",
    mfa: true
  }
};

// Helper function to get primary CISO
export const getPrimaryCISO = () => USERS.CISO;
// Helper function to get primary CFO
export const getPrimaryCFO = () => USERS.CFO;
// Helper function to get all users
export const getAllUsers = () => Object.values(USERS);
