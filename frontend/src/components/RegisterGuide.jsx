import React, { useState, useEffect } from 'react';
import { createGuide, updateGuide, getGuideByEmail, createVerificationSession, getVerificationStatus, resetVerification, uploadProfilePicture, uploadGuidePost, getGuidePosts, uploadDestinationImages, deleteDestinationImage, likeGuidePost, deleteGuidePost, editGuidePost } from '../api/guideApi';
import { useSignUp, useSignIn, useAuth, useUser } from '@clerk/clerk-react';
import { DiditSdk } from '@didit-protocol/sdk-web';
import travGuideLogo from '../assets/TravGuideLogo.png';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapClickHandler = ({ onClick }) => {
    useMapEvents({
        click: (e) => {
            onClick({ detail: { latLng: { lat: e.latlng.lat, lng: e.latlng.lng } } });
        }
    });
    return null;
};

const MapSearchControl = ({ onLocationFound }) => {
    const map = useMap();
    useEffect(() => {
        const provider = new OpenStreetMapProvider();
        const searchControl = new GeoSearchControl({
            provider: provider,
            style: 'bar',
            showMarker: false, 
            showPopup: false,
            autoClose: true,
            retainZoomLevel: false,
            animateZoom: true,
            keepResult: true,
            searchLabel: 'Enter address, city, or zip'
        });
        map.addControl(searchControl);

        const handleShowLocation = (e) => {
            if (e && e.location) {
                onLocationFound(e.location.y, e.location.x);
            }
        };

        map.on('geosearch/showlocation', handleShowLocation);

        return () => {
            map.removeControl(searchControl);
            map.off('geosearch/showlocation', handleShowLocation);
        };
    }, [map, onLocationFound]);
    return null;
};

