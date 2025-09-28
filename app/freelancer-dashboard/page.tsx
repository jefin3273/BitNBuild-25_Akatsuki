"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
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

// Initialize Supabase client (you'll need to replace with your actual keys)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "your-supabase-url";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FreelancerDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [availableProjects, setAvailableProjects] = useState<any | null>([]);
  const [myBids, setMyBids] = useState<any | null>([]);
  const [activeProjects, setActiveProjects] = useState<any | null>([]);
  const [completedProjects, setCompletedProjects] = useState<any | null>([]);
  const [payments, setPayments] = useState<any | null>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock user ID (in real app, get from auth)
  const currentUserId = 1;

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user data with university info
      const { data: user } = await supabase
        .from("users")
        .select(
          `
          *,
          universities (name, domain)
        `
        )
        .eq("id", currentUserId)
        .single();

      // Fetch freelancer profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUserId)
        .single();

      // Fetch available projects (matching user's university)
      const { data: projects } = await supabase
        .from("projects")
        .select(
          `
          *,
          users!projects_client_id_fkey (name, universities(name))
        `
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });

      // Fetch user's bids with project info
      const { data: bids } = await supabase
        .from("bids")
        .select(
          `
          *,
          projects (title, status, budget_min, budget_max, deadline)
        `
        )
        .eq("freelancer_id", currentUserId)
        .order("created_at", { ascending: false });

      // Fetch active projects (where user has accepted bid)
      const { data: active } = await supabase
        .from("projects")
        .select(
          `
          *,
          users!projects_client_id_fkey (name),
          bids!inner (*)
        `
        )
        .eq("bids.freelancer_id", currentUserId)
        .eq("bids.status", "accepted")
        .eq("status", "in_progress");

      // Fetch completed projects with reviews
      const { data: completed } = await supabase
        .from("projects")
        .select(
          `
          *,
          users!projects_client_id_fkey (name),
          reviews (rating, comment),
          bids!inner (proposed_price)
        `
        )
        .eq("bids.freelancer_id", currentUserId)
        .eq("bids.status", "accepted")
        .eq("status", "completed");

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select(
          `
          *,
          projects (title)
        `
        )
        .in("project_id", completed?.map((p) => p.id) || [])
        .order("released_at", { ascending: false });

      setUserData(user);
      setProfile(profileData);
      setAvailableProjects(projects || []);
      setMyBids(bids || []);
      setActiveProjects(active || []);
      setCompletedProjects(completed || []);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (projectId: any) => {
    // In a real app, this would open a modal for bid submission
    alert(`Bid submission for project ${projectId} - implement modal here`);
  };

  const formatCurrency = (cents: any) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusColor = (status: any) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredProjects = availableProjects.filter((project: any) => {
    const matchesCategory =
      filterCategory === "all" || project.category === filterCategory;
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mt-20">
                  Welcome back, {userData?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {userData?.universities?.name} •{" "}
                  {userData?.is_verified_student && (
                    <span className="inline-flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      Verified Student
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-30">
              <div className="text-right">
                <div className="text-sm text-gray-600">Reputation Score</div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-semibold">
                    {profile?.reputation_score?.toFixed(1) || "0.0"}
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
              { id: "projects", label: "Available Projects", icon: Briefcase },
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
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
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
                      Active Projects
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {activeProjects.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Pending Bids
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {myBids.filter((b) => b.status === "pending").length}
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
                      {completedProjects.length}
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
                    <p className="text-sm font-medium text-gray-500">
                      Total Earned
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(
                        payments
                          .filter((p: any) => p.status === "released")
                          .reduce((sum: any, p: any) => sum + p.amount, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Profile Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.skills?.map((skill: any, index: any) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Hourly Rate
                  </h4>
                  <p className="text-green-600">
                    {profile?.hourly_rate
                      ? formatCurrency(profile.hourly_rate)
                      : "Not set"}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Bio</h4>
                <p className="text-gray-600">
                  {profile?.bio || "No bio added yet."}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
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
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400 w-5 h-5" />
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
                </div>
              </div>
            </div>

            {/* Available Projects List */}
            <div className="space-y-4">
              {filteredProjects.map((project) => (
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
                          Due: {new Date(project.deadline).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {project.users?.name} (
                          {project.users?.universities?.name})
                        </div>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger>
                        <Button>Submit Bid</Button>
                        {/* <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"> */}
                        {/* </button> */}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            <div>
                              This action cannot be undone. This will
                              permanently delete your account and remove your
                              data from our servers.
                              <Button
                                onClick={() => handleBidSubmit(project.id)}
                              >
                                Finalize Bid
                              </Button>
                            </div>
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "bids" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">My Bids</h2>
            {myBids.map((bid) => (
              <div key={bid.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bid.projects?.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          bid.status
                        )}`}
                      >
                        {bid.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{bid.proposal_text}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Proposed: {formatCurrency(bid.proposed_price)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Deadline:{" "}
                        {new Date(bid.proposed_deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "active" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Active Projects
            </h2>
            {activeProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow p-6">
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
                    </div>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Client: {project.users?.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(project.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Message Client
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Completed Projects
            </h2>
            {completedProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow p-6">
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
                        Earned:{" "}
                        {formatCurrency(project.bids?.[0]?.proposed_price || 0)}
                      </div>
                    </div>
                    {project.reviews?.[0] && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < project.reviews[0].rating
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
                        <p className="text-sm text-gray-600">
                          {project.reviews[0].comment}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Wallet Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800">
                    Available Balance
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      payments
                        .filter((p) => p.status === "released")
                        .reduce((sum, p) => sum + p.amount, 0)
                    )}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-800">In Escrow</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(
                      payments
                        .filter((p) => p.status === "held_in_escrow")
                        .reduce((sum, p) => sum + p.amount, 0)
                    )}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800">Total Earned</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      payments.reduce((sum, p) => sum + p.amount, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Payment History
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {payment.projects?.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {payment.released_at
                            ? `Released on ${new Date(
                                payment.released_at
                              ).toLocaleDateString()}`
                            : "Held in escrow"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FreelancerDashboard;
