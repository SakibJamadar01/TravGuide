import React from 'react';
import travGuideLogo from '../assets/TravGuideLogo.png';

const LandingPage = ({ onSelectMode }) => {
    return (
        <div className="landing-page-wrapper">
            {/* Header Navigation */}
            <nav className="landing-nav">
                <div className="nav-logo" onClick={() => onSelectMode('landing')}>
                    <img src={travGuideLogo} alt="TravGuide Logo" className="nav-logo-icon" />
                    <span>TravGuide</span>
                </div>
                <div className="nav-links">
                    <a href="#how-it-works">How It Works</a>
                    <a href="#features">Features</a>
                    <button className="nav-btn-outline" onClick={() => onSelectMode('guide')}>Become a Guide</button>
                    <button className="nav-btn-primary" onClick={() => onSelectMode('traveler')}>Explore Guides</button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div className="hero-content">
                    <span className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#FF653F' }}>
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
                        </svg>
                        Connect with verified local experts
                    </span>
                    <h1>Discover the World<br />Through Local Eyes</h1>
                    <p>
                        Skip the tourist traps. Find verified local guides to unlock authentic 
                        cultural experiences, hidden spots, and tailored city tours.
                    </p>
                    <div className="hero-cta-group">
                        <a href="#portals" className="hero-btn-primary">Get Started</a>
                        <a href="#how-it-works" className="hero-btn-secondary">Learn More ↓</a>
                    </div>
                </div>
            </header>

            {/* Portal Selection Section */}
            <section id="portals" className="portals-section">
                <div className="section-header">
                    <h2>Choose Your Path</h2>
                    <p>Whether you're looking to explore a new city or share your local passion, we've got you covered.</p>
                </div>
                <div className="portal-cards-grid">
                    {/* Traveler Card */}
                    <div className="portal-card traveler-card" onClick={() => onSelectMode('traveler')}>
                        <div className="card-bg-image traveler-bg"></div>
                        <div className="card-overlay"></div>
                        <div className="card-body">
                            <span className="card-tag">For Adventurers</span>
                            <h3>I am a Traveler</h3>
                            <p>Find the best local guides based on location, pricing, and custom packages. View real-time availability on our interactive map.</p>
                            <button className="portal-btn traveler-btn">Explore Guides →</button>
                        </div>
                    </div>

                    {/* Guide Card */}
                    <div className="portal-card guide-card" onClick={() => onSelectMode('guide')}>
                        <div className="card-bg-image guide-bg"></div>
                        <div className="card-overlay"></div>
                        <div className="card-body">
                            <span className="card-tag">For Locals</span>
                            <h3>I am a Guide</h3>
                            <p>Share your local secrets, list custom tours, set your own daily rates, and earn money while making new friends.</p>
                            <button className="portal-btn guide-btn">Start Hosting →</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works-section">
                <div className="section-header">
                    <h2>How TravGuide Works</h2>
                    <p>Connecting curious travelers with passionate locals in three simple steps.</p>
                </div>
                <div className="steps-container">
                    <div className="step-column">
                        <div className="step-badge traveler-badge">For Travelers</div>
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-text">
                                <h4>Search Destination</h4>
                                <p>Type in your next destination and view pins of nearby local guides on the interactive map.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-text">
                                <h4>Compare & Connect</h4>
                                <p>Browse detailed bios, reviews, pricing, and services. Review verified badges for peace of mind.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-text">
                                <h4>Book & Explore</h4>
                                <p>Contact your guide directly, plan your customized tour, and explore the destination like a local.</p>
                            </div>
                        </div>
                    </div>

                    <div className="steps-divider"></div>

                    <div className="step-column">
                        <div className="step-badge guide-badge">For Guides</div>
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-text">
                                <h4>Register Profile</h4>
                                <p>Submit your identity document and a quick selfie verification to ensure trust on the platform.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-text">
                                <h4>Set Details</h4>
                                <p>Write your bio, set your daily price in USD, and pin your exact location coordinates on the map.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-text">
                                <h4>Receive Bookings</h4>
                                <p>Once verified, travelers can see your location pin, review your details, and contact you directly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features & Benefits Section */}
            <section id="features" className="features-section">
                <div className="section-header">
                    <h2>Key Platform Features</h2>
                    <p>Designed to provide a secure, interactive, and transparent connection between tourists and guides.</p>
                </div>
                <div className="features-grid">
                    <div className="feature-item">
                        <div className="feature-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.106 5.553a2 2 0 0 0-1.788 0l-3.659 1.83a2 2 0 0 1-1.788 0L3 5v14l3.659 1.83a2 2 0 0 0 1.788 0l3.659-1.83a2 2 0 0 1 1.788 0L21 19V5z"/>
                                <path d="M9 6.75v13.5"/>
                                <path d="M15 3.75v13.5"/>
                            </svg>
                        </div>
                        <h4>Map-Based Interface</h4>
                        <p>Locate guides instantly via location-pinned interactive maps. Select guides nearest to your accommodation or interests.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/>
                            </svg>
                        </div>
                        <h4>Verified Profiles</h4>
                        <p>Our admins perform document checks and selfie matches to verify each guide before letting them appear on the search map.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <h4>Direct Booking</h4>
                        <p>No high booking agency fees. Communicate directly with your selected guide and pay them transparently.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </div>
                        <h4>Reviews & Ratings</h4>
                        <p>Read transparent feedback from other travelers to choose a guide who matches your style and language.</p>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-brand-col">
                        <div className="footer-logo">
                            <img src={travGuideLogo} alt="TravGuide Logo" className="footer-logo-img" />
                            <span>TravGuide</span>
                        </div>
                        <p className="footer-tagline">
                            Unlocking authentic local experiences, customized tours, and trusted connections in every destination.
                        </p>
                        <div className="footer-socials">
                            <a href="#facebook" className="social-icon-btn">FB</a>
                            <a href="#instagram" className="social-icon-btn">IG</a>
                            <a href="#twitter" className="social-icon-btn">TW</a>
                            <a href="#linkedin" className="social-icon-btn">LN</a>
                        </div>
                    </div>

                    <div className="footer-nav-col">
                        <h5>Explore</h5>
                        <ul className="footer-nav-links">
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li><a href="#features">Features</a></li>
                            <li><span onClick={() => onSelectMode('traveler')}>Find Local Guides</span></li>
                        </ul>
                    </div>

                    <div className="footer-nav-col">
                        <h5>For Experts</h5>
                        <ul className="footer-nav-links">
                            <li><span onClick={() => onSelectMode('guide')}>Become a Guide</span></li>
                            <li><a href="#safety">Trust & Safety</a></li>
                            <li><span onClick={() => onSelectMode('guide')}>Guide Portal</span></li>
                        </ul>
                    </div>

                    <div className="footer-subscribe-col">
                        <h5>Get Travel Stories</h5>
                        <p>Receive curated local itineraries and destination highlights directly in your inbox.</p>
                        <form className="footer-subscribe-form" onSubmit={(e) => e.preventDefault()}>
                            <input type="email" placeholder="Your email address" required />
                            <button type="submit">Join</button>
                        </form>
                    </div>
                </div>

                <hr className="footer-divider" />

                <div className="footer-bottom-row">
                    <p className="copyright">&copy; {new Date().getFullYear()} TravGuide. All rights reserved.</p>
                    <div className="footer-bottom-meta">
                        <a href="#privacy">Privacy Policy</a>
                        <a href="#terms">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
