import { signOut } from '@firebase/auth';
import { auth } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { FaSearch } from 'react-icons/fa';

export const Header = () => {
  const user = useAuthStore((state) => state.user);
  const { viewMode, setViewMode, searchQuery, setSearchQuery } = useTaskStore();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="header-container">
        <div className="flex-between">
          <div className="flex items-center">
            <h1 className="text-purple-600">TaskBuddy</h1>
            <div className="header-nav">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'board'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Board View
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="search-container">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {user && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-sm sm:text-base text-gray-700">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="btn btn-secondary"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
