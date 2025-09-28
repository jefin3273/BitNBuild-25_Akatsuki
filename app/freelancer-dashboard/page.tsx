"use client";

import React, { useState, useEffect } from "react";
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Star,
  Clock,
  DollarSign,
  Briefcase,
  MessageSquare,
  Filter,
  Search,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar,
  Badge,
  Wallet,
  Target,
  Zap,
  Award,
  Brain,
  Flame,
  ThumbsUp,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Type definitions
interface UserProfile {
  id: number;
  name: string;
  email: string;
  skills?: string[];
  hourly_rate?: number;
  reputation_score?: number;
  bio?: string;
  is_verified_student?: boolean;
}

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_id: number;
  users?: {
    name: string;
    email?: string;
  };
  bids?: Bid[];
  reviews?: Review[];
  matchScore?: number;
  matchDetails?: MatchDetails;
  matchTier?: MatchTier;
}

interface Bid {
  id: number;
  project_id: number;
  freelancer_id: number;
  amount: number;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  projects?: {
    title: string;
    status: string;
    budget_min: number;
    budget_max: number;
    deadline: string;
  };
}

interface Review {
  rating: number;
  comment: string;
}

interface Payment {
  id: number;
  amount: number;
  status: 'held_in_escrow' | 'released';
  released_at?: string;
  projects?: {
    title: string;
  };
}

interface MatchDetails {
  skillsMatch: number;
  budgetMatch: number;
  categoryMatch: number;
  reputationMatch: number;
  timelineMatch: number;
}

interface MatchTier {
  tier: string;
  label: string;
  color: string;
  icon: React.ComponentType<any>;
}

// ML Project Matching System
class ProjectMatchingEngine {
  static calculateProjectMatch(userProfile: UserProfile, project: Project) {
    let totalScore = 0;
    let maxScore = 0;

    // Skills matching (40% weight)
    const skillsScore = this.calculateSkillsMatch(userProfile.skills || [], project);
    totalScore += skillsScore * 0.4;
    maxScore += 0.4;

    // Budget compatibility (25% weight)
    const budgetScore = this.calculateBudgetMatch(userProfile.hourly_rate, project);
    totalScore += budgetScore * 0.25;
    maxScore += 0.25;

    // Category expertise (20% weight)
    const categoryScore = this.calculateCategoryMatch(userProfile, project);
    totalScore += categoryScore * 0.2;
    maxScore += 0.2;

    // Reputation compatibility (10% weight)
    const reputationScore = this.calculateReputationMatch(userProfile.reputation_score, project);
    totalScore += reputationScore * 0.1;
    maxScore += 0.1;

    // Timeline feasibility (5% weight)
    const timelineScore = this.calculateTimelineMatch(project);
    totalScore += timelineScore * 0.05;
    maxScore += 0.05;

    return {
      matchScore: (totalScore / maxScore) * 100,
      details: {
        skillsMatch: skillsScore * 100,
        budgetMatch: budgetScore * 100,
        categoryMatch: categoryScore * 100,
        reputationMatch: reputationScore * 100,
        timelineMatch: timelineScore * 100
      }
    };
  }

  static calculateSkillsMatch(userSkills: string[], project: Project): number {
    if (!userSkills || userSkills.length === 0) return 0;

    const projectText = `${project.title} ${project.description} ${project.category}`.toLowerCase();
    const userSkillsLower = userSkills.map((skill: string) => skill.toLowerCase());

    let matchCount = 0;
    userSkillsLower.forEach((skill: string) => {
      if (projectText.includes(skill)) {
        matchCount++;
      }
    });

    // Bonus for category-specific skills
    if (userSkillsLower.includes(project.category.toLowerCase())) {
      matchCount += 2;
    }

    return Math.min(matchCount / Math.max(userSkills.length, 3), 1);
  }

  static calculateBudgetMatch(hourlyRate: number | undefined, project: Project): number {
    if (!hourlyRate || !project.budget_min || !project.budget_max) return 0.5;

    const hourlyInCents = hourlyRate;

    // Estimate 20-40 hours for a project
    const estimatedProjectValue = hourlyInCents * 30;

    if (estimatedProjectValue >= project.budget_min && estimatedProjectValue <= project.budget_max) {
      return 1; // Perfect match
    } else if (estimatedProjectValue < project.budget_min) {
      return Math.max(0.3, estimatedProjectValue / project.budget_min);
    } else {
      return Math.max(0.3, project.budget_max / estimatedProjectValue);
    }
  }

