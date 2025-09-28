"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Plus,
  Briefcase,
  MessageSquare,
  Clock,
  DollarSign,
  User,
  Star,
  Calendar,
  Filter,
  Search,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Eye,
  Users,
  Send,
  X,
  Award,
  Building,
  Target,
  Zap,
  CreditCard,
  Shield,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

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
  client_id: number;
}

interface Bid {
  id: number;
  project_id: number;
  freelancer_id: number;
  amount: number;
  proposal: string;
  status: string;
  created_at: string;
  project?: Project;
  freelancer_profile?: {
    user_id: number;
    name: string;
    email: string;
    bio: string;
    skills: string[];
    hourly_rate: number;
    reputation_score: number;
  };
}

interface EscrowPayment {
  id: number;
  project_id: number;
  client_id: number;
  freelancer_id: number;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  released_at: string | null;
  notes: string | null;
  project?: {
    title: string;
  };
  freelancer_profile?: {
    name: string;
  };
}

interface Message {
  id: number;
  project_id: number;
  sender_id: number;
  message_text: string;
  timestamp: string;
  project?: {
    title: string;
  };
  sender?: {
    name: string;
  };
}

interface Review {
  id: number;
  project_id: number;
  reviewer_id: number;
  reviewed_id: number;
  rating: number;
  comment: string;
  created_at: string;
  project?: {
    title: string;
  };
  reviewed_user?: {
    name: string;
  };
}

