// Mock Data for KaamSetu Frontend

export const currentUser = {
  userID: "u001",
  name: "Rahul S.",
  email: "rahul.s@email.com",
  phone: "+91 9876543210",
  address: "Hall A, IIT Kanpur",
  profilePicture: null, // no image, use initials
  profileType: "customer+worker", // 'customer' | 'customer+worker'
  workerTags: ["Plumber", "Cook"],
  rating: 4.3,
  reviewCount: 18,
};

export const myRequests: JobRequest[] = [
  {
    jobID: "j001",
    jobType: "Plumber needed",
    category: "Plumbing",
    description: "Fix a leaking bathroom tap and check for other leaks.",
    location: "Hall A, IIT Kanpur",
    datePosted: "Feb 4, 2026",
    budget: { min: 300, max: 500, negotiable: false },
    schedule: { date: "Today", timeRange: "Morning" },
    status: "in_progress", // 'pending' | 'in_progress' | 'completed' | 'cancelled'
    selectedWorkerID: "w001",
  },
  {
    jobID: "j002",
    jobType: "Cook needed",
    category: "Cooking",
    description: "Need a cook for daily lunch preparation.",
    location: "Hall A, IIT Kanpur",
    datePosted: "Feb 2, 2026",
    budget: { min: 200, max: 400, negotiable: false },
    schedule: { date: "Tomorrow", timeRange: "Morning" },
    status: "pending",
    selectedWorkerID: null,
  },
];

export const completedJobHistory: CompletedJob[] = [
  {
    jobID: "jh001",
    jobType: "Cook hired",
    date: "15 Oct 2023",
    status: "Completed",
    workerName: "Priya M.",
    agreedPay: 350,
  },
  {
    jobID: "jh002",
    jobType: "Maid service",
    date: "10 Sep 2023",
    status: "Completed",
    workerName: "Sunita K.",
    agreedPay: 250,
  },
  {
    jobID: "jh003",
    jobType: "Electrician",
    date: "5 Aug 2023",
    status: "Completed",
    workerName: "Ravi E.",
    agreedPay: 600,
  },
];

export const applicantsForJob: { [jobID: string]: Applicant[] } = {
  j001: [
    {
      workerID: "w001",
      name: "Rajesh Kumar",
      workTag: "Plumber",
      location: "Kalyanpur, Kanpur",
      expectedPay: 400,
      rating: 4.8,
      ratingCount: 250,
      experience: "10+",
      status: "accepted",
    },
    {
      workerID: "w002",
      name: "Amit Singh",
      workTag: "Plumber",
      location: "Swaroop Nagar, Kanpur",
      expectedPay: 350,
      rating: 4.5,
      ratingCount: 120,
      experience: "7",
      status: "rejected",
    },
    {
      workerID: "w003",
      name: "Sunil Verma",
      workTag: "Plumber",
      location: "Civil Lines, Kanpur",
      expectedPay: 300,
      rating: 4.2,
      ratingCount: 80,
      experience: "5",
      status: "rejected",
    },
    {
      workerID: "w004",
      name: "Vijay Singh",
      workTag: "Plumber",
      location: "Kakadeo, Kanpur",
      expectedPay: 380,
      rating: 4.6,
      ratingCount: 160,
      experience: "8",
      status: "rejected",
    },
    {
      workerID: "w005",
      name: "Ravi Verma",
      workTag: "Plumber",
      location: "Ashok Nagar, Kanpur",
      expectedPay: 450,
      rating: 4.9,
      ratingCount: 310,
      experience: "12",
      status: "rejected",
    },
  ],
  j002: [
    {
      workerID: "w006",
      name: "Priya M.",
      workTag: "Cook",
      location: "Civil Lines, Kanpur",
      expectedPay: 300,
      rating: 4.7,
      ratingCount: 90,
      experience: "6",
      status: "pending",
    },
    {
      workerID: "w007",
      name: "Neha S.",
      workTag: "Cook",
      location: "Kalyanpur, Kanpur",
      expectedPay: 250,
      rating: 4.4,
      ratingCount: 55,
      experience: "4",
      status: "pending",
    },
  ],
};

