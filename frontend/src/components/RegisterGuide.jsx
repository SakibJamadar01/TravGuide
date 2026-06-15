import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { createGuide, uploadIdProof, uploadSelfie, getGuideByEmail } from '../api/guideApi';
import { useSignUp, useSignIn, useAuth, useUser } from '@clerk/clerk-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const RegisterGuide = ({ onRegisterSuccess, onCancel }) => {
    const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
    const { signOut } = useAuth();
    const { user, isSignedIn } = useUser();

    const [step, setStep] = useState(1);
    const [isLoginMode, setIsLoginMode] = useState(false);
    const [guideProfile, setGuideProfile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        dateOfBirth: '',
        gender: '',
        mobileNumber: '',
        idProofType: '',
        idProofNumber: '',
        city: '',
        bio: '',
        pricePerDay: '',
        latitude: null,
        longitude: null
    });
    const [idProofFile, setIdProofFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [idProofPreview, setIdProofPreview] = useState(null);
    const [selfiePreview, setSelfiePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
    const [authError, setAuthError] = useState('');

    // Fetch existing profile if already logged in via Clerk
    useEffect(() => {
        const fetchProfile = async () => {
            if (isSignedIn && user) {
                const userEmail = user.primaryEmailAddress?.emailAddress;
                if (userEmail) {
                    try {
                        const profile = await getGuideByEmail(userEmail);
                        setGuideProfile(profile);
                    } catch (error) {
                        console.log("Logged in via Clerk, but guide profile not found. Pre-filling step 2.");
                        setFormData(prev => ({
                            ...prev,
                            email: userEmail,
                            name: user.fullName || prev.name || ''
                        }));
                        setStep(2);
                    }
                }
            }
        };
        fetchProfile();
    }, [isSignedIn, user]);

    // Guide Sign-In
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!formData.email.trim()) { setAuthError('Email is required'); return; }
        if (!formData.password) { setAuthError('Password is required'); return; }

        setIsSubmitting(true);
        setAuthError('');
        try {
            if (!isSignInLoaded) {
                setAuthError("Auth system loading. Please try again.");
                return;
            }
            // 1. Auth via Clerk
            const result = await signIn.create({
                identifier: formData.email,
                password: formData.password,
            });

            if (result.status === "complete") {
                await setSignInActive({ session: result.createdSessionId });
                // 2. Fetch profile from Spring Boot backend
                try {
                    const profile = await getGuideByEmail(formData.email);
                    setGuideProfile(profile);
                } catch (backendError) {
                    console.log('Clerk authenticated, but no guide profile found. Transitioning to Step 2.');
                    setStep(2);
                    setIsLoginMode(false);
                }
            } else {
                setAuthError("Sign in incomplete. Additional verification required.");
            }
        } catch (error) {
            console.error('Clerk sign-in error:', error);
            setAuthError(error.errors?.[0]?.longMessage || error.message || 'Incorrect email or password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        setIsSubmitting(true);
        try {
            await signOut();
            setGuideProfile(null);
            // Reset state
            setFormData({
                name: '',
                email: '',
                password: '',
                dateOfBirth: '',
                gender: '',
                mobileNumber: '',
                idProofType: '',
                idProofNumber: '',
                city: '',
                bio: '',
                pricePerDay: '',
                latitude: null,
                longitude: null
            });
            setIdProofFile(null);
            setSelfieFile(null);
            setIdProofPreview(null);
            setSelfiePreview(null);
            setStep(1);
            setIsLoginMode(false);
            setAwaitingConfirmation(false);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setAuthError('');
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        if (type === 'id') {
            setIdProofFile(file);
            setIdProofPreview(previewUrl);
        } else {
            setSelfieFile(file);
            setSelfiePreview(previewUrl);
        }
    };

    const handleMapClick = (e) => {
        const lat = e.detail.latLng.lat;
        const lng = e.detail.latLng.lng;
        setFormData({ ...formData, latitude: lat, longitude: lng });
    };

    // Step 1: Register with Clerk
    const handleClerkSignUp = async () => {
        if (!formData.name.trim()) { setAuthError('Full name is required'); return; }
        if (!formData.email.trim()) { setAuthError('Email is required'); return; }
        if (!formData.password || formData.password.length < 8) { setAuthError('Password must be at least 8 characters'); return; }
        if (!formData.dateOfBirth) { setAuthError('Date of birth is required'); return; }
        if (!formData.gender) { setAuthError('Gender is required'); return; }
        if (!formData.mobileNumber.trim()) { setAuthError('Mobile number is required'); return; }

        setIsSubmitting(true);
        setAuthError('');
        try {
            if (!isSignUpLoaded) {
                setAuthError("Auth system loading. Please try again.");
                return;
            }
            await signUp.create({
                emailAddress: formData.email,
                password: formData.password,
                firstName: formData.name.split(' ')[0],
                lastName: formData.name.split(' ').slice(1).join(' ') || undefined
            });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setAwaitingConfirmation(true);
        } catch (error) {
            console.error('Clerk sign-up error:', error);
            setAuthError(error.errors?.[0]?.longMessage || error.message || 'Sign-up failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 1b: Confirm email with OTP code
    const handleConfirmCode = async () => {
        if (!verificationCode.trim()) { setAuthError('Enter the verification code'); return; }
        setIsSubmitting(true);
        setAuthError('');
        try {
            if (!isSignUpLoaded) {
                setAuthError("Auth system loading. Please try again.");
                return;
            }
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code: verificationCode
            });
            if (completeSignUp.status === "complete") {
                await setSignUpActive({ session: completeSignUp.createdSessionId });
                setStep(2);
            } else {
                setAuthError("Verification incomplete. Please check your code.");
            }
        } catch (error) {
            console.error('Confirmation error:', error);
            setAuthError(error.errors?.[0]?.longMessage || error.message || 'Invalid code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateStep2 = () => {
        if (!formData.idProofType) { setAuthError('Select an ID proof type'); return false; }
        if (!formData.idProofNumber.trim()) { setAuthError('ID proof number is required'); return false; }
        if (!idProofFile) { setAuthError('Please upload your ID proof'); return false; }
        if (!selfieFile) { setAuthError('Please upload a selfie'); return false; }
        setAuthError('');
        return true;
    };

    const validateStep3 = () => {
        if (!formData.city.trim()) { setAuthError('City is required'); return false; }
        if (!formData.bio.trim()) { setAuthError('Bio is required'); return false; }
        if (!formData.pricePerDay) { setAuthError('Price is required'); return false; }
        if (!formData.latitude || !formData.longitude) { setAuthError('Please pin your location'); return false; }
        setAuthError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep3()) return;
        setIsSubmitting(true);
        try {
            const guide = await createGuide({
                ...formData,
                pricePerDay: parseFloat(formData.pricePerDay),
                rating: 5.0
            });
            if (idProofFile) await uploadIdProof(guide.id, idProofFile);
            if (selfieFile) await uploadSelfie(guide.id, selfieFile);
            onRegisterSuccess();
        } catch (error) {
            console.error('Registration error:', error);
            setAuthError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (guideProfile) {
        return (
            <div className="reg-page">
                <div className="reg-ambient-orb reg-orb-1"></div>
                <div className="reg-ambient-orb reg-orb-2"></div>

                <div className="dashboard-container">
                    <header className="dashboard-header">
                        <div className="logo-mini">🌍 TravGuide Portal</div>
                        <button className="logout-btn" onClick={handleLogout} disabled={isSubmitting}>
                            {isSubmitting ? 'Logging out...' : 'Log Out'}
                        </button>
                    </header>

                    <div className="dashboard-card">
                        <div className="dashboard-profile-section">
                            <div className="profile-header">
                                <div className="profile-avatar-large">
                                    {guideProfile.selfieUrl ? (
                                        <img src={`http://localhost:8080/uploads/${guideProfile.selfieUrl}`} alt="Selfie" />
                                    ) : (
                                        <span>🤳</span>
                                    )}
                                </div>
                                <div className="profile-title-area">
                                    <span className="profile-role">GUIDE PORTAL</span>
                                    <h1>{guideProfile.name || 'Guide Profile'}</h1>
                                    <p className="profile-city">📍 {guideProfile.city || 'No city selected'}</p>
                                </div>
                                <div className={`status-badge ${(guideProfile.verificationStatus || 'PENDING').toLowerCase()}`}>
                                    <span className="badge-dot"></span>
                                    {guideProfile.verificationStatus || 'PENDING'}
                                </div>
                            </div>

                            <hr className="dashboard-divider" />

                            <div className="dashboard-content-grid">
                                <div className="dashboard-col">
                                    <h3>About Me</h3>
                                    <p className="dashboard-bio-text">{guideProfile.bio || "No bio added yet."}</p>

                                    <div className="profile-meta-row">
                                        <div className="meta-item">
                                            <span className="meta-label">Email</span>
                                            <span className="meta-val">{guideProfile.email || 'N/A'}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">Mobile</span>
                                            <span className="meta-val">{guideProfile.mobileNumber || 'N/A'}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">Hourly/Daily Rate</span>
                                            <span className="meta-val highlight">${guideProfile.pricePerDay || '0'} / day</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="dashboard-col document-col">
                                    <h3>Verification Documents</h3>
                                    <div className="doc-item">
                                        <span className="doc-icon">📄</span>
                                        <div className="doc-details">
                                            <span className="doc-name">{guideProfile.idProofType || 'ID Proof'} Card</span>
                                            <span className="doc-no">Number: {guideProfile.idProofNumber || 'N/A'}</span>
                                        </div>
                                        <span className="doc-status-ok">Uploaded</span>
                                    </div>
                                    <div className="doc-item">
                                        <span className="doc-icon">🤳</span>
                                        <div className="doc-details">
                                            <span className="doc-name">Selfie Photograph</span>
                                            <span className="doc-no">For face-verification match</span>
                                        </div>
                                        <span className="doc-status-ok">Uploaded</span>
                                    </div>

                                    <div className="verification-status-box">
                                        {(guideProfile.verificationStatus === 'PENDING' || !guideProfile.verificationStatus) && (
                                            <p className="status-explain warning">
                                                ⏳ <strong>Pending Verification:</strong> Our administrators are currently reviewing your documents and selfie. Once verified, travelers will be able to see you on the search results map!
                                            </p>
                                        )}
                                        {guideProfile.verificationStatus === 'VERIFIED' && (
                                            <p className="status-explain success">
                                                🎉 <strong>Congratulations:</strong> Your profile has been verified! You are fully active on the TravGuide search map and list. Travelers can now browse your packages and contact you.
                                            </p>
                                        )}
                                        {guideProfile.verificationStatus === 'REJECTED' && (
                                            <p className="status-explain danger">
                                                ❌ <strong>Verification Failed:</strong> Your documents did not pass our checks. Please contact support at support@travguide.com to resolve this.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-footer">
                        <button className="dashboard-back-btn" onClick={onCancel}>
                            Go to Main Site
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reg-page">
            <div className="reg-ambient-orb reg-orb-1"></div>
            <div className="reg-ambient-orb reg-orb-2"></div>

            <button className="reg-back" onClick={onCancel}>
                <span>←</span> Back
            </button>

            {!isLoginMode && (
                <div className="reg-steps">
                    <div className={`reg-step-dot ${step >= 1 ? 'active' : ''}`}><span>01</span></div>
                    <div className="reg-step-line"><div className={`reg-step-line-fill ${step >= 2 ? 'filled' : ''}`}></div></div>
                    <div className={`reg-step-dot ${step >= 2 ? 'active' : ''}`}><span>02</span></div>
                    <div className="reg-step-line"><div className={`reg-step-line-fill ${step >= 3 ? 'filled' : ''}`}></div></div>
                    <div className={`reg-step-dot ${step >= 3 ? 'active' : ''}`}><span>03</span></div>
                </div>
            )}

            <div className="reg-card" style={{ maxWidth: '560px' }}>

                {/* Error banner */}
                {authError && (
                    <div className="auth-error">{authError}</div>
                )}

                {/* Step 1: Cognito Login */}
                {step === 1 && !awaitingConfirmation && isLoginMode && (
                    <form onSubmit={handleLogin} className="reg-card-inner">
                        <div className="reg-card-header">
                            <span className="reg-tag">Welcome Back — Sign In</span>
                            <h1>Access Guide Portal</h1>
                            <p>Secured by Clerk.</p>
                        </div>
                        <div className="reg-fields">
                            <div className="reg-field">
                                <label>Email <span className="req">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@email.com" autoFocus />
                            </div>
                            <div className="reg-field">
                                <label>Password <span className="req">*</span></label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" />
                            </div>
                        </div>
                        <button type="submit" className="reg-next-btn" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <div className="btn-loading-content">
                                    <span className="spinner"></span>
                                    <span>Signing In...</span>
                                </div>
                            ) : (
                                'Sign In →'
                            )}
                        </button>
                        <p className="auth-toggle-link" style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                            New here?{' '}
                            <span onClick={() => { setIsLoginMode(false); setAuthError(''); }} style={{ color: 'var(--coral)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
                                Register as a Guide
                            </span>
                        </p>
                    </form>
                )}

                {/* Step 1: Clerk Sign-Up */}
                {step === 1 && !awaitingConfirmation && !isLoginMode && (
                    <div className="reg-card-inner">
                        <div className="reg-card-header">
                            <span className="reg-tag">Step 1 of 3 — Account</span>
                            <h1>Create your account</h1>
                            <p>Secured by Clerk.</p>
                        </div>
                        <div className="reg-fields">
                            <div className="reg-field">
                                <label>Full Name (as per ID) <span className="req">*</span></label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your legal full name" autoFocus />
                            </div>
                            <div className="reg-field">
                                <label>Email <span className="req">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@email.com" />
                            </div>
                            <div className="reg-field">
                                <label>Password <span className="req">*</span></label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 characters" />
                            </div>
                            <div className="reg-row">
                                <div className="reg-field">
                                    <label>Date of Birth <span className="req">*</span></label>
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                                </div>
                                <div className="reg-field">
                                    <label>Gender <span className="req">*</span></label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="">Select</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="reg-field">
                                <label>Mobile Number <span className="req">*</span></label>
                                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="+919876543210" />
                                <span className="reg-loc-hint">Include country code (e.g. +91)</span>
                            </div>
                        </div>
                        {/* Clerk Captcha Placeholder for Bot Protection */}
                        <div id="clerk-captcha"></div>
                        <button className="reg-next-btn" onClick={handleClerkSignUp} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <div className="btn-loading-content">
                                    <span className="spinner"></span>
                                    <span>Creating Account...</span>
                                </div>
                            ) : (
                                'Create Account & Verify →'
                            )}
                        </button>
                        <p className="auth-toggle-link" style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                            Already have an account?{' '}
                            <span onClick={() => { setIsLoginMode(true); setAuthError(''); }} style={{ color: 'var(--coral)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
                                Sign In
                            </span>
                        </p>
                    </div>
                )}

                {/* Step 1b: Email Verification Code */}
                {step === 1 && awaitingConfirmation && (
                    <div className="reg-card-inner">
                        <div className="reg-card-header">
                            <span className="reg-tag">Verify Email</span>
                            <h1>Check your inbox</h1>
                            <p>We sent a verification code to <strong>{formData.email}</strong></p>
                        </div>
                        <div className="reg-fields">
                            <div className="reg-field">
                                <label>Verification Code <span className="req">*</span></label>
                                <input 
                                    type="text" 
                                    value={verificationCode} 
                                    onChange={(e) => { setVerificationCode(e.target.value); setAuthError(''); }}
                                    placeholder="Enter 6-digit code" 
                                    maxLength="6" 
                                    autoFocus
                                    style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem' }}
                                />
                            </div>
                        </div>
                        <button className="reg-next-btn" onClick={handleConfirmCode} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <div className="btn-loading-content">
                                    <span className="spinner"></span>
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                'Verify & Continue →'
                            )}
                        </button>
                    </div>
                )}

                {/* Step 2: Document Verification */}
                {step === 2 && (
                    <div className="reg-card-inner">
                        <div className="reg-card-header">
                            <span className="reg-tag">Step 2 of 3 — Verification</span>
                            <h1>Verify your identity</h1>
                            <p>Upload a government ID and a selfie.</p>
                        </div>
                        <div className="reg-fields">
                            <div className="reg-row">
                                <div className="reg-field">
                                    <label>ID Proof Type <span className="req">*</span></label>
                                    <select name="idProofType" value={formData.idProofType} onChange={handleChange}>
                                        <option value="">Select</option>
                                        <option value="AADHAAR">Aadhaar Card</option>
                                        <option value="PAN">PAN Card</option>
                                        <option value="PASSPORT">Passport</option>
                                        <option value="DRIVING_LICENSE">Driving License</option>
                                    </select>
                                </div>
                                <div className="reg-field">
                                    <label>ID Number <span className="req">*</span></label>
                                    <input type="text" name="idProofNumber" value={formData.idProofNumber} onChange={handleChange} placeholder="Enter ID number" />
                                </div>
                            </div>
                            <div className="reg-field">
                                <label>Upload ID Proof <span className="req">*</span></label>
                                <div className="upload-box" onClick={() => document.getElementById('idFile').click()}>
                                    {idProofPreview ? (
                                        <img src={idProofPreview} alt="ID Preview" className="upload-preview" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <span>📄</span>
                                            <p>Click to upload ID document</p>
                                            <small>JPG, PNG or PDF — Max 5MB</small>
                                        </div>
                                    )}
                                    <input id="idFile" type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'id')} hidden />
                                </div>
                            </div>
                            <div className="reg-field">
                                <label>Upload Selfie <span className="req">*</span></label>
                                <div className="upload-box" onClick={() => document.getElementById('selfieFile').click()}>
                                    {selfiePreview ? (
                                        <img src={selfiePreview} alt="Selfie Preview" className="upload-preview" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <span>🤳</span>
                                            <p>Click to upload a clear selfie</p>
                                            <small>For face matching with your ID</small>
                                        </div>
                                    )}
                                    <input id="selfieFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'selfie')} hidden />
                                </div>
                            </div>
                        </div>
                        <div className="reg-btn-row">
                            <button type="button" className="reg-back-step" onClick={() => setStep(1)}>← Back</button>
                            <button className="reg-next-btn" style={{ flex: 1 }} onClick={() => validateStep2() && setStep(3)}>
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Guide Profile */}
                {step === 3 && (
                    <form onSubmit={handleSubmit} className="reg-card-inner">
                        <div className="reg-card-header">
                            <span className="reg-tag">Step 3 of 3 — Profile</span>
                            <h1>Set up your profile</h1>
                            <p>Tell travelers about your expertise.</p>
                        </div>
                        <div className="reg-fields">
                            <div className="reg-row">
                                <div className="reg-field">
                                    <label>City <span className="req">*</span></label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Where do you operate?" />
                                </div>
                                <div className="reg-field">
                                    <label>Rate ($/day) <span className="req">*</span></label>
                                    <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} placeholder="150" min="1" />
                                </div>
                            </div>
                            <div className="reg-field">
                                <label>Bio <span className="req">*</span></label>
                                <textarea name="bio" rows="3" value={formData.bio} onChange={handleChange} placeholder="What makes you a great guide?"></textarea>
                            </div>
                            <div className="reg-field">
                                <label>Pin Location <span className="req">*</span></label>
                                <div className="reg-map-box">
                                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                                        <Map defaultCenter={{ lat: 20.5937, lng: 78.9629 }} defaultZoom={4} mapId={'bf50473b22538181'} onClick={handleMapClick} gestureHandling={'greedy'} disableDefaultUI={true}>
                                            {formData.latitude && (
                                                <AdvancedMarker position={{ lat: formData.latitude, lng: formData.longitude }}>
                                                    <div className="signature-marker" style={{ padding: '5px 10px', fontSize: '13px', border: 'none' }}>📍</div>
                                                </AdvancedMarker>
                                            )}
                                        </Map>
                                    </APIProvider>
                                </div>
                                {formData.latitude ? <span className="reg-loc-ok">✓ Location pinned</span> : <span className="reg-loc-hint">Click on the map to drop a pin</span>}
                            </div>
                        </div>
                        <div className="reg-btn-row">
                            <button type="button" className="reg-back-step" onClick={() => setStep(2)}>← Back</button>
                             <button type="submit" className="reg-submit-btn" disabled={isSubmitting}>
                                 {isSubmitting ? (
                                     <div className="btn-loading-content">
                                         <span className="spinner"></span>
                                         <span>Creating Profile...</span>
                                     </div>
                                 ) : (
                                     'Complete Registration'
                                 )}
                             </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="reg-footer">
                <span onClick={onCancel} style={{ cursor: 'pointer' }}>🌍 TravGuide</span>
            </div>
        </div>
    );
};

export default RegisterGuide;
