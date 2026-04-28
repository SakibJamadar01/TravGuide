import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { createGuide, uploadIdProof, uploadSelfie } from '../api/guideApi';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const RegisterGuide = ({ onRegisterSuccess, onCancel }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
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
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

    const sendOtp = () => {
        // Simulated OTP — in production, integrate Twilio / Firebase Auth
        setOtpSent(true);
        alert('OTP sent to ' + formData.mobileNumber + ' (simulated: use 1234)');
    };

    const validateStep1 = () => {
        if (!formData.name.trim()) { alert('Full name is required'); return false; }
        if (!formData.email.trim()) { alert('Email is required'); return false; }
        if (!formData.dateOfBirth) { alert('Date of birth is required'); return false; }
        if (!formData.gender) { alert('Gender is required'); return false; }
        if (!formData.mobileNumber.trim()) { alert('Mobile number is required'); return false; }
        if (!otpSent) { alert('Please verify your mobile number'); return false; }
        if (otp !== '1234') { alert('Invalid OTP'); return false; }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.idProofType) { alert('Select an ID proof type'); return false; }
        if (!formData.idProofNumber.trim()) { alert('ID proof number is required'); return false; }
        if (!idProofFile) { alert('Please upload your ID proof'); return false; }
        if (!selfieFile) { alert('Please upload a selfie'); return false; }
        return true;
    };

    const validateStep3 = () => {
        if (!formData.city.trim()) { alert('City is required'); return false; }
        if (!formData.bio.trim()) { alert('Bio is required'); return false; }
        if (!formData.pricePerDay) { alert('Price is required'); return false; }
        if (!formData.latitude || !formData.longitude) { alert('Please pin your location'); return false; }
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

            // Upload files
            if (idProofFile) await uploadIdProof(guide.id, idProofFile);
            if (selfieFile) await uploadSelfie(guide.id, selfieFile);

            onRegisterSuccess();
        } catch (error) {
            console.error('Registration error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="reg-page">
            <div className="reg-ambient-orb reg-orb-1"></div>
            <div className="reg-ambient-orb reg-orb-2"></div>

            <button className="reg-back" onClick={onCancel}>
                <span>←</span> Back
            </button>

            {/* Step indicator */}
            <div className="reg-steps">
                <div className={`reg-step-dot ${step >= 1 ? 'active' : ''}`}><span>01</span></div>
                <div className="reg-step-line"><div className={`reg-step-line-fill ${step >= 2 ? 'filled' : ''}`}></div></div>
                <div className={`reg-step-dot ${step >= 2 ? 'active' : ''}`}><span>02</span></div>
                <div className="reg-step-line"><div className={`reg-step-line-fill ${step >= 3 ? 'filled' : ''}`}></div></div>
                <div className={`reg-step-dot ${step >= 3 ? 'active' : ''}`}><span>03</span></div>
            </div>

            {/* Step 1: Identity */}
            <div className="reg-card" style={{ maxWidth: '560px' }}>
                {step === 1 && (
                    <div className="reg-card-inner">
                        <div className="reg-card-header">
                            <span className="reg-tag">Step 1 of 3 — Identity</span>
                            <h1>Create your account</h1>
                            <p>Enter your details as per your identification document.</p>
                        </div>
                        <div className="reg-fields">
                            <div className="reg-field">
                                <label>Full Name (as per ID) <span className="req">*</span></label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your legal full name" autoFocus required />
                            </div>
                            <div className="reg-field">
                                <label>Email <span className="req">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@email.com" required />
                            </div>
                            <div className="reg-row">
                                <div className="reg-field">
                                    <label>Date of Birth <span className="req">*</span></label>
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
                                </div>
                                <div className="reg-field">
                                    <label>Gender <span className="req">*</span></label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} required>
                                        <option value="">Select</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="reg-field">
                                <label>Mobile Number <span className="req">*</span></label>
                                <div className="otp-row">
                                    <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="+91 9876543210" required />
                                    <button type="button" className="otp-btn" onClick={sendOtp} disabled={!formData.mobileNumber || otpSent}>
                                        {otpSent ? 'Sent ✓' : 'Send OTP'}
                                    </button>
                                </div>
                            </div>
                            {otpSent && (
                                <div className="reg-field">
                                    <label>Enter OTP <span className="req">*</span></label>
                                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="4-digit OTP" maxLength="4" />
                                </div>
                            )}
                        </div>
                        <button className="reg-next-btn" onClick={() => validateStep1() && setStep(2)}>
                            Continue →
                        </button>
                    </div>
                )}

                {/* Step 2: Document Verification */}
                {step === 2 && (
                    <div className="reg-card-inner">
                        <div className="reg-card-header">
                            <span className="reg-tag">Step 2 of 3 — Verification</span>
                            <h1>Verify your identity</h1>
                            <p>Upload a government ID and a selfie for verification.</p>
                        </div>
                        <div className="reg-fields">
                            <div className="reg-row">
                                <div className="reg-field">
                                    <label>ID Proof Type <span className="req">*</span></label>
                                    <select name="idProofType" value={formData.idProofType} onChange={handleChange} required>
                                        <option value="">Select</option>
                                        <option value="AADHAAR">Aadhaar Card</option>
                                        <option value="PAN">PAN Card</option>
                                        <option value="PASSPORT">Passport</option>
                                        <option value="DRIVING_LICENSE">Driving License</option>
                                    </select>
                                </div>
                                <div className="reg-field">
                                    <label>ID Number <span className="req">*</span></label>
                                    <input type="text" name="idProofNumber" value={formData.idProofNumber} onChange={handleChange} placeholder="Enter ID number" required />
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
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Where do you operate?" required />
                                </div>
                                <div className="reg-field">
                                    <label>Rate ($/day) <span className="req">*</span></label>
                                    <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} placeholder="150" min="1" required />
                                </div>
                            </div>
                            <div className="reg-field">
                                <label>Bio <span className="req">*</span></label>
                                <textarea name="bio" rows="3" value={formData.bio} onChange={handleChange} placeholder="What makes you a great guide?" required></textarea>
                            </div>
                            <div className="reg-field">
                                <label>Pin Location <span className="req">*</span></label>
                                <div className="reg-map-box">
                                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                                        <Map
                                            defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
                                            defaultZoom={4}
                                            mapId={'bf50473b22538181'}
                                            onClick={handleMapClick}
                                            gestureHandling={'greedy'}
                                            disableDefaultUI={true}
                                        >
                                            {formData.latitude && (
                                                <AdvancedMarker position={{ lat: formData.latitude, lng: formData.longitude }}>
                                                    <div className="signature-marker" style={{ padding: '5px 10px', fontSize: '13px', border: 'none' }}>📍</div>
                                                </AdvancedMarker>
                                            )}
                                        </Map>
                                    </APIProvider>
                                </div>
                                {formData.latitude ? (
                                    <span className="reg-loc-ok">✓ Location pinned</span>
                                ) : (
                                    <span className="reg-loc-hint">Click on the map to drop a pin</span>
                                )}
                            </div>
                        </div>
                        <div className="reg-btn-row">
                            <button type="button" className="reg-back-step" onClick={() => setStep(2)}>← Back</button>
                            <button type="submit" className="reg-submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating Profile...' : 'Complete Registration'}
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