export const workerProfiles: { [workerID: string]: WorkerProfile } = {
  w001: {
    workerID: "w001",
    name: "Rajesh Kumar",
    workTag: "Plumber",
    rating: 4.8,
    ratingCount: 250,
    location: "IIT Kanpur",
    experience: "10+",
    profilePicture: null,
    previousWork: [
      {
        title: "Bathroom Leak Repair",
        rating: 4.9,
        timeAgo: "2 weeks ago",
        review: "Very professional and quick.",
      },
      {
        title: "Kitchen Tap Installation",
        rating: 5.0,
        timeAgo: "1 month ago",
        review: "Excellent work, highly recommended.",
      },
      {
        title: "Full Plumbing Check",
        rating: 4.8,
        timeAgo: "3 months ago",
        review: "Thorough job.",
      },
      {
        title: "Water Heater Repair",
        rating: 5.0,
        timeAgo: "6 months ago",
        review: "Fixed it perfectly.",
      },
    ],
  },
  w006: {
    workerID: "w006",
    name: "Priya M.",
    workTag: "Cook",
    rating: 4.7,
    ratingCount: 90,
    location: "Civil Lines, Kanpur",
    experience: "6",
    profilePicture: null,
    previousWork: [
      {
        title: "Daily Lunch Preparation",
        rating: 4.8,
        timeAgo: "1 week ago",
        review: "Great food, very punctual.",
      },
      {
        title: "Party Catering",
        rating: 4.6,
        timeAgo: "2 months ago",
        review: "Everyone loved the food.",
      },
    ],
  },
};

export const referrals: Referral[] = [
  {
    referralID: "r001",
    workerName: "Amit Sharma",
    phone: "+91 98210 5XXXX",
    workerTag: "Plumber",
    referredFor: "Plumber needed at Hall A, IIT Kanpur",
  },
  {
    referralID: "r002",
    workerName: "Priya Singh",
    phone: "+91 88776 1XXXX",
    workerTag: "Cook",
    referredFor: "Cook needed at Civil Lines, Kanpur",
  },
  {
    referralID: "r003",
    workerName: "Rajesh Verma",
    phone: "+91 70045 8XXXX",
    workerTag: "Electrician",
    referredFor: "Electrician needed at Swaroop Nagar",
  },
];

export const myApplications: Application[] = [
  {
    applicationID: "a001",
    jobID: "ja001",
    jobTitle: "Plumber needed at Hall A, IIT Kanpur",
    status: "accepted",
    dateApplied: "Feb 4, 2026",
    offeredPay: 400,
    jobLocation: "Hall A, IIT Kanpur",
    employerName: "Rahul S.",
    employerRating: 4.3,
    description: "Fix a leaking bathroom tap and check for other leaks.",
    datePosted: "Feb 4, 2026",
  },
  {
    applicationID: "a002",
    jobID: "ja002",
    jobTitle: "Plumber needed at SBRA, IIT Kanpur",
    status: "pending",
    dateApplied: "Feb 2, 2026",
    offeredPay: 350,
    jobLocation: "SBRA, IIT Kanpur",
    employerName: "Ankit R.",
    employerRating: 4.1,
    description: "Pipe fitting work.",
    datePosted: "Feb 1, 2026",
  },
  {
    applicationID: "a003",
    jobID: "ja003",
    jobTitle: "Plumber needed at Hall B, IIT Kanpur",
    status: "rejected",
    dateApplied: "Jan 28, 2026",
    offeredPay: 300,
    jobLocation: "Hall B, IIT Kanpur",
    employerName: "Suresh K.",
    employerRating: 3.9,
    description: "Tap replacement.",
    datePosted: "Jan 27, 2026",
  },
];

export const chatMessages: ChatMessage[] = [
  {
    messageID: "m001",
    senderID: "u001",
    content:
      "Hi Rajesh, What will be the things required for the repair, Tap's broken",
    timestamp: "11:32 AM",
    isMe: true,
  },
  {
    messageID: "m002",
    senderID: "w001",
    content: "I sending you list of things..",
    timestamp: "11:34 AM",
    isMe: false,
  },
];

// Type definitions
export interface JobRequest {
  jobID: string;
  jobType: string;
  category: string;
  description: string;
  location: string;
  datePosted: string;
  budget: { min: number; max: number; negotiable: boolean };
  schedule: { date: string; timeRange: string };
  status: "pending" | "in_progress" | "completed" | "cancelled";
  selectedWorkerID: string | null;
}

export interface CompletedJob {
  jobID: string;
  jobType: string;
  date: string;
  status: string;
  workerName: string;
  agreedPay: number;
}

export interface Applicant {
  workerID: string;
  name: string;
  workTag: string;
  location: string;
  expectedPay: number;
  rating: number;
  ratingCount: number;
  experience: string;
  status: "pending" | "accepted" | "rejected";
}

export interface WorkerProfile {
  workerID: string;
  name: string;
  workTag: string;
  rating: number;
  ratingCount: number;
  location: string;
  experience: string;
  profilePicture: string | null;
  previousWork: {
    title: string;
    rating: number;
    timeAgo: string;
    review: string;
  }[];
}

export interface Referral {
  referralID: string;
  workerName: string;
  phone: string;
  workerTag: string;
  referredFor: string;
}

export interface Application {
  applicationID: string;
  jobID: string;
  jobTitle: string;
  status: "pending" | "accepted" | "rejected";
  dateApplied: string;
  offeredPay: number;
  jobLocation: string;
  employerName: string;
  employerRating: number;
  description: string;
  datePosted: string;
}

export interface ChatMessage {
  messageID: string;
  senderID: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}
