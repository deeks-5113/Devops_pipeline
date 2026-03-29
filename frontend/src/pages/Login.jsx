import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { Server, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('auth_token', res.data.access_token); // ✅ correct key
      toast.success('Login successful');
      navigate('/');
    } catch (err) {
      toast.error('Invalid credentials or backend unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark-bg)] p-4">
      <div className="max-w-md w-full bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-emerald-500/10 rounded-full mb-4">
            <Server className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-200">System Ops</h1>
          <p className="text-sm text-slate-400 mt-1">Zero-Trust Deployment Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--color-dark-bg)] border border-[var(--color-dark-border)] text-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--color-dark-bg)] border border-[var(--color-dark-border)] text-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              placeholder="admin"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 mt-6"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <><Lock className="w-4 h-4 mr-2" />Authenticate</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
