document.addEventListener('DOMContentLoaded', () => {
    // Force autoplay video on mobile
    const heroVideo = document.querySelector('.hero-video-bg');
    if (heroVideo) {
        heroVideo.muted = true;
        heroVideo.setAttribute('muted', '');
        heroVideo.setAttribute('playsinline', '');
        const playPromise = heroVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Retry on user interaction
                const playOnInteract = () => {
                    heroVideo.play();
                    document.removeEventListener('touchstart', playOnInteract);
                    document.removeEventListener('click', playOnInteract);
                    document.removeEventListener('scroll', playOnInteract);
                };
                document.addEventListener('touchstart', playOnInteract, { once: true });
                document.addEventListener('click', playOnInteract, { once: true });
                document.addEventListener('scroll', playOnInteract, { once: true });
            });
        }
    }

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    const heroSection = document.getElementById('home');
    
    window.addEventListener('scroll', () => {
        const heroHeight = heroSection ? heroSection.offsetHeight : 700;
        
        // Navbar background + dark text only appear after scrolling past hero video
        if (window.scrollY > heroHeight - 100) {
            navbar.classList.add('scrolled');
            document.body.classList.add('scrolled-past-hero');
        } else {
            navbar.classList.remove('scrolled');
            document.body.classList.remove('scrolled-past-hero');
        }
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth Scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                // If mobile menu is open, close it
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }

                const yOffset = -80; // offset for fixed header
                const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                
                window.scrollTo({
                    top: y,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form Submission Handler
    const bookingForm = document.getElementById('booking-form');
    const formSuccess = document.getElementById('form-success');
    const submitBtn = bookingForm ? bookingForm.querySelector('.submit-btn') : null;

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulate form submission delay
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Đang gửi...';
                submitBtn.disabled = true;
                
                setTimeout(() => {
                    formSuccess.style.display = 'block';
                    bookingForm.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                        formSuccess.style.display = 'none';
                    }, 5000);
                }, 1500);
            }
        });
    }

    // Initialize date input with tomorrow's date
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // Cursor Glow Follower
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
        document.addEventListener('mousemove', (e) => {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';

            // Check if cursor is over the hero/video section
            if (heroSection) {
                const heroRect = heroSection.getBoundingClientRect();
                const isOverHero = e.clientY >= heroRect.top && e.clientY <= heroRect.bottom;
                if (isOverHero) {
                    cursorGlow.classList.add('glow-light');
                } else {
                    cursorGlow.classList.remove('glow-light');
                }
            }
        });
    }
});
