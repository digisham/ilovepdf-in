import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FiX, FiLock, FiMail, FiUser } from 'react-icons/fi';

const LoginLimitModal = () => {
    const { showLoginModal, closeLoginModal, loginWithGoogle, loginWithEmail, signupWithEmail, defaultSignup } = useAuth();

    const [isLogin, setIsLogin] = useState(!defaultSignup);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Every time the modal opens, reset to the correct mode
    useEffect(() => {
        if (showLoginModal) {
            setIsLogin(!defaultSignup);
            setErrorMsg('');
            setSuccessMsg('');
            setName(''); setEmail(''); setPassword('');
        }
    }, [showLoginModal, defaultSignup]);

    if (!showLoginModal) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await loginWithEmail(email, password);
                if (error) throw error;
            } else {
                const { error, data } = await signupWithEmail(email, password, name);
                if (error) throw error;

                // Show success message and flip to login mode if signup didn't log user in instantly
                if (!data?.session) {
                    setSuccessMsg('Account created successfully! Please sign in.');
                    setIsLogin(true);
                    setPassword('');
                }
            }
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content text-start p-4" style={{ maxWidth: '400px' }}>
                <button className="modal-close bg-light rounded-circle" style={{ width: 32, height: 32 }} onClick={closeLoginModal}>
                    <FiX size={18} />
                </button>

                <div className="text-center mb-3">
                    <div className="bg-light text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: 48, height: 48 }}>
                        <FiLock size={20} />
                    </div>
                    <h2 className="fs-4 fw-bold mb-0 text-dark">{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
                </div>

                {errorMsg && <div className="alert alert-danger py-2 small">{errorMsg}</div>}
                {successMsg && <div className="alert alert-success py-2 small">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="mb-3">
                    {!isLogin && (
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">Full Name</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0"><FiUser className="text-muted" /></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-0 shadow-none border-light-subtle bg-light"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label small fw-bold text-muted">Email Address</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0"><FiMail className="text-muted" /></span>
                            <input
                                type="email"
                                className="form-control border-start-0 ps-0 shadow-none border-light-subtle bg-light"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label small fw-bold text-muted">Password</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0"><FiLock className="text-muted" /></span>
                            <input
                                type="password"
                                className="form-control border-start-0 ps-0 shadow-none border-light-subtle bg-light"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-danger w-100 fw-bold py-2 mb-3 shadow-sm rounded-3"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>

                    <div className="text-center small">
                        <span className="text-muted">{isLogin ? "Don't have an account?" : "Already have an account?"} </span>
                        <span
                            className="text-primary fw-bold cursor-pointer text-decoration-underline"
                            style={{ cursor: 'pointer' }}
                            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }}
                        >
                            {isLogin ? 'Register now' : 'Sign in here'}
                        </span>
                    </div>
                </form>

                <div className="position-relative mb-3 text-center">
                    <hr className="text-muted" />
                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small fw-bold">OR</span>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-dark w-100 py-2 d-flex justify-content-center align-items-center gap-2 fw-semibold rounded-3 mb-2 bg-white"
                    onClick={loginWithGoogle}
                >
                    <FcGoogle size={20} />
                    Continue with Google
                </button>
                <div className="text-center">
                    <p className="small text-muted m-0" style={{ fontSize: 11 }}>
                        By continuing, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginLimitModal;