  static calculateCategoryMatch(userProfile: UserProfile, project: Project): number {
    const userSkills = userProfile.skills || [];
    const categoryKeywords: Record<string, string[]> = {
      design: ['design', 'ui', 'ux', 'graphic', 'visual', 'creative', 'photoshop', 'figma'],
      coding: ['javascript', 'python', 'react', 'node', 'web', 'mobile', 'app', 'software'],
      writing: ['writing', 'content', 'copywriting', 'blog', 'article', 'technical'],
      tutoring: ['teaching', 'education', 'tutoring', 'mentor', 'academic'],
      other: []
    };

    const relevantKeywords = categoryKeywords[project.category] || [];
    const userSkillsLower = userSkills.map((skill: string) => skill.toLowerCase());

    let matches = 0;
    relevantKeywords.forEach((keyword: string) => {
      if (userSkillsLower.some((skill: string) => skill.includes(keyword))) {
        matches++;
      }
    });

    return Math.min(matches / Math.max(relevantKeywords.length, 1), 1);
  }

  static calculateReputationMatch(userReputation: number | undefined, project: Project): number {
    if (!userReputation) return 0.5;

    // Simple reputation scoring - could be enhanced with project complexity analysis
    if (userReputation >= 4.5) return 1;
    if (userReputation >= 4.0) return 0.8;
    if (userReputation >= 3.5) return 0.6;
    if (userReputation >= 3.0) return 0.4;
    return 0.2;
  }

