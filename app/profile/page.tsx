"use client";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  User,
  Briefcase,
  MessageSquare,
  Award,
  Mail,
  Phone,
  Plus,
  X,
  Send,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";

// Type definitions matching your Supabase schema
interface User {
  id: string;
  name: string;
  email: string;
  role: "freelancer" | "client";
  university_id?: string;
  is_verified_student: boolean;
  created_at: string;
}

interface University {
  id: string;
  name: string;
  domain: string;
}

interface Profile {
  user_id: string;
  bio: string;
  skills: string[];
  hourly_rate?: number;
  reputation_score: number;
}

interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: "design" | "coding" | "writing" | "tutoring" | "other";
  budget_min: number;
  budget_max: number;
  deadline: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  client?: User;
}

interface Review {
  id: string;
  project_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: User;
  project?: Project;
}

interface FreelancerProfileProps {
  userId?: string;
}

const FreelancerProfile: React.FC<FreelancerProfileProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<"projects" | "reviews">(
    "projects"
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    project_id: "",
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

  // Use a default userId if none provided (for testing)
  const targetUserId = userId || "2";

  console.log("FreelancerProfile mounted with userId:", targetUserId);

  // Fetch current user (for review permissions)
  const fetchCurrentUser = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (userData) {
          const typedUserData = userData as User;
          setCurrentUser(typedUserData);

          // If user is a client, fetch projects they've worked on with this freelancer
          if (typedUserData.role === "client") {
            await fetchAvailableProjects(typedUserData.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      setError("Failed to fetch current user");
    }
  }, []);

  // Fetch projects that the client has worked on with this freelancer
  const fetchAvailableProjects = async (clientId: string) => {
    try {
      // For simplicity, fetch all completed projects from this client
      // In a real app, you'd want to check if the freelancer actually worked on these projects
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId)
        .eq("status", "completed");

      if (!error && projectsData) {
        setAvailableProjects(projectsData);
      }
    } catch (error) {
      console.error("Error fetching available projects:", error);
    }
  };

  // Fetch freelancer data
  const fetchFreelancerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching data for userId:", targetUserId);

      // Step 1: Fetch user details (simplified first)
      console.log("Step 1: Fetching user...");
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (userError) {
        console.error("User fetch error:", userError);
        throw userError;
      }
      console.log("User data:", userData);
      const typedUserData = userData as User;
      setUser(typedUserData);

      // Step 2: Fetch university if user has university_id
      if (typedUserData?.university_id) {
        console.log("Step 2: Fetching university...");
        const { data: universityData, error: universityError } = await supabase
          .from("universities")
          .select("*")
          .eq("id", typedUserData.university_id)
          .single();

        if (universityError) {
          console.error("University fetch error:", universityError);
        } else {
          console.log("University data:", universityData);
          setUniversity(universityData as University);
        }
      }

      // Step 3: Fetch profile details
      console.log("Step 3: Fetching profile...");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", targetUserId)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        // Create default profile if none exists
        setProfile({
          user_id: targetUserId,
          bio: "No bio available",
          skills: [],
          reputation_score: 0,
        });
      } else {
        console.log("Profile data:", profileData);
        setProfile(profileData);
      }

      // Step 4: Fetch projects (simplified)
      console.log("Step 4: Fetching projects...");
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", targetUserId);

      if (projectsError) {
        console.error("Projects fetch error:", projectsError);
      } else {
        console.log("Projects data:", projectsData);
        setProjects(projectsData || []);
      }

      // Step 5: Fetch reviews (simplified)
      console.log("Step 5: Fetching reviews...");
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", targetUserId);

      if (reviewsError) {
        console.error("Reviews fetch error:", reviewsError);
      } else {
        console.log("Reviews data:", reviewsData);
        setReviews(reviewsData || []);
      }
    } catch (error: unknown) {
      console.error("Error fetching freelancer data:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  // Add a new review
  const handleAddReview = async () => {
    if (!currentUser || !newReview.project_id) return;

    try {
      // Type assertion for the insert data
      const insertData = {
        project_id: Number(newReview.project_id),
        reviewer_id: Number(currentUser.id),
        reviewed_id: Number(targetUserId),
        rating: newReview.rating,
        comment: newReview.comment,
      };

      const { error } = await supabase
        .from("reviews")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any); // Use 'as any' to bypass type checking temporarily

      if (error) throw error;

      // Refresh reviews
      await fetchFreelancerData();
      setShowReviewModal(false);
      setNewReview({ rating: 5, comment: "", project_id: "" });
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered with targetUserId:", targetUserId);
    fetchCurrentUser();
    fetchFreelancerData();
  }, [targetUserId, fetchCurrentUser, fetchFreelancerData]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = () => {
    return "bg-muted text-foreground/80 border-border";
  };

  const getCategoryColor = () => {
    return "bg-muted text-foreground/80 border-border";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating)
          ? "fill-current text-foreground"
          : "text-muted-foreground"
          }`}
      />
    ));
  };

  const renderInteractiveStars = (
    rating: number,
    onChange: (rating: number) => void
  ) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-6 h-6 cursor-pointer transition-colors ${i < rating
          ? "fill-current text-yellow-500"
          : "text-muted-foreground hover:text-yellow-300"
          }`}
        onClick={() => onChange(i + 1)}
      />
    ));
  };

  const completedProjects = projects.filter(
    (p) => p.status === "completed"
  ).length;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const stats = [
    {
      label: "Projects Completed",
      value: completedProjects.toString(),
      icon: Briefcase,
    },
    { label: "Average Rating", value: avgRating.toFixed(1), icon: Award },
    {
      label: "Total Reviews",
      value: reviews.length.toString(),
      icon: MessageSquare,
    },
    {
      label: "Member Since",
      value: user ? new Date(user.created_at).getFullYear().toString() : "N/A",
      icon: Calendar,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Loading...</div>
          <div className="text-sm text-muted-foreground">
            Fetching user data for: {targetUserId}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Error</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <button
            onClick={fetchFreelancerData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">User not found</div>
          <div className="text-sm text-muted-foreground">
            No user found with ID: {targetUserId}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-background text-foreground">
      <div className="sm:w-[80%] w-full mx-auto px-6 md:px-8 py-8">
        {/* Profile Header */}
        <Card className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="px-8 py-10">
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-muted border-4 border-border shadow-sm flex items-center justify-center">
                  <User className="w-16 h-16 text-muted-foreground" />
                </div>
                {user.is_verified_student && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                  <h1 className="text-4xl font-bold text-foreground">
                    {user.name}
                  </h1>
                  {user.is_verified_student && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Verified Student
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-muted-foreground mb-6">
                  <div className="flex items-center space-x-1">
                    {renderStars(profile?.reputation_score || 0)}
                    <span className="ml-2 font-semibold text-foreground">
                      {(profile?.reputation_score || 0).toFixed(1)}
                    </span>
                    <span className="text-sm">({reviews.length} reviews)</span>
                  </div>
                  {university && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {university.name}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Member since {formatDate(user.created_at)}
                  </div>
                  {profile?.hourly_rate && (
                    <div className="flex items-center font-semibold text-foreground">
                      <DollarSign className="w-4 h-4 mr-1" />$
                      {profile.hourly_rate}/hour
                    </div>
                  )}
                </div>

                <p className="text-foreground/80 text-lg leading-relaxed mb-6">
                  {profile?.bio || "No bio available"}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {profile?.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-muted text-foreground/80 border border-border"
                    >
                      {skill}
                    </span>
                  )) || null}
                </div>

                <div className="flex flex-wrap gap-4">
                  <button className="flex items-center px-6 py-3 rounded-lg font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Me
                  </button>
                  <button className="flex items-center px-6 py-3 rounded-lg font-semibold bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors">
                    <Phone className="w-4 h-4 mr-2" />
                    Schedule Call
                  </button>
                  {currentUser && currentUser.role === "client" && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="flex items-center px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {stat.label}
                  </div>
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center border border-border">
                  <stat.icon className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("projects")}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${activeTab === "projects"
                  ? "text-foreground border-b-2 border-foreground bg-muted/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Projects ({projects.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${activeTab === "reviews"
                  ? "text-foreground border-b-2 border-foreground bg-muted/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Reviews ({reviews.length})</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === "projects" ? (
              <div className="space-y-6">
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No projects found</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="border border-border rounded-xl p-6 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            {project.title}
                          </h3>
                          <p className="text-foreground/80 leading-relaxed mb-2">
                            {project.description}
                          </p>
                          {project.client && (
                            <p className="text-sm text-muted-foreground">
                              Client: {project.client.name}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col sm:items-end space-y-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()}`}
                          >
                            {project.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor()}`}
                        >
                          {project.category.toUpperCase()}
                        </span>
                        <div className="flex items-center text-muted-foreground">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span className="font-medium text-foreground">
                            {formatCurrency(project.budget_min)} -{" "}
                            {formatCurrency(project.budget_max)}
                          </span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>Deadline: {formatDate(project.deadline)}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Started: {formatDate(project.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews yet</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border border-border rounded-xl p-6 bg-card"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center border border-border">
                            <User className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {review.reviewer?.name || "Anonymous"}
                            </h4>
                            {review.project && (
                              <p className="text-sm text-muted-foreground">
                                Project: {review.project.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end mb-1">
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-4 border border-border">
                        <p className="text-foreground/80 leading-relaxed">
                          &quot;{review.comment}&quot;
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Add Review
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Project
                  </label>
                  <select
                    value={newReview.project_id}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        project_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a completed project...</option>
                    {availableProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                  {availableProjects.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No completed projects found. You can only review
                      freelancers you&apos;ve worked with.
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rating
                  </label>
                  <div className="flex items-center space-x-1">
                    {renderInteractiveStars(newReview.rating, (rating) =>
                      setNewReview((prev) => ({ ...prev, rating }))
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Comment
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    className="w-full h-24 px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Share your experience working with this freelancer..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddReview}
                    disabled={
                      !newReview.comment.trim() || !newReview.project_id
                    }
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerProfile;