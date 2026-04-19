import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, CheckCircle2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  
  // Where to redirect after login (prioritize where they were trying to go)
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccessMsg('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Successfully logged in!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // As long as they typed a name, save it to their Firebase Profile instantly
        if (name.trim()) {
           await updateProfile(userCredential.user, {
              displayName: name.trim()
           });
        }
        
        setSuccessMsg('Successfully signed up!');
      }
      
      // Delay navigation to show the success message
      setTimeout(() => {
        navigate(from, { replace: true });
        
        // Force a mini refresh to ensure the newly saved profile name loads into context immediately if signed up
        if (!isLogin) window.location.reload(); 
      }, 1500);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <div className="flex justify-center flex-col items-center">
            <Activity className="h-16 w-16 text-primary mb-2" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ghost Clinic Tracker</h1>
          </div>
          <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-700">
            {isLogin ? 'Sign in to access app' : 'Create your account'}
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {successMsg}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">Name</label>
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" 
                  placeholder="Full Name" 
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="Password" />
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors">
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} 
              className="font-semibold text-primary hover:text-blue-600 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
