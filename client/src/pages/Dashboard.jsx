import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workspaceAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { 
  Plus, 
  LogOut, 
  Users, 
  Calendar,
  Loader,
  Copy,
  Check
} from 'lucide-react';

/**
 * Dashboard Page Component
 * Displays user's workspaces and allows creating/joining new ones
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: ''
  });
  const [inviteCode, setInviteCode] = useState('');

  // Fetch workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await workspaceAPI.getAll();
      setWorkspaces(response.data.data.workspaces);
    } catch (error) {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const response = await workspaceAPI.create(newWorkspace);
      toast.success('Workspace created successfully!');
      setWorkspaces([response.data.data.workspace, ...workspaces]);
      setShowCreateModal(false);
      setNewWorkspace({ name: '', description: '' });
    } catch (error) {
      toast.error(error || 'Failed to create workspace');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    setJoinLoading(true);

    try {
      const response = await workspaceAPI.join(inviteCode);
      toast.success('Joined workspace successfully!');
      setWorkspaces([response.data.data.workspace, ...workspaces]);
      setShowJoinModal(false);
      setInviteCode('');
    } catch (error) {
      toast.error(error || 'Failed to join workspace');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.name}!
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your collaboration workspaces
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Workspace
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Users className="w-5 h-5 mr-2" />
            Join Workspace
          </button>
        </div>

        {/* Workspaces Grid */}
        {workspaces.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create a new workspace or join an existing one to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <div
                key={workspace._id}
                onClick={() => navigate(`/workspace/${workspace._id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {workspace.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {workspace.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {workspace.members?.length || 0} members
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Invite Code:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyInviteCode(workspace.inviteCode);
                      }}
                      className="flex items-center text-xs text-primary-600 hover:text-primary-700"
                    >
                      <span className="font-mono mr-1">{workspace.inviteCode}</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Workspace
            </h2>
            <form onSubmit={handleCreateWorkspace}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    required
                    minLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newWorkspace.description}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="What's this workspace about?"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Workspace Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Join Workspace
            </h2>
            <form onSubmit={handleJoinWorkspace}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    placeholder="ABC12345"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the 8-character invite code
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {joinLoading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

// Made with Bob
