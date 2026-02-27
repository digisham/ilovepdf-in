import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';

const toolGroups = [
  {
    title: 'Convert to PDF',
    tools: ['Word to PDF', 'PowerPoint to PDF', 'Excel to PDF', 'JPG to PDF', 'HTML to PDF'],
  },
  {
    title: 'Convert from PDF',
    tools: ['PDF to Word', 'PDF to PowerPoint', 'PDF to Excel', 'PDF to JPG', 'PDF to PDF/A'],
  },
  {
    title: 'Optimize PDF',
    tools: ['Compress PDF', 'Repair PDF', 'OCR PDF', 'Unlock PDF', 'Protect PDF'],
  },
  {
    title: 'Edit PDF',
    tools: ['Merge PDF', 'Split PDF', 'Rotate PDF', 'Add Page Numbers', 'Watermark PDF'],
  },
];

function getUserDisplay(user) {
  const metadata = user?.user_metadata || {};
  const fullName = metadata.full_name || metadata.name || '';
  const firstName = fullName.trim().split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const avatar = metadata.avatar_url || metadata.picture || null;
  return { firstName, avatar };
}

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const userDisplay = useMemo(() => getUserDisplay(session?.user), [session]);

  const loginWithGoogle = async () => {
    if (!supabase) {
      setAuthError('Supabase keys are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthError(error.message);
    }
  };

  const logout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
  };

  return (
    <div className="app-shell bg-light min-vh-100">
      <header className="topbar border-bottom bg-white sticky-top">
        <div className="container-fluid d-flex align-items-center justify-content-between py-2 px-3 px-lg-4">
          <div className="d-flex align-items-center gap-2">
            <div className="logo-mark">PDF</div>
            <div>
              <h1 className="h5 mb-0 fw-bold text-danger">iLovePDF Clone</h1>
              <small className="text-muted">All PDF tools in one dashboard</small>
            </div>
          </div>

          {!authLoading && !session && (
            <button className="btn btn-danger px-4" onClick={loginWithGoogle}>
              Login with Google
            </button>
          )}

          {!authLoading && session && (
            <div className="d-flex align-items-center gap-2">
              {userDisplay.avatar ? (
                <img src={userDisplay.avatar} alt={userDisplay.firstName} className="avatar" />
              ) : (
                <span className="avatar avatar-fallback">{userDisplay.firstName[0]?.toUpperCase()}</span>
              )}
              <span className="fw-semibold">{userDisplay.firstName}</span>
              <button className="btn btn-sm btn-outline-danger" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {authError && (
        <div className="container pt-3">
          <div className="alert alert-warning py-2 mb-0">{authError}</div>
        </div>
      )}

      <main className="container-fluid px-0">
        <div className="row g-0">
          <aside className="col-12 col-lg-3 col-xl-2 border-end bg-white sidebar p-3 p-lg-4">
            <h2 className="h6 text-uppercase text-muted fw-bold mb-3">All Tools</h2>
            <nav className="nav flex-column gap-1">
              {toolGroups.flatMap((group) => group.tools).map((tool) => (
                <button key={tool} className="btn btn-tool text-start">
                  {tool}
                </button>
              ))}
            </nav>
          </aside>

          <section className="col-12 col-lg-9 col-xl-10 p-3 p-lg-4">
            <div className="mb-4">
              <h2 className="h4 fw-bold mb-1">PDF Tools Dashboard</h2>
              <p className="text-muted mb-0">
                Build your own iLovePDF-like experience with conversion, optimization, and editing tools.
              </p>
            </div>

            <div className="row g-3">
              {toolGroups.map((group) => (
                <div className="col-12 col-md-6" key={group.title}>
                  <div className="card tool-card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <h3 className="h6 fw-bold mb-3">{group.title}</h3>
                      <div className="d-flex flex-wrap gap-2">
                        {group.tools.map((tool) => (
                          <span key={tool} className="badge rounded-pill text-bg-light border text-secondary">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
