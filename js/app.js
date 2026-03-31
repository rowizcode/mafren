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

    // NOTE: Navbar scroll logic (scrolled class, scrolled-past-hero, nav-hidden)
    // is handled entirely by animations.js to avoid conflicting thresholds.

    const heroSection = document.getElementById('home');

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
                
                const lenisInstance = window.__mafrenLenis;
                if (lenisInstance) {
                    lenisInstance.scrollTo(y, { duration: 1.1 });
                } else {
                    window.scrollTo({
                        top: y,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ===== GOOGLE FORMS INTEGRATION =====
    // Hướng dẫn: Thay các giá trị XXX bên dưới bằng thông tin từ Google Form của bạn.
    // 1. GOOGLE_FORM_ACTION_URL: Mở Google Form → Preview → Inspect (F12) → tìm <form action="...">
    //    URL có dạng: https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse
    // 2. ENTRY_IDS: Mỗi câu hỏi có một entry ID riêng, tìm trong source code của form preview
    //    Các input/textarea có name="entry.XXXXXXX"
    
    const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfKG0K3_Q4Cgy4uVZscpqK5_dbJVNc5OUJUUdFCcYESCvAVMw/formResponse';
    
    const ENTRY_IDS = {
        name:    'entry.1726293193',  // Họ và tên
        phone:   'entry.666166766',   // Số điện thoại
        service: 'entry.661370288',   // Dịch vụ
        date:    'entry.1699610610',  // Ngày hẹn
        time:    'entry.1112952994',  // Giờ hẹn
        notes:   'entry.1435920771',  // Ghi chú
    };

    // Form Submission Handler — gửi dữ liệu vào Google Forms
    const bookingForm = document.getElementById('booking-form');
    const formSuccess = document.getElementById('form-success');
    const submitBtn = bookingForm ? bookingForm.querySelector('.submit-btn') : null;

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!submitBtn) return;

            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Đang gửi...';
            submitBtn.disabled = true;

            // Lấy giá trị từ form
            const formData = new FormData();
            formData.append(ENTRY_IDS.name,    document.getElementById('name').value);
            formData.append(ENTRY_IDS.phone,   document.getElementById('phone').value);
            formData.append(ENTRY_IDS.service, document.getElementById('service').value);
            formData.append(ENTRY_IDS.date,    document.getElementById('date').value);
            formData.append(ENTRY_IDS.time,    document.getElementById('time').value);
            formData.append(ENTRY_IDS.notes,   document.getElementById('notes').value);

            try {
                // Gửi POST request tới Google Forms
                // mode: 'no-cors' vì Google Forms không trả CORS headers,
                // nhưng dữ liệu vẫn được ghi nhận thành công.
                await fetch(GOOGLE_FORM_ACTION_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData,
                });

                // Hiện thông báo thành công
                formSuccess.style.display = 'block';
                bookingForm.reset();

                // Ẩn thông báo sau 5 giây
                setTimeout(() => {
                    formSuccess.style.display = 'none';
                }, 5000);
            } catch (error) {
                console.error('Lỗi gửi form:', error);
                alert('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
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

    // NOTE: Cursor glow follower is handled by the unified RAF loop in animations.js
    // to avoid redundant mousemove listeners that cause layout thrashing.
});