const ClientDashboard = () => {
  const {
    user: authUser,
    profile: userProfile,
    loading: authLoading,
  } = useAuth();
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [activeBids, setActiveBids] = useState<Bid[]>([]);
  const [escrowPayments, setEscrowPayments] = useState<EscrowPayment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [projectBids, setProjectBids] = useState<Bid[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
    reviewedId: 0,
    projectId: 0,
  });

  const currentUserId = userProfile?.id;

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      // Fetch client's projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", currentUserId)
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error("Projects fetch error:", projectsError);
        setMyProjects([]);
      } else {
        setMyProjects(projects || []);
      }

      // Fetch bids for client's projects
      const projectIds = projects?.map((p: Project) => p.id) || [];
      if (projectIds.length > 0) {
        const { data: bids, error: bidsError } = await supabase
          .from("bids")
          .select(`
            *,
            project:projects(title, budget_min, budget_max, status),
            freelancer_profile:profiles!bids_freelancer_id_fkey(
              user_id,
              name,
              email,
              bio,
              skills,
              hourly_rate,
              reputation_score
            )
          `)
          .in("project_id", projectIds)
          .order("created_at", { ascending: false });

        if (!bidsError) {
          setActiveBids(bids || []);
        }

        // Fetch escrow payments
        const { data: payments, error: paymentsError } = await supabase
          .from("escrow_payments")
          .select(`
            *,
            project:projects(title),
            freelancer_profile:profiles!escrow_payments_freelancer_id_fkey(name)
          `)
          .eq("client_id", currentUserId)
          .order("created_at", { ascending: false });

        if (!paymentsError) {
          setEscrowPayments(payments || []);
        }

        // Fetch recent messages for active projects
        const activeProjectIds = projects
          ?.filter((p: Project) => p.status === "in_progress")
          .map((p: Project) => p.id) || [];

        if (activeProjectIds.length > 0) {
          const { data: messagesData, error: messagesError } = await supabase
            .from("messages")
            .select(`
              *,
              project:projects(title),
              sender:users!messages_sender_id_fkey(name)
            `)
            .in("project_id", activeProjectIds)
            .neq("sender_id", currentUserId) // Only show messages from others
            .order("timestamp", { ascending: false })
            .limit(10);

          if (!messagesError) {
            setMessages(messagesData || []);
          }
        }

        // Fetch reviews given by this client
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select(`
            *,
            project:projects(title),
            reviewed_user:users!reviews_reviewed_id_fkey(name)
          `)
          .eq("reviewer_id", currentUserId)
          .order("created_at", { ascending: false });

        if (!reviewsError) {
          setReviews(reviewsData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bids for a specific project
  const fetchProjectBids = async (projectId: number) => {
    try {
      const { data: bids, error } = await supabase
        .from("bids")
        .select(`
          *,
          freelancer_profile:profiles!bids_freelancer_id_fkey(
            user_id,
            name,
            email,
            bio,
            skills,
            hourly_rate,
            reputation_score
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (!error && bids) {
        setProjectBids(bids);
      } else {
        console.error("Error fetching project bids:", error);
        setProjectBids([]);
      }
    } catch (error) {
      console.error("Error fetching project bids:", error);
      setProjectBids([]);
    }
  };

  // Handle accepting a bid
  const handleAcceptBid = async (bidId: number, projectId: number, freelancerId: number) => {
    try {
      // Start a transaction-like operation
      // 1. Update the accepted bid status
      const { error: bidError } = await supabase
        .from("bids")
        .update({ status: "accepted" } as never)
        .eq("id", bidId);

      if (bidError) throw bidError;

      // 2. Reject all other bids for this project
      const { error: rejectError } = await supabase
        .from("bids")
        .update({ status: "rejected" } as never)
        .eq("project_id", projectId)
        .neq("id", bidId);

      if (rejectError) throw rejectError;

      // 3. Update project status to in_progress
      const { error: projectError } = await supabase
        .from("projects")
        .update({ status: "in_progress" } as never)
        .eq("id", projectId);

      if (projectError) throw projectError;

      // 4. Create escrow payment entry
      const acceptedBid = projectBids.find(bid => bid.id === bidId);
      if (acceptedBid) {
        const { error: escrowError } = await supabase
          .from("escrow_payments")
          .insert({
            project_id: projectId,
            client_id: currentUserId,
            freelancer_id: freelancerId,
            amount: acceptedBid.amount,
            status: "held"
          } as any);

        if (escrowError) {
          console.error("Error creating escrow payment:", escrowError);
        }
      }

      // Refresh data
      await fetchDashboardData();
      await fetchProjectBids(projectId);

      alert("Bid accepted successfully! Project is now in progress and payment is held in escrow.");
    } catch (error) {
      console.error("Error accepting bid:", error);
      alert("Failed to accept bid. Please try again.");
    }
  };

  // Handle rejecting a bid
  const handleRejectBid = async (bidId: number, projectId: number) => {
    try {
      const { error } = await supabase
        .from("bids")
        .update({ status: "rejected" } as never)
        .eq("id", bidId);

      if (error) throw error;

      await fetchProjectBids(projectId);
      alert("Bid rejected successfully.");
    } catch (error) {
      console.error("Error rejecting bid:", error);
      alert("Failed to reject bid. Please try again.");
    }
  };

  // Handle project completion
  const handleCompleteProject = async (projectId: number) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: "completed" } as never)
        .eq("id", projectId);

      if (error) throw error;

      // Release escrow payment
      const { error: escrowError } = await supabase
        .from("escrow_payments")
        .update({
          status: "released",
          released_at: new Date().toISOString()
        } as never)
        .eq("project_id", projectId)
        .eq("client_id", currentUserId ?? 0);

      if (escrowError) {
        console.error("Error releasing escrow payment:", escrowError);
      }

      await fetchDashboardData();
      alert("Project marked as completed and payment released!");
    } catch (error) {
      console.error("Error completing project:", error);
      alert("Failed to complete project. Please try again.");
    }
  };

  // Handle submitting a review
  const handleSubmitReview = async () => {
    try {
      const { error } = await supabase
        .from("reviews")
        .insert({
          project_id: reviewData.projectId,
          reviewer_id: currentUserId,
          reviewed_id: reviewData.reviewedId,
          rating: reviewData.rating,
          comment: reviewData.comment
        } as any);

      if (error) throw error;

      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: "", reviewedId: 0, projectId: 0 });
      await fetchDashboardData();
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  // Navigate to chat
  const handleStartChat = (projectId: number) => {
    router.push(`/chat/${projectId}`);
  };

  // Open review modal for a completed project
  const openReviewModal = (project: Project, freelancerId: number) => {
    setReviewData({
      rating: 5,
      comment: "",
      reviewedId: freelancerId,
      projectId: project.id
    });
    setShowReviewModal(true);
  };

  useEffect(() => {
    if (!authLoading && currentUserId && userProfile?.role === "client") {
      fetchDashboardData();
    }
  }, [authLoading, currentUserId, userProfile]);

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-purple-100 text-purple-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      held: "bg-orange-100 text-orange-800",
      released: "bg-green-100 text-green-800",
      refunded: "bg-blue-100 text-blue-800",
      disputed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating)
          ? "fill-current text-yellow-500"
          : "text-gray-300"
          }`}
      />
    ));
  };

  const filteredProjects = myProjects.filter((project: Project) => {
    return filterStatus === "all" || project.status === filterStatus;
  });

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (userProfile?.role !== "client") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            This dashboard is only available for clients.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mt-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {userProfile?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  Client Dashboard •{" "}
                  {userProfile?.is_verified_student && (
                    <span className="inline-flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      Verified Student
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/add-project")}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post New Project
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "projects", label: "My Projects", icon: Briefcase },
              { id: "bids", label: "Active Bids", icon: Target },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "messages", label: "Messages", icon: MessageSquare },
              { id: "reviews", label: "Reviews", icon: Star },
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
                    <p className="text-sm font-medium text-gray-500">
                      Total Projects
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {myProjects.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Active Projects
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {myProjects.filter((p: Project) => p.status === "in_progress").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Pending Bids
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {activeBids.filter((b: Bid) => b.status === "pending").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Completed
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {myProjects.filter((p: Project) => p.status === "completed").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Projects
                </h3>
                <div className="space-y-3">
                  {myProjects.slice(0, 3).map((project: Project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {project.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(project.created_at)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Bids */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Bids
                </h3>
                <div className="space-y-3">
                  {activeBids.slice(0, 3).map((bid: Bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {bid.freelancer_profile?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {bid.project?.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(bid.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(bid.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  My Projects
                </h2>
                <div className="flex items-center gap-4">
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => router.push("/add-project")}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </button>
                </div>
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
              {filteredProjects.map((project: Project) => {
                const projectBidsCount = activeBids.filter((b: Bid) => b.project_id === project.id).length;
                const completedProject = project.status === "completed";
                const acceptedBid = activeBids.find((b: Bid) => b.project_id === project.id && b.status === "accepted");
                const hasReview = reviews.some((r: Review) => r.project_id === project.id);

                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {project.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {project.status.replace("_", " ")}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            {project.category}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(project.budget_min)} -{" "}
                            {formatCurrency(project.budget_max)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {formatDate(project.deadline)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {projectBidsCount} bids
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        {project.status === "open" && (
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              fetchProjectBids(project.id);
                              setShowBidsModal(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Bids ({projectBidsCount})
                          </button>
                        )}
                        {project.status === "in_progress" && (
                          <>
                            <button
                              onClick={() => handleStartChat(project.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Chat
                            </button>
                            <button
                              onClick={() => handleCompleteProject(project.id)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Mark Complete
                            </button>
                          </>
                        )}
                        {completedProject && acceptedBid && !hasReview && (
                          <button
                            onClick={() => openReviewModal(project, acceptedBid.freelancer_id)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            Leave Review
                          </button>
                        )}
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
            <h2 className="text-2xl font-bold text-gray-900">Active Bids</h2>
            {activeBids.filter((bid: Bid) => bid.status === "pending").map((bid: Bid) => (
              <div key={bid.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bid.project?.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          bid.status
                        )}`}
                      >
                        {bid.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="font-medium">{bid.freelancer_profile?.name}</span>
                      </div>
                      <div className="flex items-center">
                        {renderStars(bid.freelancer_profile?.reputation_score || 0)}
                        <span className="ml-1 text-sm text-gray-600">
                          ({(bid.freelancer_profile?.reputation_score || 0).toFixed(1)})
                        </span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="font-semibold text-green-600">
                          {formatCurrency(bid.amount)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{bid.proposal}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {bid.freelancer_profile?.skills?.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Bid submitted: {formatDate(bid.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Hourly Rate: ${bid.freelancer_profile?.hourly_rate || "N/A"}/hr
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleAcceptBid(bid.id, bid.project_id, bid.freelancer_id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectBid(bid.id, bid.project_id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {activeBids.filter((bid: Bid) => bid.status === "pending").length === 0 && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active bids found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Escrow Payments</h2>
            {escrowPayments.map((payment: EscrowPayment) => (
              <div key={payment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payment.project?.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="font-medium">{payment.freelancer_profile?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {payment.currency}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created: {formatDate(payment.created_at)}
                      </div>
                      {payment.released_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Released: {formatDate(payment.released_at)}
                        </div>
                      )}
                    </div>
                    {payment.notes && (
                      <p className="text-gray-600 mt-2">Notes: {payment.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {escrowPayments.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payments found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Messages
            </h2>
            {messages.map((message: Message) => (
              <div key={message.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {message.project?.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{message.sender?.name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600">{message.message_text}</p>
                  </div>
                  <button
                    onClick={() => handleStartChat(message.project_id)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent messages</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">My Reviews</h2>
            {reviews.map((review: Review) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {review.project?.title}
                      </h3>
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm font-medium">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Review for: {review.reviewed_user?.name}</span>
                    </div>
                    <p className="text-gray-600 mb-2">{review.comment}</p>
                    <p className="text-sm text-gray-500">
                      Submitted on {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reviews submitted yet</p>
              </div>
            )}
          </div>
        )}

        {/* Bids Modal */}
        {showBidsModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedProject.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {projectBids.length} bid
                    {projectBids.length !== 1 ? "s" : ""} received
                  </p>
                </div>
                <button
                  onClick={() => setShowBidsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[70vh] p-6">
                <div className="space-y-4">
                  {projectBids.map((bid: Bid) => (
                    <div
                      key={bid.id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {bid.freelancer_profile?.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {bid.freelancer_profile?.email}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {renderStars(bid.freelancer_profile?.reputation_score || 0)}
                              <span className="ml-2 text-sm font-medium">
                                {(bid.freelancer_profile?.reputation_score || 0).toFixed(1)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <span className="text-sm text-gray-500">
                                Proposed Price:
                              </span>
                              <p className="text-lg font-semibold text-green-600">
                                {formatCurrency(bid.amount)}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">
                                Hourly Rate:
                              </span>
                              <p className="text-lg font-semibold">
                                ${bid.freelancer_profile?.hourly_rate || "N/A"}/hr
                              </p>
                            </div>
                          </div>

                          <div className="mb-3">
                            <span className="text-sm text-gray-500">
                              Skills:
                            </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {bid.freelancer_profile?.skills?.map((skill: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="text-sm text-gray-500">Bio:</span>
                            <p className="text-gray-700 mt-1">
                              {bid.freelancer_profile?.bio || "No bio provided"}
                            </p>
                          </div>

                          <div className="mb-4">
                            <span className="text-sm text-gray-500">
                              Proposal:
                            </span>
                            <p className="text-gray-700 mt-1">
                              {bid.proposal}
                            </p>
                          </div>

                          <div className="text-xs text-gray-500">
                            Submitted on{" "}
                            {new Date(bid.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {bid.status === "pending" && (
                        <div className="flex gap-3 mt-4 pt-4 border-t">
                          <button
                            onClick={() => {
                              handleAcceptBid(bid.id, bid.project_id, bid.freelancer_id);
                              setShowBidsModal(false);
                            }}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Accept Bid
                          </button>
                          <button
                            onClick={() =>
                              handleRejectBid(bid.id, bid.project_id)
                            }
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject Bid
                          </button>
                        </div>
                      )}

                      {bid.status !== "pending" && (
                        <div className="mt-4 pt-4 border-t">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              bid.status
                            )}`}
                          >
                            {bid.status.charAt(0).toUpperCase() +
                              bid.status.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {projectBids.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No bids received yet</p>
                      <p className="text-sm text-gray-400">
                        Your project is visible to freelancers on the platform
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-900">
                  Leave a Review
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setReviewData(prev => ({ ...prev, rating: i + 1 }))}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${i < reviewData.rating
                            ? "fill-current text-yellow-500"
                            : "text-gray-300"
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {reviewData.rating}/5
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Share your experience working with this freelancer..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;