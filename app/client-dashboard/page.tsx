"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
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
  Zap
} from 'lucide-react';

const ClientDashboard = () => {
  const { user: authUser, profile: userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [myProjects, setMyProjects] = useState([]);
  const [activeBids, setActiveBids] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [projectBids, setProjectBids] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const currentUserId = userProfile?.id;

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);

      // Fetch client's projects 
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *
        `)
        .eq('client_id', currentUserId)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Projects fetch error:', projectsError);
        setMyProjects([]);
      } else {
        setMyProjects(projects || []);
      }

      // Fetch active bids for client's projects
      const projectIds = projects?.map(p => p.id) || [];
      if (projectIds.length > 0) {
        const { data: bids, error: bidsError } = await supabase
          .from('bids')
          .select(`
            *,
            projects(title, budget_min, budget_max),
            users:users!bids_freelancer_id_fkey(name, email),
            profiles:profiles!bids_freelancer_id_fkey(reputation_score, skills, hourly_rate)
          `)
          .in('project_id', projectIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!bidsError) {
          setActiveBids(bids || []);
        }

        // Fetch recent messages for active projects
        const activeProjectIds = projects?.filter(p => p.status === 'in_progress').map(p => p.id) || [];
        if (activeProjectIds.length > 0) {
          const { data: messagesData, error: messagesError } = await supabase
            .from('messages')
            .select(`
              *,
              projects(title),
              users:users!messages_sender_id_fkey(name)
            `)
            .in('project_id', activeProjectIds)
            .order('timestamp', { ascending: false })
            .limit(10);

          if (!messagesError) {
            setMessages(messagesData || []);
          }
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bids for a specific project
  const fetchProjectBids = async (projectId) => {
    try {
      const { data: bids, error } = await supabase
        .from('bids')
        .select(`
          *,
          users:users!bids_freelancer_id_fkey(name, email),
          profiles:profiles!bids_freelancer_id_fkey(reputation_score, skills, hourly_rate, bio)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && bids) {
        setProjectBids(bids);
      } else {
        console.error('Error fetching project bids:', error);
        setProjectBids([]);
      }
    } catch (error) {
      console.error('Error fetching project bids:', error);
      setProjectBids([]);
    }
  };

  // Handle accepting a bid
  const handleAcceptBid = async (bidId, projectId) => {
    try {
      // Start a transaction-like operation
      // 1. Update the accepted bid status
      const { error: bidError } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (bidError) throw bidError;

      // 2. Reject all other bids for this project
      const { error: rejectError } = await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('project_id', projectId)
        .neq('id', bidId);

      if (rejectError) throw rejectError;

      // 3. Update project status to in_progress
      const { error: projectError } = await supabase
        .from('projects')
        .update({ status: 'in_progress' })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Refresh data
      await fetchDashboardData();
      await fetchProjectBids(projectId);
      
      alert('Bid accepted successfully! Project is now in progress.');
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Failed to accept bid. Please try again.');
    }
  };

  // Handle rejecting a bid
  const handleRejectBid = async (bidId, projectId) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('id', bidId);

      if (error) throw error;

      await fetchProjectBids(projectId);
      alert('Bid rejected successfully.');
    } catch (error) {
      console.error('Error rejecting bid:', error);
      alert('Failed to reject bid. Please try again.');
    }
  };

  // Handle project completion
  const handleCompleteProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId);

      if (error) throw error;

      await fetchDashboardData();
      alert('Project marked as completed!');
    } catch (error) {
      console.error('Error completing project:', error);
      alert('Failed to complete project. Please try again.');
    }
  };

  // Navigate to chat
  const handleStartChat = (projectId) => {
    router.push(`/chat/${projectId}`);
  };

  useEffect(() => {
    if (!authLoading && currentUserId && userProfile?.role === 'client') {
      fetchDashboardData();
    }
  }, [authLoading, currentUserId, userProfile]);

  const formatCurrency = (cents) => {
    if (!cents || isNaN(cents)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'fill-current text-yellow-500'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredProjects = myProjects.filter(project => {
    return filterStatus === 'all' || project.status === filterStatus;
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

  if (userProfile?.role !== 'client') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This dashboard is only available for clients.</p>
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
                  Client Dashboard • {userProfile?.is_verified_student && (
                    <span className="inline-flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      Verified Student
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/project/project-add')}
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
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'projects', label: 'My Projects', icon: Briefcase },
              { id: 'bids', label: 'Active Bids', icon: Target },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Briefcase className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Projects</p>
                    <p className="text-2xl font-semibold text-gray-900">{myProjects.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Projects</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {myProjects.filter(p => p.status === 'in_progress').length}
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
                    <p className="text-sm font-medium text-gray-500">Pending Bids</p>
                    <p className="text-2xl font-semibold text-gray-900">{activeBids.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {myProjects.filter(p => p.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Projects</h3>
                <div className="space-y-3">
                  {myProjects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{project.title}</p>
                        <p className="text-sm text-gray-600">{formatDate(project.created_at)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Bids */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bids</h3>
                <div className="space-y-3">
                  {activeBids.slice(0, 3).map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{bid.users?.name}</p>
                        <p className="text-sm text-gray-600">{bid.projects?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(bid.proposed_price)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(bid.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
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
                    onClick={() => router.push('/project/project-add')}
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
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {project.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{project.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(project.budget_min)} - {formatCurrency(project.budget_max)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {formatDate(project.deadline)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {activeBids.filter(b => b.project_id === project.id).length} bids
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      {project.status === 'open' && (
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            fetchProjectBids(project.id);
                            setShowBidsModal(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Bids ({activeBids.filter(b => b.project_id === project.id).length})
                        </button>
                      )}
                      {project.status === 'in_progress' && (
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bids' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Active Bids</h2>
            {activeBids.map((bid) => (
              <div key={bid.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{bid.projects?.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>
                        {bid.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="font-medium">{bid.users?.name}</span>
                      </div>
                      <div className="flex items-center">
                        {renderStars(bid.profiles?.reputation_score || 0)}
                        <span className="ml-1 text-sm text-gray-600">
                          ({(bid.profiles?.reputation_score || 0).toFixed(1)})
                        </span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="font-semibold text-green-600">{formatCurrency(bid.proposed_price)}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{bid.proposal_text}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {bid.profiles?.skills?.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Proposed deadline: {formatDate(bid.proposed_deadline)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Bid submitted: {formatDate(bid.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleAcceptBid(bid.id, bid.project_id)}
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
            {activeBids.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active bids found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Messages</h2>
            {messages.map((message) => (
              <div key={message.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{message.projects?.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{message.users?.name}</span>
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

        {/* Bids Modal */}
        {showBidsModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedProject.title}</h3>
                  <p className="text-sm text-gray-600">
                    {projectBids.length} bid{projectBids.length !== 1 ? 's' : ''} received
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
                  {projectBids.map((bid) => (
                    <div key={bid.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{bid.users?.name}</h4>
                              <p className="text-sm text-gray-600">{bid.users?.email}</p>
                            </div>
                            <div className="flex items-center">
                              {renderStars(bid.profiles?.reputation_score || 0)}
                              <span className="ml-2 text-sm font-medium">
                                {(bid.profiles?.reputation_score || 0).toFixed(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <span className="text-sm text-gray-500">Proposed Price:</span>
                              <p className="text-lg font-semibold text-green-600">
                                {formatCurrency(bid.proposed_price)}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Hourly Rate:</span>
                              <p className="text-lg font-semibold">
                                ${bid.profiles?.hourly_rate || 'N/A'}/hr
                              </p>
                            </div>
                          </div>

                          <div className="mb-3">
                            <span className="text-sm text-gray-500">Proposed Deadline:</span>
                            <p className="font-medium">{formatDate(bid.proposed_deadline)}</p>
                          </div>

                          <div className="mb-3">
                            <span className="text-sm text-gray-500">Skills:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {bid.profiles?.skills?.map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="text-sm text-gray-500">Bio:</span>
                            <p className="text-gray-700 mt-1">{bid.profiles?.bio || 'No bio provided'}</p>
                          </div>

                          <div className="mb-4">
                            <span className="text-sm text-gray-500">Proposal:</span>
                            <p className="text-gray-700 mt-1">{bid.proposal_text}</p>
                          </div>

                          <div className="text-xs text-gray-500">
                            Submitted on {new Date(bid.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {bid.status === 'pending' && (
                        <div className="flex gap-3 mt-4 pt-4 border-t">
                          <button
                            onClick={() => {
                              handleAcceptBid(bid.id, bid.project_id);
                              setShowBidsModal(false);
                            }}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Accept Bid
                          </button>
                          <button
                            onClick={() => handleRejectBid(bid.id, bid.project_id)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject Bid
                          </button>
                        </div>
                      )}

                      {bid.status !== 'pending' && (
                        <div className="mt-4 pt-4 border-t">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bid.status)}`}>
                            {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
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
      </main>
    </div>
  );
};

export default ClientDashboard;