const RegisterGuide = ({ onRegisterSuccess, onCancel }) => {
    const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
    const { signOut } = useAuth();
    const { user, isSignedIn } = useUser();

    // --- Auth state ---
    const [isLoginMode, setIsLoginMode] = useState(false);
    const [signUpSubStep, setSignUpSubStep] = useState('initial'); // 'initial' or 'details'
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    // --- Guide profile state ---
    const [guideProfile, setGuideProfile] = useState(null);
    const [profileEditMode, setProfileEditMode] = useState(false);

    // --- Form data ---
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        dateOfBirth: '',
        gender: '',
        mobileNumber: '',
        city: '',
        bio: '',
        pricePerDay: '',
        latitude: null,
        longitude: null,
        tripDurationDays: '',
        locationsShown: '',
        servicesProvided: ''
    });
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // --- UI state ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'edit_profile', 'verification', 'gallery'
    const [guidePosts, setGuidePosts] = useState([]);
    const [postCarouselIndices, setPostCarouselIndices] = useState({});
    const [editingPostId, setEditingPostId] = useState(null);
    const [editForm, setEditForm] = useState({ caption: '', location: '', tags: '' });

    // =============================================
    // Auto-fetch profile on Clerk login
    // =============================================
    useEffect(() => {
        const fetchProfile = async () => {
            if (isSignedIn && user) {
                const userEmail = user.primaryEmailAddress?.emailAddress;
                if (userEmail) {
                    try {
                        const profile = await getGuideByEmail(userEmail);
                        setGuideProfile(profile);
                        if (profile) {
                            setFormData(prev => ({
                                ...prev,
                                city: profile.city || '',
                                bio: profile.bio || '',
                                pricePerDay: profile.pricePerDay || '',
                                latitude: profile.latitude || null,
                                longitude: profile.longitude || null,
                                tripDurationDays: profile.tripDurationDays || '',
                                locationsShown: profile.locationsShown || '',
                                servicesProvided: profile.servicesProvided || ''
                            }));
                            
                            const posts = await getGuidePosts(profile.id);
                            setGuidePosts(posts);
                        }
                    } catch (error) {
                        // Clerk authenticated but no guide profile — create one with basic info
                        console.log("Clerk authenticated, no guide profile found. Creating basic profile...");
                        try {
                            const newGuide = await createGuide({
                                name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                                email: userEmail,
                            });
                            setGuideProfile(newGuide);
                        } catch (createError) {
                            console.error('Failed to create guide profile:', createError);
                            setAuthError('Account created but failed to initialize guide profile. Please try signing in again.');
                        }
                    }
                }
            }
        };
        fetchProfile();
    }, [isSignedIn, user]);

    // =============================================
    // Handlers
    // =============================================
    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsSubmitting(true);
        try {
            await uploadProfilePicture(guideProfile.id, file);
            const refreshed = await getGuideByEmail(guideProfile.email);
            setGuideProfile(refreshed);
        } catch (error) {
            console.error('Failed to upload profile picture:', error);
            setAuthError('Failed to upload profile picture.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isVideoFile = (fileName) => {
        if (!fileName) return false;
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime'];
        return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    };

    const handleNextImage = (postId, totalImages) => {
        setPostCarouselIndices(prev => {
            const current = prev[postId] || 0;
            return {
                ...prev,
                [postId]: (current + 1) % totalImages
            };
        });
    };

    const handlePrevImage = (postId, totalImages) => {
        setPostCarouselIndices(prev => {
            const current = prev[postId] || 0;
            return {
                ...prev,
                [postId]: (current - 1 + totalImages) % totalImages
            };
        });
    };

    const handleLikePost = async (postId) => {
        try {
            const result = await likeGuidePost(postId);
            setGuidePosts(prev => prev.map(post => 
                post.id === postId ? { ...post, likesCount: result.likesCount } : post
            ));
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await deleteGuidePost(postId);
            setGuidePosts(prev => prev.filter(post => post.id !== postId));
        } catch (error) {
            console.error('Failed to delete post:', error);
            setAuthError('Failed to delete post.');
        }
    };

    const handleStartEditPost = (post) => {
        setEditingPostId(post.id);
        setEditForm({
            caption: post.caption || '',
            location: post.location || '',
            tags: post.tags || ''
        });
    };

    const handleCancelEditPost = () => {
        setEditingPostId(null);
        setEditForm({ caption: '', location: '', tags: '' });
    };

    const handleSaveEditPost = async (postId) => {
        try {
            const updatedPost = await editGuidePost(postId, editForm);
            setGuidePosts(prev => prev.map(post => 
                post.id === postId ? { ...post, caption: updatedPost.caption, location: updatedPost.location, tags: updatedPost.tags } : post
            ));
            setEditingPostId(null);
        } catch (error) {
            console.error('Failed to save post edits:', error);
            setAuthError('Failed to save post edits.');
        }
    };

    const handlePostUpload = async (e) => {
        e.preventDefault();
        const fileInput = e.target.elements.postImage;
        const captionInput = e.target.elements.postCaption;
        const locationInput = e.target.elements.postLocation;
        const tagsInput = e.target.elements.postTags;
        const files = fileInput.files;
        if (!files || files.length === 0) return;
        
        setIsSubmitting(true);
        try {
            await uploadGuidePost(guideProfile.id, files, locationInput.value, captionInput.value, tagsInput ? tagsInput.value : '');
            const posts = await getGuidePosts(guideProfile.id);
            setGuidePosts(posts);
            fileInput.value = "";
            captionInput.value = "";
            locationInput.value = "";
            if (tagsInput) tagsInput.value = "";
            const promptElement = document.getElementById('fileUploadPrompt');
            if (promptElement) {
                promptElement.textContent = 'Click to select photos or videos';
                promptElement.style.color = 'var(--lp-text-dark)';
            }
        } catch (error) {
            console.error('Failed to upload post:', error);
            setAuthError('Failed to upload posts.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDestinationImageUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsSubmitting(true);
        try {
            await uploadDestinationImages(guideProfile.id, files);
            const refreshed = await getGuideByEmail(guideProfile.email);
            setGuideProfile(refreshed);
        } catch (error) {
            console.error('Failed to upload destination images:', error);
            setAuthError('Failed to upload destination images.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDestinationImageDelete = async (fileName) => {
        if (!window.confirm("Are you sure you want to delete this destination image?")) return;
        setIsSubmitting(true);
        try {
            await deleteDestinationImage(guideProfile.id, fileName);
            const refreshed = await getGuideByEmail(guideProfile.email);
            setGuideProfile(refreshed);
        } catch (error) {
            console.error('Failed to delete destination image:', error);
            setAuthError('Failed to delete image.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setAuthError('');
    };

    const handleMapClick = (e) => {
        const lat = e.detail.latLng.lat;
        const lng = e.detail.latLng.lng;
        setFormData({ ...formData, latitude: lat, longitude: lng });
    };

    // =============================================
    // Sign In
    // =============================================
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
            const result = await signIn.create({
                identifier: formData.email,
                password: formData.password,
            });

            if (result.status === "complete") {
                await setSignInActive({ session: result.createdSessionId });
                // Profile fetch/create happens in the useEffect above
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

    // =============================================
    // Sign Up — Step 1a: Collect email + name
    // =============================================
    const handleProceedToDetails = () => {
        if (!formData.email.trim()) { setAuthError('Email is required'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) { setAuthError('Please enter a valid email address'); return; }
        if (!firstName.trim()) { setAuthError('First name is required'); return; }
        if (!lastName.trim()) { setAuthError('Last name is required'); return; }
        setAuthError('');
        setSignUpSubStep('details');
    };

    // =============================================
    // Sign Up — Step 1b: Collect password, DOB, gender, mobile → create Clerk account
    // =============================================
    const handleClerkSignUp = async () => {
        if (!firstName.trim()) { setAuthError('First name is required'); return; }
        if (!lastName.trim()) { setAuthError('Last name is required'); return; }
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
                firstName: firstName.trim(),
                lastName: lastName.trim()
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

    // =============================================
    // Sign Up — Step 1c: Confirm email OTP → create guide in backend
    // =============================================
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
                // Create guide with basic info immediately
                try {
                    const newGuide = await createGuide({
                        name: `${firstName.trim()} ${lastName.trim()}`,
                        email: formData.email,
                        dateOfBirth: formData.dateOfBirth,
                        gender: formData.gender,
                        mobileNumber: formData.mobileNumber,
                        rating: 5.0
                    });
                    setGuideProfile(newGuide);
                } catch (createError) {
                    console.error('Guide creation error:', createError);
                    // Profile might already exist if useEffect fired first
                    try {
                        const existing = await getGuideByEmail(formData.email);
                        setGuideProfile(existing);
                    } catch {
                        setAuthError('Account created but profile setup failed. Please sign in again.');
                    }
                }
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

    // =============================================
    // Logout
    // =============================================
    const handleLogout = async () => {
        setIsSubmitting(true);
        try {
            await signOut();
            setGuideProfile(null);
            setFormData({
                name: '', email: '', password: '', dateOfBirth: '', gender: '',
                mobileNumber: '', city: '', bio: '', pricePerDay: '', latitude: null, longitude: null
            });
            setFirstName('');
            setLastName('');
            setSignUpSubStep('initial');
            setIsLoginMode(false);
            setAwaitingConfirmation(false);
            setProfileEditMode(false);
            setActiveTab('overview');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // =============================================
    // Identity Verification (Didit)
    // =============================================
    const handleRefreshStatus = async () => {
        setIsSubmitting(true);
        setAuthError('');
        try {
            const data = await getVerificationStatus(guideProfile.id);
            console.log("Raw Didit API Response:", data);
            
            if (data && data.verificationStatus) {
                setGuideProfile(prev => ({ ...prev, verificationStatus: data.verificationStatus }));
            }
            
            // Temporary debug display so user can see exactly what Didit returned
            if (data && data.status) {
                setAuthError(`Debug - Didit returned: "${data.status}". If this is unexpected, we need to add this string to our backend.`);
            }
        } catch (err) {
            console.error('Error refreshing status:', err);
            setAuthError('Error refreshing status. Check console.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartIdentityVerification = async () => {
        setIsSubmitting(true);
        setAuthError('');
        try {
            const sessionData = await createVerificationSession(guideProfile.id);
            if (sessionData && sessionData.url) {
                // Refresh profile so we have the new diditSessionId
                const refreshed = await getGuideByEmail(guideProfile.email);
                setGuideProfile(refreshed);

                DiditSdk.shared.onComplete = async (result) => {
                    console.log("Didit verification result:", result);
                    if (result.type === 'completed') {
                        // Refresh profile to potentially get the new status
                        const afterVerify = await getGuideByEmail(guideProfile.email);
                        setGuideProfile(afterVerify);
                    } else if (result.type === 'failed') {
                        setAuthError('Verification failed: ' + result.error?.message);
                    }
                };
                DiditSdk.shared.startVerification({ url: sessionData.url });
            } else {
                setAuthError('Could not start verification session.');
            }
        } catch (err) {
            console.error('Error starting verification:', err);
            setAuthError('Failed to start verification. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetVerification = async () => {
        if (!window.confirm("Are you sure you want to reset your verification? This will permanently wipe your current Didit session.")) return;
        setIsSubmitting(true);
        setAuthError('');
        try {
            await resetVerification(guideProfile.id);
            const refreshed = await getGuideByEmail(guideProfile.email);
            setGuideProfile(refreshed);
        } catch (err) {
            console.error('Error resetting verification:', err);
            setAuthError('Failed to reset verification.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // =============================================
    // Profile Setup Submit
    // =============================================
    const validateProfileData = () => {
        if (!formData.city.trim()) { setAuthError('City is required'); return false; }
        if (!formData.bio.trim()) { setAuthError('Bio is required'); return false; }
        if (!formData.pricePerDay) { setAuthError('Price is required'); return false; }
        if (!formData.latitude || !formData.longitude) { setAuthError('Please pin your location'); return false; }
        setAuthError('');
        return true;
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!validateProfileData()) return;
        setIsSubmitting(true);
        try {
            await updateGuide(guideProfile.id, {
                city: formData.city,
                bio: formData.bio,
                pricePerDay: parseFloat(formData.pricePerDay),
                latitude: formData.latitude,
                longitude: formData.longitude,
                tripDurationDays: formData.tripDurationDays ? parseInt(formData.tripDurationDays, 10) : null,
                locationsShown: formData.locationsShown,
                servicesProvided: formData.servicesProvided
            });
            // Refresh profile
            const refreshed = await getGuideByEmail(guideProfile.email);
            setGuideProfile(refreshed);
            setActiveTab('overview');
        } catch (error) {
            console.error('Profile submission error:', error);
            setAuthError('Something went wrong updating profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper: is the guide profile "complete" (has profile data)?
    const isProfileComplete = guideProfile && guideProfile.city && guideProfile.bio && guideProfile.latitude;

    // =============================================
    // RENDER: Dashboard (logged in + profile exists)
    // =============================================
    // =============================================
    if (guideProfile) {
        const isVerified = guideProfile.verificationStatus === 'VERIFIED';
        const isPending = guideProfile.verificationStatus === 'PENDING' || !guideProfile.verificationStatus;
        const isProfileComplete = !!(guideProfile.city && guideProfile.bio && guideProfile.pricePerDay);

        return (
            <div className="reg-page">
                <div className="reg-ambient-orb reg-orb-1"></div>
                <div className="reg-ambient-orb reg-orb-2"></div>

                <div className="dashboard-layout">
                    {/* SIDEBAR */}
                    <aside className="dashboard-sidebar">
                        <div className="logo-mini" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 10px', marginBottom: '10px', color: 'var(--lp-text-dark)' }}>
                            <img src={travGuideLogo} alt="TravGuide Logo" style={{ height: '36px' }} />
                            <span style={{ fontFamily: 'Chillax, sans-serif', fontWeight: '800', fontSize: '1.4rem', letterSpacing: '-0.5px', color: 'var(--lp-text-dark)' }}>TravGuide</span>
                        </div>
                        
                        <nav className="sidebar-nav">
                            <button className={`sidebar-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setAuthError(''); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                                Profile Overview
                            </button>
                            <button className={`sidebar-tab ${activeTab === 'edit_profile' ? 'active' : ''}`} onClick={() => { setActiveTab('edit_profile'); setAuthError(''); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                                    <path d="M12 20h9"/>
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                </svg>
                                Edit Profile
                            </button>
                            <button className={`sidebar-tab ${activeTab === 'verification' ? 'active' : ''}`} onClick={() => { setActiveTab('verification'); setAuthError(''); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                                    <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/>
                                    <path d="m9 12 2 2 4-4"/>
                                </svg>
                                Identity Verification
                            </button>
                            <button className={`sidebar-tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => { setActiveTab('gallery'); setAuthError(''); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                    <circle cx="9" cy="9" r="2"/>
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                </svg>
                                Experience Gallery
                            </button>
                        </nav>

                        <button className="logout-btn" onClick={handleLogout} disabled={isSubmitting} style={{ marginTop: 'auto' }}>
                            {isSubmitting ? 'Logging out...' : 'Log Out'}
                        </button>
                        <button className="dashboard-back-btn" onClick={onCancel} style={{ marginTop: '10px', width: '100%' }}>
                            Go to Main Site
                        </button>
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="dashboard-main">
                        {authError && <div className="auth-error">{authError}</div>}

                        {/* ================= OVERVIEW TAB ================= */}
                        {activeTab === 'overview' && (
                            <div className="dashboard-card">
                                <div className="profile-header">
                                    <div className="profile-avatar-large" style={{ overflow: 'hidden' }}>
                                        {guideProfile.profilePictureUrl ? (
                                            <img src={`http://localhost:8080/api/guides/files/${guideProfile.profilePictureUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lp-text-muted)' }}>
                                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                                                    <circle cx="12" cy="7" r="4"/>
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                    <div className="profile-title-area">
                                        <span className="profile-role">GUIDE PORTAL</span>
                                        <h1>{guideProfile.name || 'Guide Profile'}</h1>
                                        <p className="profile-city" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lp-primary)', flexShrink: 0 }}>
                                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                            {guideProfile.city || 'No city set yet'}
                                        </p>
                                    </div>
                                    <div className={`status-badge ${isVerified ? 'verified' : 'pending'}`}>
                                        <span className="badge-dot"></span>
                                        {isVerified ? 'VERIFIED' : (guideProfile.verificationStatus || 'UNVERIFIED')}
                                    </div>
                                </div>
                                <hr className="dashboard-divider" />
                                
                                {!isProfileComplete && (
                                    <div className="verify-cta-section" style={{ marginBottom: '20px' }}>
                                        <div className="verify-cta-card">
                                            <div className="verify-cta-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lp-primary)' }}>
                                                    <path d="M12 20h9"/>
                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                                </svg>
                                            </div>
                                            <div className="verify-cta-text">
                                                <h3>Profile Incomplete</h3>
                                                <p>Add your city, bio, and daily rate to start receiving bookings.</p>
                                            </div>
                                            <button className="verify-cta-btn" onClick={() => { setActiveTab('edit_profile'); setAuthError(''); }}>
                                                Complete Profile →
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="profile-section-box" style={{ marginBottom: '24px' }}>
                                    <h2 className="profile-section-title">Biography</h2>
                                    <p className="profile-bio-text">
                                        {guideProfile.bio || "No bio added yet."}
                                    </p>
                                </div>

                                <div className="dashboard-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' }}>
                                    {/* Left Column: Account & Pricing */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* Account Section */}
                                        <div className="profile-section-box">
                                            <h2 className="profile-section-title">Account</h2>
                                            <div className="profile-info-row">
                                                <span className="profile-info-label">Email</span>
                                                <span className="profile-info-value">{guideProfile.email || 'N/A'}</span>
                                            </div>
                                            <div className="profile-info-row">
                                                <span className="profile-info-label">Mobile</span>
                                                <span className="profile-info-value">{guideProfile.mobileNumber || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Pricing Section */}
                                        <div className="profile-section-box">
                                            <h2 className="profile-section-title">Pricing</h2>
                                            <div className="profile-info-row">
                                                <span className="profile-info-label">Daily Rate</span>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                                    <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--lp-text-dark)' }}>${guideProfile.pricePerDay || '0'}</span>
                                                    <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--lp-text-muted)' }}>/day</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Tour Details */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* Tour Details Section */}
                                        <div className="profile-section-box">
                                            <h2 className="profile-section-title">Tour Details</h2>
                                            <div className="profile-info-row">
                                                <span className="profile-info-label">Duration</span>
                                                <span className="profile-info-value">{guideProfile.tripDurationDays ? `${guideProfile.tripDurationDays} Days` : 'N/A'}</span>
                                            </div>
                                            <div className="profile-info-row">
                                                <span className="profile-info-label">Locations</span>
                                                <span className="profile-info-value">{guideProfile.locationsShown || 'N/A'}</span>
                                            </div>
                                            <div className="profile-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', borderBottom: 'none', paddingBottom: 0 }}>
                                                <span className="profile-info-label">Included Services</span>
                                                <span className="profile-info-value" style={{ lineHeight: '1.5', whiteSpace: 'pre-line' }}>{guideProfile.servicesProvided || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= EDIT PROFILE TAB ================= */}
                        {activeTab === 'edit_profile' && (
                            <div className="dashboard-card">
                                <form onSubmit={(e) => {
                                    handleProfileSubmit(e);
                                }} className="reg-card-inner">
                                        <div className="reg-card-header">
                                        <span className="reg-tag">Profile Setup</span>
                                        <h1>Edit your guide profile</h1>
                                        <p>Tell travelers about your expertise.</p>
                                    </div>
                                    <div className="reg-fields">
                                        <div className="reg-field" style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            <label>Profile Picture</label>
                                            <div className="profile-avatar-large" style={{ overflow: 'hidden', margin: '0 auto 10px auto', cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('profilePicInput').click()}>
                                                {guideProfile.profilePictureUrl ? (
                                                    <img src={`http://localhost:8080/api/guides/files/${guideProfile.profilePictureUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lp-text-muted)' }}>
                                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                                                            <circle cx="12" cy="7" r="4"/>
                                                        </svg>
                                                    </span>
                                                )}
                                                <div style={{ position: 'absolute', bottom: 0, background: 'rgba(0,0,0,0.5)', width: '100%', color: '#fff', fontSize: '12px', padding: '5px 0' }}>Change</div>
                                            </div>
                                            <input type="file" id="profilePicInput" style={{ display: 'none' }} accept="image/*" onChange={handleProfilePictureChange} />
                                        </div>
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
                                        <div className="reg-row">
                                            <div className="reg-field">
                                                <label>Trip Duration (Days)</label>
                                                <input type="number" name="tripDurationDays" value={formData.tripDurationDays} onChange={handleChange} placeholder="e.g., 3" min="1" />
                                            </div>
                                            <div className="reg-field">
                                                <label>Locations Shown</label>
                                                <input type="text" name="locationsShown" value={formData.locationsShown} onChange={handleChange} placeholder="Taj Mahal, Agra Fort..." />
                                            </div>
                                        </div>
                                        <div className="reg-field">
                                            <label>Services Provided</label>
                                            <textarea name="servicesProvided" rows="2" value={formData.servicesProvided} onChange={handleChange} placeholder="Transportation, Meals, Lodging..."></textarea>
                                        </div>
                                        <div className="reg-field">
                                            <label>Tour Destinations (Images)</label>
                                            <div style={{ background: 'rgba(157, 102, 56, 0.05)', padding: '15px', borderRadius: '8px', border: '1px dashed rgba(157, 102, 56, 0.3)', marginBottom: '10px' }}>
                                                <input type="file" id="destImageInput" style={{ display: 'none' }} accept="image/*" multiple onChange={handleDestinationImageUpload} />
                                                <button 
                                                     type="button" 
                                                     onClick={() => document.getElementById('destImageInput').click()} 
                                                     style={{ background: '#fff', border: '1.5px solid var(--lp-primary)', color: 'var(--lp-primary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s' }}
                                                     onMouseOver={(e) => { e.currentTarget.style.background = 'var(--lp-primary)'; e.currentTarget.style.color = '#fff'; }}
                                                     onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--lp-primary)'; }}
                                                 >
                                                     + Add Photos
                                                 </button>
                                                <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#666' }}>Upload images of locations you take tourists to.</span>
                                            </div>
                                            {guideProfile.destinationImages && guideProfile.destinationImages.split(',').filter(Boolean).length > 0 && (
                                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                                    {guideProfile.destinationImages.split(',').filter(Boolean).map((fileName, idx) => (
                                                        <div key={idx} style={{ position: 'relative', minWidth: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                                            <img src={`http://localhost:8080/api/guides/files/${fileName}`} alt="Destination" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleDestinationImageDelete(fileName)}
                                                                style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="reg-field">
                                            <label>Pin Location <span className="req">*</span></label>
                                            <div className="reg-map-box">
                                                <MapContainer 
                                                    center={[20.5937, 78.9629]} 
                                                    zoom={4} 
                                                    scrollWheelZoom={true}
                                                    style={{ width: '100%', height: '100%', zIndex: 1 }}
                                                >
                                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                    <MapClickHandler onClick={handleMapClick} />
                                                    <MapSearchControl onLocationFound={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))} />
                                                    {formData.latitude && (
                                                        <Marker position={[formData.latitude, formData.longitude]} />
                                                    )}
                                                </MapContainer>
                                            </div>
                                            {formData.latitude ? <span className="reg-loc-ok">✓ Location pinned</span> : <span className="reg-loc-hint">Click on the map to drop a pin</span>}
                                        </div>
                                    </div>
                                    <div className="reg-btn-row">
                                        <button type="submit" className="reg-submit-btn" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <div className="btn-loading-content">
                                                    <span className="spinner"></span>
                                                    <span>Saving...</span>
                                                </div>
                                            ) : (
                                                'Save Profile'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ================= VERIFICATION TAB ================= */}
                        {activeTab === 'verification' && (
                            <div className="dashboard-card">
                                <div className="reg-card-inner">
                                        <div className="reg-card-header">
                                            <span className="reg-tag">Trust & Safety</span>
                                            <h1>Identity Verification</h1>
                                            <p>We use Didit to securely verify your identity.</p>
                                        </div>
                                        <hr className="dashboard-divider" />
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <h3>Current Status</h3>
                                            <button onClick={handleRefreshStatus} disabled={isSubmitting} style={{background: 'none', border: 'none', color: 'var(--lp-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem', fontWeight: 'bold'}}>
                                                {isSubmitting ? 'Refreshing...' : 'Refresh Status'}
                                            </button>
                                        </div>

                                        <div className="verification-status-box" style={{marginTop: '0'}}>
                                            {isPending && (
                                                <p className="status-explain warning" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                        <circle cx="12" cy="12" r="10"/>
                                                        <polyline points="12 6 12 12 16 14"/>
                                                    </svg>
                                                    <span><strong>Not Verified:</strong> Please complete verification to appear in search results.</span>
                                                </p>
                                            )}
                                            {isVerified && (
                                                <p className="status-explain success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                                        <polyline points="22 4 12 14.01 9 11.01"/>
                                                    </svg>
                                                    <span><strong>Verified:</strong> Your identity is verified!</span>
                                                </p>
                                            )}
                                            {guideProfile.verificationStatus === 'REJECTED' && (
                                                <p className="status-explain danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                        <circle cx="12" cy="12" r="10"/>
                                                        <line x1="15" y1="9" x2="9" y2="15"/>
                                                        <line x1="9" y1="9" x2="15" y2="15"/>
                                                    </svg>
                                                    <span><strong>Failed:</strong> Verification did not pass. Please contact support.</span>
                                                </p>
                                            )}
                                        </div>

                                        {!isVerified && (
                                            <div className="verify-cta-section" style={{ marginTop: '30px' }}>
                                                <div className="verify-cta-card">
                                                    <div className="verify-cta-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lp-primary)' }}>
                                                            <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/>
                                                        </svg>
                                                    </div>
                                                    <div className="verify-cta-text">
                                                        <h3>Verify with Didit</h3>
                                                        <p>Have your ID ready (Passport, National ID, or Driver's License).</p>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        <button className="verify-cta-btn" onClick={handleStartIdentityVerification} disabled={isSubmitting}>
                                                            {isSubmitting ? 'Starting...' : 'Verify Identity →'}
                                                        </button>
                                                        {guideProfile.diditSessionId && (
                                                            <button 
                                                                onClick={handleResetVerification} 
                                                                disabled={isSubmitting}
                                                                style={{ background: 'none', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                                                            >
                                                                Restart Verification
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                        {/* ================= GALLERY TAB ================= */}
                        {activeTab === 'gallery' && (
                            <div className="dashboard-card">
                                <div className="reg-card-inner">
                                        <div className="reg-card-header">
                                            <span className="reg-tag">Experience Gallery</span>
                                            <h1>Share Your Trips</h1>
                                            <p>Upload photos of your past tours to show travelers what to expect!</p>
                                        </div>
                                        
                                        <form onSubmit={handlePostUpload} style={{ marginBottom: '40px', background: 'rgba(157, 102, 56, 0.05)', padding: '20px', borderRadius: '12px', border: '1px dashed rgba(157, 102, 56, 0.3)' }}>
                                            <div className="reg-field" style={{ marginBottom: '20px' }}>
                                                 <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Select Photo(s) / Video(s) <span className="req">*</span></label>
                                                 <div 
                                                     style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(157, 102, 56, 0.25)', padding: '28px', borderRadius: '12px', background: '#fff', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }} 
                                                     onClick={() => document.getElementById('postImageInput').click()}
                                                     onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--lp-primary)'}
                                                     onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(157, 102, 56, 0.25)'}
                                                 >
                                                     <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lp-primary)', marginBottom: '8px' }}>
                                                         <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                         <polyline points="17 8 12 3 7 8"/>
                                                         <line x1="12" y1="3" x2="12" y2="15"/>
                                                     </svg>
                                                     <span id="fileUploadPrompt" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--lp-text-dark)' }}>
                                                         Click to select photos or videos
                                                     </span>
                                                     <span style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)', marginTop: '4px' }}>
                                                         You can select multiple files at once (Images or Videos up to 400MB)
                                                     </span>
                                                     <input 
                                                         type="file" 
                                                         id="postImageInput"
                                                         name="postImage" 
                                                         accept="image/*,video/*" 
                                                         multiple 
                                                         required 
                                                         style={{ display: 'none' }} 
                                                         onChange={(e) => {
                                                             const files = e.target.files;
                                                             const prompt = document.getElementById('fileUploadPrompt');
                                                             if (files && files.length > 0) {
                                                                 prompt.textContent = `${files.length} media file(s) selected`;
                                                                 prompt.style.color = 'var(--lp-primary)';
                                                             } else {
                                                                 prompt.textContent = 'Click to select photos or videos';
                                                                 prompt.style.color = 'var(--lp-text-dark)';
                                                             }
                                                         }}
                                                     />
                                                 </div>
                                             </div>
                                            <div className="reg-row">
                                                <div className="reg-field">
                                                    <label>Location (Optional)</label>
                                                    <input type="text" name="postLocation" placeholder="E.g., Eiffel Tower, Paris" style={{ background: '#fff' }} />
                                                </div>
                                                <div className="reg-field">
                                                    <label>Caption (Optional)</label>
                                                    <input type="text" name="postCaption" placeholder="E.g., Sunrise tour" style={{ background: '#fff' }} />
                                                </div>
                                                <div className="reg-field">
                                                    <label>Tags (Optional)</label>
                                                    <input type="text" name="postTags" placeholder="E.g., hiking, history, culture" style={{ background: '#fff' }} />
                                                </div>
                                            </div>
                                            <button type="submit" className="reg-submit-btn" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                                                {isSubmitting ? 'Uploading...' : 'Upload Photos'}
                                            </button>
                                        </form>

                                        {guidePosts && guidePosts.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: '24px' }}>
                                                {guidePosts.map(post => {
                                                    const imageUrlsStr = post.imageUrls || post.imageUrl || "";
                                                    const images = imageUrlsStr ? imageUrlsStr.split(',').filter(Boolean) : [];
                                                    const activeIndex = postCarouselIndices[post.id] || 0;
                                                    const currentImage = images[activeIndex];
                                                    
                                                    return (
                                                        <div key={post.id} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(157, 102, 56, 0.12)', background: '#fff', boxShadow: '0 4px 12px rgba(157, 102, 56, 0.04)', display: 'flex', flexDirection: 'column' }}>
                                                            {/* Post Header */}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(157, 102, 56, 0.08)' }}>
                                                                {post.location && editingPostId !== post.id ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--lp-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                                                            <circle cx="12" cy="10" r="3"/>
                                                                        </svg>
                                                                        <span>{post.location}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ color: 'var(--lp-text-muted)', fontSize: '0.85rem' }}>
                                                                        {editingPostId === post.id ? 'Editing Post...' : 'Experience Trip'}
                                                                    </div>
                                                                )}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {editingPostId !== post.id && (
                                                                        <>
                                                                            {/* Edit Button */}
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => handleStartEditPost(post)}
                                                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--lp-text-muted)', display: 'flex', alignItems: 'center' }}
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <path d="M12 20h9"/>
                                                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                                                                </svg>
                                                                            </button>
                                                                            {/* Delete Button */}
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => handleDeletePost(post.id)}
                                                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#ff4d4d', display: 'flex', alignItems: 'center' }}
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <path d="M3 6h18"/>
                                                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                                                                </svg>
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>
                                                                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Post Image Slide */}
                                                            <div style={{ position: 'relative', width: '100%', height: '280px', background: '#f5f5f5', overflow: 'hidden' }}>
                                                                {currentImage ? (
                                                                    isVideoFile(currentImage) ? (
                                                                        <video 
                                                                            src={`http://localhost:8080/api/guides/files/${currentImage}`} 
                                                                            controls 
                                                                            playsInline
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                                        />
                                                                    ) : (
                                                                        <img 
                                                                            src={`http://localhost:8080/api/guides/files/${currentImage}`} 
                                                                            alt="Post Slide" 
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                                        />
                                                                    )
                                                                ) : (
                                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Media</div>
                                                                )}

                                                                {images.length > 1 && (
                                                                    <>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={(e) => { e.stopPropagation(); handlePrevImage(post.id, images.length); }}
                                                                            style={{
                                                                                position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
                                                                                background: 'rgba(255, 255, 255, 0.8)', border: 'none', borderRadius: '50%',
                                                                                width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                                                justifyContent: 'center', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                                                zIndex: 2
                                                                            }}
                                                                        >
                                                                            ←
                                                                        </button>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={(e) => { e.stopPropagation(); handleNextImage(post.id, images.length); }}
                                                                            style={{
                                                                                position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
                                                                                background: 'rgba(255, 255, 255, 0.8)', border: 'none', borderRadius: '50%',
                                                                                width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                                                justifyContent: 'center', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                                                zIndex: 2
                                                                            }}
                                                                        >
                                                                            →
                                                                        </button>
                                                                        <div style={{
                                                                            position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex',
                                                                            justifyContent: 'center', gap: '6px', zIndex: 2
                                                                        }}>
                                                                            {images.map((_, idx) => (
                                                                                <span 
                                                                                    key={idx}
                                                                                    style={{
                                                                                        width: '6px', height: '6px', borderRadius: '50%',
                                                                                        background: idx === activeIndex ? '#FF653F' : 'rgba(255, 255, 255, 0.6)',
                                                                                        transition: 'background 0.2s'
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Post Footer */}
                                                            <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {editingPostId === post.id ? (
                                                                    <>
                                                                        {/* Location Edit */}
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--lp-text-muted)' }}>Location</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={editForm.location}
                                                                                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                                                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid rgba(157, 102, 56, 0.2)', background: '#fff' }}
                                                                            />
                                                                        </div>
                                                                        {/* Caption Edit */}
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--lp-text-muted)' }}>Caption</label>
                                                                            <textarea 
                                                                                rows="2"
                                                                                value={editForm.caption}
                                                                                onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                                                                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid rgba(157, 102, 56, 0.2)', background: '#fff', resize: 'vertical' }}
                                                                            />
                                                                        </div>
                                                                        {/* Tags Edit */}
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--lp-text-muted)' }}>Tags (comma-separated)</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={editForm.tags}
                                                                                onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                                                                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid rgba(157, 102, 56, 0.2)', background: '#fff' }}
                                                                            />
                                                                        </div>
                                                                        {/* Action Buttons */}
                                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => handleSaveEditPost(post.id)}
                                                                                style={{ flex: 1, padding: '6px 0', fontSize: '0.85rem', fontWeight: '600', color: '#fff', background: 'var(--lp-primary)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                                            >
                                                                                Save
                                                                            </button>
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={handleCancelEditPost}
                                                                                style={{ flex: 1, padding: '6px 0', fontSize: '0.85rem', fontWeight: '600', color: 'var(--lp-text-dark)', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {/* Likes Actions */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => handleLikePost(post.id)}
                                                                                style={{
                                                                                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                                                                    display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4d4d'
                                                                                }}
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                                                                                </svg>
                                                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--lp-text-dark)' }}>{post.likesCount || 0}</span>
                                                                            </button>
                                                                        </div>

                                                                        {/* Caption */}
                                                                        {post.caption && (
                                                                            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', lineHeight: '1.45', color: 'var(--lp-text-dark)' }}>
                                                                                {post.caption}
                                                                            </p>
                                                                        )}

                                                                        {/* Tags */}
                                                                        {post.tags && post.tags.trim() && (
                                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
                                                                                {post.tags.split(',').map((tag, tIdx) => {
                                                                                    const cleanTag = tag.trim().replace(/^#/, '');
                                                                                    if (!cleanTag) return null;
                                                                                    return (
                                                                                        <span key={tIdx} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--lp-primary)', background: 'rgba(157, 102, 56, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                                                                                            #{cleanTag}
                                                                                        </span>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#777' }}>
                                                <span style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lp-text-muted)' }}>
                                                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                                                        <circle cx="12" cy="13" r="3"/>
                                                    </svg>
                                                </span>
                                                <p>No photos uploaded yet.</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        );
    }

    // =============================================
    // RENDER: Sign Up / Sign In (not logged in)
    // =============================================
    return (
        <div className="reg-page">
            <div className="reg-ambient-orb reg-orb-1"></div>
            <div className="reg-ambient-orb reg-orb-2"></div>

            <button className="reg-back" onClick={onCancel}>
                <span>←</span> Back
            </button>

            <div className="reg-card" style={{ maxWidth: '560px' }}>

                {/* Error banner */}
                {authError && (
                    <div className="auth-error">{authError}</div>
                )}

                {/* ===== SIGN IN ===== */}
                {isLoginMode && !awaitingConfirmation && (
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
                        <p className="auth-toggle-link" style={{ textAlign: 'center', marginTop: '20px', color: 'var(--lp-text-muted)', fontSize: '0.9rem' }}>
                            New here?{' '}
                            <span onClick={() => { setIsLoginMode(false); setAuthError(''); }} style={{ color: 'var(--lp-primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
                                Register as a Guide
                            </span>
                        </p>
                    </form>
                )}

                {/* ===== SIGN UP — Sub-step: initial (email + name) ===== */}
                {!isLoginMode && !awaitingConfirmation && signUpSubStep === 'initial' && (
                    <div className="reg-card-inner">
                        <div className="reg-card-header">
                            <span className="reg-tag">Create Account</span>
                            <h1>Become a Guide</h1>
                            <p>Create your account to get started. Verification comes later.</p>
                        </div>
                        <div className="reg-fields">
                            <div className="reg-field">
                                <label>Work email <span className="req">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@email.com"
                                    autoFocus
                                />
                            </div>
                            <div className="reg-row">
                                <div className="reg-field">
                                    <label>First name <span className="req">*</span></label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => { setFirstName(e.target.value); setAuthError(''); }}
                                        placeholder="First name"
                                    />
                                </div>
                                <div className="reg-field">
                                    <label>Last name <span className="req">*</span></label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => { setLastName(e.target.value); setAuthError(''); }}
                                        placeholder="Last name"
                                    />
                                </div>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                            By signing up, you agree to TravGuide's <a href="#terms" style={{ color: 'var(--lp-primary)', fontWeight: '600' }}>terms of service</a> and <a href="#privacy" style={{ color: 'var(--lp-primary)', fontWeight: '600' }}>privacy policy</a>.
                        </p>
                        <button type="button" className="reg-next-btn" onClick={handleProceedToDetails}>
                            Get started for free
                        </button>
                        <p className="auth-toggle-link" style={{ textAlign: 'center', marginTop: '16px', color: 'var(--lp-text-muted)', fontSize: '0.85rem' }}>
                            Already have an account?{' '}
                            <span onClick={() => { setIsLoginMode(true); setAuthError(''); }} style={{ color: 'var(--lp-primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
                                Sign In
                            </span>
                        </p>
                    </div>
                )}

                {/* ===== SIGN UP — Sub-step: details (password, DOB, gender, mobile) ===== */}
                {!isLoginMode && !awaitingConfirmation && signUpSubStep === 'details' && (
                    <div className="reg-card-inner">
                        <div className="reg-card-header">
                            <span className="reg-tag">Create Account — Details</span>
                            <h1>A few more details</h1>
                            <p>Let's complete your secure credentials.</p>
                        </div>
                        <div className="reg-fields">
                            <div className="reg-field">
                                <label>Password <span className="req">*</span></label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min 8 characters"
                                    autoFocus
                                />
                            </div>
                            <div className="reg-row">
                                <div className="reg-field">
                                    <label>Date of Birth <span className="req">*</span></label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                    />
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
                                <input
                                    type="tel"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    placeholder="+919876543210"
                                />
                                <span className="reg-loc-hint">Include country code (e.g. +91)</span>
                            </div>
                        </div>
                        {/* Clerk Captcha Placeholder for Bot Protection */}
                        <div id="clerk-captcha"></div>
                        <div className="reg-btn-row">
                            <button type="button" className="reg-back-step" onClick={() => setSignUpSubStep('initial')}>
                                ← Back
                            </button>
                            <button type="button" className="reg-submit-btn" onClick={handleClerkSignUp} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <div className="btn-loading-content">
                                        <span className="spinner"></span>
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    'Create Account & Verify →'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== EMAIL VERIFICATION CODE ===== */}
                {awaitingConfirmation && (
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
                                'Verify & Create Account →'
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className="reg-footer">
                <span onClick={onCancel} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <img src={travGuideLogo} alt="TravGuide Logo" style={{ height: '20px' }} />
                    <span style={{ fontFamily: 'Chillax, sans-serif', fontWeight: '800' }}>TravGuide</span>
                </span>
            </div>
        </div>
    );
};

export default RegisterGuide;
