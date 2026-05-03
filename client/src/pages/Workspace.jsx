import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workspaceAPI, messageAPI } from '../utils/api';
import { 
  getSocket, 
  joinWorkspace, 
  leaveWorkspace,
  sendMessage as socketSendMessage,
  startTyping,
  stopTyping,
  updateDocument,
  onSocketEvent,
  offSocketEvent
} from '../utils/socket';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  FileText,
  MessageSquare,
  Loader,
  Circle
} from 'lucide-react';

/**
 * Workspace Page Component
 * Main collaboration workspace with chat and document editor
 */
const Workspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [workspace, setWorkspace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'document'
  
  // Chat state
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Document state
  const [documentContent, setDocumentContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const documentTimeoutRef = useRef(null);

  // Fetch workspace data
  useEffect(() => {
    fetchWorkspace();
    fetchMessages();
  }, [id]);

  // Setup socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !workspace) return;

    // Join workspace room
    joinWorkspace(id);

    // Socket event handlers
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    const handleUserJoined = (data) => {
      toast.info(`${data.userName} joined the workspace`);
      fetchWorkspace(); // Refresh to get updated members
    };

    const handleUserLeft = (data) => {
      toast.info(`${data.userName} left the workspace`);
      fetchWorkspace();
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user._id) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.userId === data.userId)) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    const handleDocumentUpdated = (data) => {
      setDocumentContent(data.content);
      toast.info(`Document updated by ${data.editedBy.userName}`, { autoClose: 2000 });
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleNotification = (data) => {
      toast.info(data.message);
    };

    // Register event listeners
    onSocketEvent('new-message', handleNewMessage);
    onSocketEvent('user-joined', handleUserJoined);
    onSocketEvent('user-left', handleUserLeft);
    onSocketEvent('user-typing', handleUserTyping);
    onSocketEvent('user-stopped-typing', handleUserStoppedTyping);
    onSocketEvent('document-updated', handleDocumentUpdated);
    onSocketEvent('online-users', handleOnlineUsers);
    onSocketEvent('notification', handleNotification);

    // Cleanup
    return () => {
      offSocketEvent('new-message', handleNewMessage);
      offSocketEvent('user-joined', handleUserJoined);
      offSocketEvent('user-left', handleUserLeft);
      offSocketEvent('user-typing', handleUserTyping);
      offSocketEvent('user-stopped-typing', handleUserStoppedTyping);
      offSocketEvent('document-updated', handleDocumentUpdated);
      offSocketEvent('online-users', handleOnlineUsers);
      offSocketEvent('notification', handleNotification);
      
      leaveWorkspace(id);
    };
  }, [workspace, user, id]);

  const fetchWorkspace = async () => {
    try {
      const response = await workspaceAPI.getById(id);
      setWorkspace(response.data.data.workspace);
      setDocumentContent(response.data.data.workspace.document.content);
    } catch (error) {
      toast.error('Failed to load workspace');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await messageAPI.getMessages(id);
      setMessages(response.data.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    socketSendMessage(id, messageInput.trim());
    setMessageInput('');
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(id);
  };

  const handleMessageInputChange = (e) => {
    setMessageInput(e.target.value);

    // Typing indicator
    startTyping(id);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(id);
    }, 2000);
  };

  const handleDocumentChange = (e) => {
    const newContent = e.target.value;
    setDocumentContent(newContent);

    // Debounce document updates
    if (documentTimeoutRef.current) {
      clearTimeout(documentTimeoutRef.current);
    }

    documentTimeoutRef.current = setTimeout(() => {
      saveDocument(newContent);
    }, 1000);
  };

  const saveDocument = async (content) => {
    setIsSaving(true);
    try {
      await workspaceAPI.updateDocument(id, content);
      updateDocument(id, content);
    } catch (error) {
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {workspace?.name}
              </h1>
              <p className="text-sm text-gray-600">
                {workspace?.members?.length} members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onlineUsers.map(u => (
              <div key={u.userId} className="flex items-center gap-1 text-sm text-gray-600">
                <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                <span>{u.userName}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 flex gap-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'document'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            Document
            {isSaving && <Loader className="w-4 h-4 animate-spin" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.sender?._id === user._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${
                    message.type === 'system' 
                      ? 'w-full text-center' 
                      : message.sender?._id === user._id 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-white'
                  } rounded-lg p-3 shadow-sm`}>
                    {message.type === 'system' ? (
                      <p className="text-sm text-gray-600 italic">{message.content}</p>
                    ) : (
                      <>
                        {message.sender?._id !== user._id && (
                          <p className="text-xs font-semibold text-gray-900 mb-1">
                            {message.sender?.name}
                          </p>
                        )}
                        <p className={message.sender?._id === user._id ? 'text-white' : 'text-gray-900'}>
                          {message.content}
                        </p>
                        <p className={`text-xs mt-1 ${
                          message.sender?._id === user._id ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-lg px-4 py-2">
                    <div className="typing-indicator flex gap-1">
                      <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                      <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                      <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleMessageInputChange}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="h-full p-4">
            <div className="h-full bg-white rounded-lg shadow-sm">
              <textarea
                value={documentContent}
                onChange={handleDocumentChange}
                className="w-full h-full p-6 border-0 focus:ring-0 resize-none font-mono text-sm"
                placeholder="Start typing your document here..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspace;

// Made with Bob