  static calculateTimelineMatch(project: Project): number {
    const deadline = new Date(project.deadline);
    const now = new Date();
    const daysToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysToDeadline >= 14) return 1; // Plenty of time
    if (daysToDeadline >= 7) return 0.8; // Good amount of time
    if (daysToDeadline >= 3) return 0.6; // Tight timeline
    if (daysToDeadline >= 1) return 0.3; // Very tight
    return 0.1; // Almost expired
  }

  static rankProjects(userProfile: UserProfile, projects: Project[]): Project[] {
    return projects.map((project: Project) => {
      const match = this.calculateProjectMatch(userProfile, project);
      return {
        ...project,
        matchScore: match.matchScore,
        matchDetails: match.details,
        matchTier: this.getMatchTier(match.matchScore)
      };
    }).sort((a: Project, b: Project) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  static getMatchTier(score: number): MatchTier {
    if (score >= 85) return { tier: 'perfect', label: 'Perfect Match', color: 'bg-green-500', icon: Target };
    if (score >= 70) return { tier: 'excellent', label: 'Excellent Match', color: 'bg-blue-500', icon: Zap };
    if (score >= 55) return { tier: 'good', label: 'Good Match', color: 'bg-purple-500', icon: ThumbsUp };
    if (score >= 40) return { tier: 'fair', label: 'Fair Match', color: 'bg-yellow-500', icon: Eye };
    return { tier: 'poor', label: 'Poor Match', color: 'bg-gray-500', icon: AlertCircle };
  }
}

const FreelancerDashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [rankedProjects, setRankedProjects] = useState<Project[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [matchFilter, setMatchFilter] = useState("all");

  // Bid form state
  const [bidAmount, setBidAmount] = useState("");
  const [bidProposal, setBidProposal] = useState("");

  // Fetch all dashboard data
  useEffect(() => {
    if (profile?.id && !authLoading) {
      fetchDashboardData();
    }
  }, [profile, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (!profile?.id) return;

      // Fetch freelancer profile details
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", profile.id)
        .single();

      // Fetch all available projects (no university filtering)
      const { data: projects } = await supabase
        .from("projects")
        .select(`
          *,
          users!projects_client_id_fkey (name, email)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      // Fetch user's bids with project info
      const { data: bids } = await supabase
        .from("bids")
        .select(`
          *,
          projects (title, status, budget_min, budget_max, deadline)
        `)
        .eq("freelancer_id", profile.id)
        .order("created_at", { ascending: false });

      // Fetch active projects
      const { data: active } = await supabase
        .from("projects")
        .select(`
          *,
          users!projects_client_id_fkey (name),
          bids!inner (*)
        `)
        .eq("bids.freelancer_id", profile.id)
        .eq("bids.status", "accepted")
        .eq("status", "in_progress");

      // Fetch completed projects with reviews
      const { data: completed } = await supabase
        .from("projects")
        .select(`
          *,
          users!projects_client_id_fkey (name),
          reviews (rating, comment),
          bids!inner (amount)
        `)
        .eq("bids.freelancer_id", profile.id)
        .eq("bids.status", "accepted")
        .eq("status", "completed");

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select(`
          *,
          projects (title)
        `)
        .in("project_id", completed?.map((p: Project) => p.id) || [])
        .order("released_at", { ascending: false });

      // Combine profile data
      const fullProfile: UserProfile = {
        ...profile,
        ...(profileData ?? {})
      };

      setUserProfile(fullProfile);
      setAvailableProjects(projects || []);
      setMyBids(bids || []);
      setActiveProjects(active || []);
      setCompletedProjects(completed || []);
      setPayments(paymentsData || []);

      // Rank projects using ML matching
      if (projects && fullProfile) {
        const ranked = ProjectMatchingEngine.rankProjects(fullProfile, projects);
        setRankedProjects(ranked);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (projectId: number) => {
    if (!profile?.id || !bidAmount || !bidProposal) {
      alert("Please fill in all fields");
      return;
    }

    // Check if user already has a bid for this project
    const existingBid = myBids.find(bid => bid.project_id === projectId);
    if (existingBid) {
      alert("You have already submitted a bid for this project.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("bids")
        .insert([{
          project_id: projectId,
          freelancer_id: profile.id,
          amount: parseFloat(bidAmount),
          proposal: bidProposal,
          status: 'pending'
        }] as any)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        alert(`Error submitting bid: ${error.message}`);
        return;
      }

      // Refresh data
      await fetchDashboardData();

      // Reset form
      setBidAmount("");
      setBidProposal("");

      alert("Bid submitted successfully!");
    } catch (error) {
      console.error("Error submitting bid:", error);
      alert(`Error submitting bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      held_in_escrow: "bg-yellow-100 text-yellow-800",
      released: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getFilteredProjects = (): Project[] => {
    let filtered = rankedProjects;

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter((project: Project) => project.category === filterCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((project: Project) =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by match quality
    if (matchFilter !== "all") {
      filtered = filtered.filter((project: Project) => project.matchTier?.tier === matchFilter);
    }

    return filtered;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the freelancer dashboard.</p>
        </div>
      </div>
    );
  }

  const filteredProjects = getFilteredProjects();
  const topMatches = rankedProjects.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mt-20">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {profile?.name}
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  {profile?.email}
                  {profile?.is_verified_student && (
                    <span className="inline-flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      Verified Student
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-sm text-gray-600">AI Match Score</div>
                <div className="flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-500 mr-1" />
                  <span className="font-bold text-purple-600">
                    {rankedProjects.length > 0 ?
                      Math.round(rankedProjects.slice(0, 10).reduce((acc, p) => acc + (p.matchScore || 0), 0) / Math.min(10, rankedProjects.length)) : 0}%
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Reputation Score</div>
                <div className="flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                  <span className="font-semibold">
                    {userProfile?.reputation_score?.toFixed(1) || "0.0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "projects", label: "Smart Projects", icon: Brain },
              { id: "bids", label: "My Bids", icon: MessageSquare },
              { id: "active", label: "Active Projects", icon: Clock },
              { id: "completed", label: "Completed", icon: CheckCircle },
              { id: "payments", label: "Payments", icon: Wallet },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Briefcase className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Projects</p>
                    <p className="text-2xl font-semibold text-gray-900">{activeProjects.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Perfect Matches</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {rankedProjects.filter((p: Project) => p.matchTier?.tier === 'perfect').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Bids</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {myBids.filter((b: Bid) => b.status === "pending").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Earned</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(
                        payments
                          .filter((p: Payment) => p.status === "released")
                          .reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Matches Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Top AI Matches for You
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('projects')}
                >
                  View All Matches
                </Button>
              </div>
              <div className="grid gap-4">
                {topMatches.map((project: Project) => {
                  const MatchIcon = project.matchTier?.icon || Target;
                  return (
                    <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{project.title}</h4>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${project.matchTier?.color || 'bg-gray-500'}`}>
                              <MatchIcon className="w-3 h-3" />
                              {Math.round(project.matchScore || 0)}% Match
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{project.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatCurrency(project.budget_min)} - {formatCurrency(project.budget_max)}</span>
                            <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profile Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {userProfile?.skills?.map((skill: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {skill}
                      </span>
                    )) || <span className="text-gray-500">No skills added yet</span>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Hourly Rate</h4>
                  <p className="text-green-600">
                    {userProfile?.hourly_rate ? formatCurrency(userProfile.hourly_rate) : "Not set"}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Bio</h4>
                <p className="text-gray-600">{userProfile?.bio || "No bio added yet."}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-6">
            {/* AI-Powered Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h3 className="font-medium text-gray-900">Smart Project Matching</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="design">Design</option>
                    <option value="coding">Coding</option>
                    <option value="writing">Writing</option>
                    <option value="tutoring">Tutoring</option>
                    <option value="other">Other</option>
                  </select>

                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={matchFilter}
                    onChange={(e) => setMatchFilter(e.target.value)}
                  >
                    <option value="all">All Match Levels</option>
                    <option value="perfect">Perfect Match (85%+)</option>
                    <option value="excellent">Excellent Match (70%+)</option>
                    <option value="good">Good Match (55%+)</option>
                    <option value="fair">Fair Match (40%+)</option>
                  </select>

                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {filteredProjects.length} projects found
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Projects List */}
            <div className="space-y-4">
              {filteredProjects.map((project: Project) => {
                const MatchIcon = project.matchTier?.icon || Target;
                return (
                  <div key={project.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white ${project.matchTier?.color || 'bg-gray-500'}`}>
                            <MatchIcon className="w-4 h-4" />
                            {project.matchTier?.label} ({Math.round(project.matchScore || 0)}%)
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.category}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3">{project.description}</p>

                        {/* Match breakdown */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Why this matches you:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-medium">Skills</div>
                              <div className="text-blue-600">{Math.round(project.matchDetails?.skillsMatch || 0)}%</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">Budget</div>
                              <div className="text-green-600">{Math.round(project.matchDetails?.budgetMatch || 0)}%</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">Category</div>
                              <div className="text-purple-600">{Math.round(project.matchDetails?.categoryMatch || 0)}%</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">Reputation</div>
                              <div className="text-yellow-600">{Math.round(project.matchDetails?.reputationMatch || 0)}%</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">Timeline</div>
                              <div className="text-indigo-600">{Math.round(project.matchDetails?.timelineMatch || 0)}%</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(project.budget_min)} - {formatCurrency(project.budget_max)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {new Date(project.deadline).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {project.users?.name}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                              <Target className="w-4 h-4 mr-1" />
                              Smart Bid
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Submit Smart Bid</DialogTitle>
                              <DialogDescription>
                                <div className="space-y-4 mt-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Your Proposal Price
                                    </label>
                                    <input
                                      type="number"
                                      placeholder="Enter amount"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      value={bidAmount}
                                      onChange={(e) => setBidAmount(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Proposal Message
                                    </label>
                                    <textarea
                                      rows={4}
                                      placeholder="Explain why you're the perfect match..."
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      value={bidProposal}
                                      onChange={(e) => setBidProposal(e.target.value)}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => handleBidSubmit(project.id)}
                                    className="w-full"
                                  >
                                    Submit Bid
                                  </Button>
                                </div>
                              </DialogDescription>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "bids" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Bids</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  {myBids.filter((b: Bid) => b.status === "pending").length} Pending
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  {myBids.filter((b: Bid) => b.status === "accepted").length} Accepted
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  {myBids.filter((b: Bid) => b.status === "rejected").length} Rejected
                </span>
              </div>
            </div>

            {myBids.map((bid: Bid) => (
              <div key={bid.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bid.projects?.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>
                        {bid.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{bid.proposal}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Proposed: {formatCurrency(bid.amount)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Deadline: {bid.projects?.deadline ? new Date(bid.projects.deadline).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Submitted: {new Date(bid.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    {bid.status === "pending" && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Response Time</div>
                        <div className="text-yellow-600 font-medium">Pending</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "active" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Active Projects</h2>
              <div className="text-sm text-gray-600">
                {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}
              </div>
            </div>

            {activeProjects.map((project: Project) => (
              <div key={project.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-l-green-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{project.description}</p>

                    {/* Progress indicator */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Project Progress</span>
                        <span className="text-gray-600">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Client: {project.users?.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(project.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <Button size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message Client
                    </Button>
                    <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Complete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Completed Projects</h2>
              <div className="text-sm text-gray-600">
                {completedProjects.length} completed project{completedProjects.length !== 1 ? 's' : ''}
              </div>
            </div>

            {completedProjects.map((project: Project) => (
              <div key={project.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Client: {project.users?.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Earned: {formatCurrency(project.bids?.[0]?.amount || 0)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Completed: {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </div>

                    {project.reviews?.[0] && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">Client Review</span>
                          <div className="flex ml-auto">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < project.reviews![0].rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {project.reviews[0].rating}/5
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          "{project.reviews[0].comment}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Wallet Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium opacity-90">Available Balance</h3>
                      <p className="text-3xl font-bold">
                        {formatCurrency(
                          payments
                            .filter((p: Payment) => p.status === "released")
                            .reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium opacity-90">In Escrow</h3>
                      <p className="text-3xl font-bold">
                        {formatCurrency(
                          payments
                            .filter((p: Payment) => p.status === "held_in_escrow")
                            .reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium opacity-90">Total Earned</h3>
                      <p className="text-3xl font-bold">
                        {formatCurrency(
                          payments.reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 opacity-80" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {payments.length > 0 ? payments.map((payment: Payment) => (
                  <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${payment.status === 'released' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                          {payment.status === 'released' ?
                            <CheckCircle className="w-5 h-5 text-green-600" /> :
                            <Clock className="w-5 h-5 text-yellow-600" />
                          }
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {payment.projects?.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {payment.released_at
                              ? `Released on ${new Date(payment.released_at).toLocaleDateString()}`
                              : "Held in escrow"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-lg">
                          {formatCurrency(payment.amount)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-gray-500">
                    <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No payments yet. Complete projects to start earning!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FreelancerDashboard;