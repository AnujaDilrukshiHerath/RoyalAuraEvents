document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================
     1. Theme Toggle Management
     ========================================== */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  // Initialize theme
  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const setTheme = (theme) => {
    htmlElement.setAttribute('data-theme', theme);
    // Directly override color-scheme to let light-dark() resolve properly
    htmlElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  };

  // Set initial theme
  setTheme(getPreferredTheme());

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });


  /* ==========================================
     2. Event Budget Calculator
     ========================================== */
  const budgetForm = document.getElementById('budget-form');
  const eventTypeSelect = document.getElementById('event-type');
  const guestRangeInput = document.getElementById('guest-range');
  const guestValSpan = document.getElementById('guest-val');
  const tierSelect = document.getElementById('tier-select');
  const durationSelect = document.getElementById('event-duration');
  const priceDisplay = document.getElementById('price-display');

  // Config mapping
  const costConfig = {
    'tamil-wedding': { base: 18000, perGuest: 110 },
    'sinhala-poruwa': { base: 16000, perGuest: 105 },
    'saree-function': { base: 7000, perGuest: 75 },
    'cultural-gala': { base: 14000, perGuest: 95 }
  };

  const tierMultipliers = {
    signature: 1.0,
    royal: 1.5,
    monarch: 2.5
  };

  const updateBudget = () => {
    const eventType = eventTypeSelect.value;
    const guestCount = parseInt(guestRangeInput.value, 10);
    const tier = tierSelect.value;
    const duration = parseInt(durationSelect.value, 10);

    // Update range visual value
    guestValSpan.textContent = guestCount;

    // Calculate
    const config = costConfig[eventType] || costConfig.wedding;
    const tierMultiplier = tierMultipliers[tier] || 1.0;
    const durationMultiplier = 1 + (duration - 1) * 0.4;

    const baseCost = config.base;
    const guestCost = guestCount * config.perGuest;
    const totalCost = Math.round((baseCost + guestCost) * tierMultiplier * durationMultiplier);

    // Format output
    priceDisplay.textContent = totalCost.toLocaleString('en-GB');
  };

  // Listeners
  if (budgetForm) {
    eventTypeSelect.addEventListener('change', updateBudget);
    guestRangeInput.addEventListener('input', updateBudget);
    tierSelect.addEventListener('change', updateBudget);
    durationSelect.addEventListener('change', updateBudget);
    
    // Initial run
    updateBudget();
  }


  /* ==========================================
     3. Testimonials Carousel Slider
     ========================================== */
  const track = document.getElementById('testimonial-track');
  const slides = Array.from(track ? track.children : []);
  const nextBtn = document.getElementById('next-testimonial');
  const prevBtn = document.getElementById('prev-testimonial');
  const dotsContainer = document.getElementById('carousel-dots');
  let currentSlideIndex = 0;

  if (slides.length > 0) {
    // Generate navigation dots dynamically if they aren't static
    const updateDots = () => {
      const dots = Array.from(dotsContainer.children);
      dots.forEach((dot, index) => {
        if (index === currentSlideIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    };

    const moveToSlide = (index) => {
      if (index < 0) {
        index = slides.length - 1;
      } else if (index >= slides.length) {
        index = 0;
      }
      
      currentSlideIndex = index;
      
      // Move track
      const amountToMove = -index * 100;
      track.style.transform = `translateX(${amountToMove}%)`;
      
      // Toggle active states
      slides.forEach((slide, idx) => {
        if (idx === index) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      updateDots();
    };

    nextBtn.addEventListener('click', () => {
      moveToSlide(currentSlideIndex + 1);
    });

    prevBtn.addEventListener('click', () => {
      moveToSlide(currentSlideIndex - 1);
    });

    // Make dots clickable
    const dots = Array.from(dotsContainer.children);
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        moveToSlide(index);
      });
    });

    // Auto play every 7 seconds
    setInterval(() => {
      moveToSlide(currentSlideIndex + 1);
    }, 7000);
  }


  /* ==========================================
     4. Contact Form Validation & Mock Submit
     ========================================== */
  const inquiryForm = document.getElementById('inquiry-form');
  const formSuccess = document.getElementById('form-success');
  const formError = document.getElementById('form-error');

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Reset status
      formSuccess.style.display = 'none';
      formError.style.display = 'none';

      // Perform validation check
      const inputs = inquiryForm.querySelectorAll('[required]');
      let allValid = true;

      inputs.forEach(input => {
        // Trigger manual check validity helper
        if (!input.value.trim() || (input.type === 'email' && !validateEmail(input.value))) {
          input.classList.add('invalid');
          allValid = false;
        } else {
          input.classList.remove('invalid');
        }
      });

      if (allValid) {
        const formData = {
          name: document.getElementById('contact-name').value.trim(),
          email: document.getElementById('contact-email').value.trim(),
          phone: document.getElementById('contact-phone') ? document.getElementById('contact-phone').value.trim() : '',
          message: document.getElementById('contact-message').value.trim()
        };

        fetch('/api/inquire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            formSuccess.style.display = 'block';
            inquiryForm.reset();
            inquiryForm.querySelectorAll('input, textarea').forEach(elem => {
              elem.dispatchEvent(new Event('change'));
            });
            setTimeout(() => { updateBudget(); }, 100);
          } else {
            formError.style.display = 'block';
          }
        })
        .catch(err => {
          formError.style.display = 'block';
        });
      } else {
        formError.style.display = 'block';
      }
    });

    // Helper email format test
    function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    }
  }

});
