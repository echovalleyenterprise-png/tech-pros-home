import Link from "next/link";

// ── Icons (inline SVG to avoid dependency) ────────────────────────────────────
function Icon({ path, className = "w-6 h-6" }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const ICONS = {
  chat:    "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  photo:   "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  clock:   "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  mic:     "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
  heart:   "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  repeat:  "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  check:   "M5 13l4 4L19 7",
  arrow:   "M17 8l4 4m0 0l-4 4m4-4H3",
  dollar:  "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 13v-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  phone:   "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z",
  star:    "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  shield:  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  users:   "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  chart:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  link:    "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  tv:      "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  map:     "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  calendar:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  zap:     "M13 10V3L4 14h7v7l9-11h-7z",
  ban:     "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
};

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
        <Icon path={ICONS.shield} className="w-5 h-5 text-white" />
      </div>
      <div>
        <span className="font-bold text-gray-900 text-lg leading-none">Tech Pros</span>
        <span className="block text-[11px] font-semibold text-blue-600 leading-none tracking-wide uppercase">Home</span>
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          <a href="#marketplace" className="hover:text-blue-600 transition-colors">Marketplace</a>
          <a href="#for-companies" className="hover:text-blue-600 transition-colors">For Companies</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-32 pb-20 px-5 text-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          <Icon path={ICONS.star} className="w-4 h-4 text-blue-500" />
          Built for real people, not just tech experts
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Tech help that
          <span className="text-blue-600 block">actually makes sense</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
          Your AI tech helper — available 24/7, always patient, always in plain English.
          Free forever, or go ad-free with Pro.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5"
          >
            Start for free
            <Icon path={ICONS.arrow} className="w-5 h-5" />
          </Link>
          <a
            href="#for-companies"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold text-lg px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all"
          >
            For installation companies
            <Icon path={ICONS.users} className="w-5 h-5" />
          </a>
        </div>

        {/* Social proof strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          {[
            { icon: ICONS.check, text: "Free forever" },
            { icon: ICONS.check, text: "No credit card required" },
            { icon: ICONS.check, text: "Cancel anytime" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              <Icon path={icon} className="w-4 h-4 text-green-500" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone mockup */}
      <div className="mt-16 max-w-sm mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
          {/* Phone chrome */}
          <div className="bg-blue-600 px-6 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon path={ICONS.shield} className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-sm">Tech Pros Home</div>
              <div className="text-blue-200 text-xs">Support assistant</div>
            </div>
          </div>
          {/* Chat preview */}
          <div className="p-5 space-y-4 bg-gray-50">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-sm">🛡️</div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-sm text-gray-700 leading-relaxed max-w-[85%]">
                Hi there! 👋 What can I help you with today?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white max-w-[85%]">
                My soundbar has no sound after the install
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-sm">🛡️</div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-sm text-gray-700 leading-relaxed max-w-[85%]">
                No problem! What brand is your soundbar? (Sonos, Bose, Samsung, etc.)
              </div>
            </div>
            {/* Typing indicator */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-sm">🛡️</div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
          {/* Input bar */}
          <div className="px-4 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
              <span className="text-sm text-gray-400 flex-1">Type your question here...</span>
              <Icon path={ICONS.mic} className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Pain points ───────────────────────────────────────────────────────────────
function PainPoints() {
  return (
    <section className="py-16 px-5 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Sound familiar?</h2>
        <p className="text-gray-500 mb-12">Most people hit one of these walls after a new install.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { emoji: "📞", problem: "45 minutes on hold", solution: "We answer instantly" },
            { emoji: "📖", problem: "Manual is 200 pages of jargon", solution: "We explain it in plain English" },
            { emoji: "🚗", problem: "Service call is $150+", solution: "We fix it from your phone" },
          ].map(({ emoji, problem, solution }) => (
            <div key={problem} className="bg-gray-50 rounded-2xl p-6 text-left">
              <div className="text-3xl mb-3">{emoji}</div>
              <p className="text-gray-500 line-through text-sm mb-1">{problem}</p>
              <p className="font-semibold text-gray-900">{solution}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: ICONS.chat,
      title: "Ask in plain English",
      desc: "No tech jargon. Describe the problem how you'd describe it to a friend — we'll figure it out.",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: ICONS.photo,
      title: "Send a photo",
      desc: "Don't know what something is called? Take a picture. We'll identify it and tell you exactly what to do.",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: ICONS.mic,
      title: "Voice support",
      desc: "Tap the mic and just talk. Perfect when your hands are busy or typing feels like too much.",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: ICONS.clock,
      title: "Available 24/7",
      desc: "The TV stopped working at 9pm? We're here. No hold music, no business hours, no waiting.",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: ICONS.repeat,
      title: "Ask as many times as you need",
      desc: "Ask the same question 10 different ways. We never get impatient or make you feel silly.",
      color: "bg-red-100 text-red-600",
    },
    {
      icon: ICONS.tv,
      title: "Covers all major brands",
      desc: "Samsung, LG, Sony, Sonos, Ring, Nest, Eero — we know your devices inside and out.",
      color: "bg-indigo-100 text-indigo-600",
    },
  ];

  return (
    <section id="features" className="py-20 px-5 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need, nothing you don't
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Built to be the simplest, most helpful tech support tool on the planet.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <Icon path={f.icon} className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── DIY / Older adult section ─────────────────────────────────────────────────
function ForEveryone() {
  return (
    <section className="py-20 px-5 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              ❤️ Built for real people
            </div>
            <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-6">
              For the DIYers who want to
              <span className="text-blue-600"> figure it out themselves</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              We built Tech Pros Home specifically for people who are smart and capable but
              just aren't familiar with the tech. You shouldn't need a 20-year-old relative
              to set up your TV.
            </p>
            <div className="space-y-4">
              {[
                "Step-by-step guidance that goes at your pace",
                "We explain why, not just what",
                "Send a photo and we'll describe exactly what you're looking at",
                "Voice-first — no typing required",
                "Ask the same question as many times as you need",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Icon path={ICONS.check} className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: quote cards */}
          <div className="space-y-4">
            {[
              {
                quote: "I finally figured out why my soundbar wasn't working. Took 5 minutes. I've been struggling with it for 3 weeks.",
                name: "Margaret, 67",
                role: "Retired teacher, Arizona",
                emoji: "👩‍🏫",
              },
              {
                quote: "I don't feel embarrassed asking the same question twice. It never makes me feel dumb.",
                name: "Robert, 71",
                role: "DIY enthusiast, Phoenix",
                emoji: "👨‍🔧",
              },
              {
                quote: "My daughter used to have to come over to help me. Now I do it myself and send her a photo when I'm done.",
                name: "Carol, 63",
                role: "Homeowner, Scottsdale",
                emoji: "👩",
              },
            ].map(({ quote, name, role, emoji }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} path={ICONS.star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">{emoji}</div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{name}</div>
                    <div className="text-gray-400 text-xs">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Sign up in 60 seconds",
      desc: "Create your free account. No credit card, no complicated setup.",
      color: "bg-blue-600",
    },
    {
      num: "2",
      title: "Describe your problem",
      desc: "Type, talk, or send a photo. Tell us what's going on in your own words.",
      color: "bg-blue-600",
    },
    {
      num: "3",
      title: "Get clear, step-by-step help",
      desc: "Follow along at your own pace. Ask follow-up questions anytime.",
      color: "bg-blue-600",
    },
    {
      num: "4",
      title: "Your tech works again",
      desc: "Most issues solved in under 10 minutes — no service call needed.",
      color: "bg-green-500",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-5 bg-blue-600 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">How it works</h2>
        <p className="text-blue-200 text-xl mb-14">Simpler than you think</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={step.num} className="relative">
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(100%_-_12px)] w-full h-0.5 bg-blue-400/50 z-0" />
              )}
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-full ${step.color} border-4 border-blue-500 flex items-center justify-center font-bold text-lg mx-auto mb-4 shadow-lg`}>
                  {step.num}
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      desc: "Full access, supported by ads",
      features: [
        "Unlimited questions",
        "Photo analysis",
        "YouTube video guides",
        "All major brands covered",
        "24/7 availability",
        "Ad-supported",
      ],
      cta: "Start free",
      ctaHref: "/signup",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "per month",
      desc: "Everything free, completely ad-free",
      features: [
        "Everything in Free",
        "No ads — ever",
        "Priority AI responses",
        "Voice support",
        "Early access to new features",
        "Support us in building more",
      ],
      cta: "Go ad-free",
      ctaHref: "/signup?plan=pro",
      highlight: true,
      badge: "Ad-free",
    },
  ];

  return (
    <section id="pricing" className="py-20 px-5 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, honest pricing</h2>
          <p className="text-xl text-gray-500">Free forever. Upgrade to remove ads and support our mission.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlight
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105"
                  : "bg-white border border-gray-100 shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  {plan.badge}
                </div>
              )}
              <div className="mb-5">
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>
                  {plan.name}
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm pb-1 ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>{plan.desc}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Icon
                      path={f === "Ad-supported" ? ICONS.ban : ICONS.check}
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        f === "Ad-supported"
                          ? plan.highlight ? "text-blue-300" : "text-gray-400"
                          : plan.highlight ? "text-blue-200" : "text-green-500"
                      }`}
                    />
                    <span className={plan.highlight ? "text-blue-100" : "text-gray-600"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.ctaHref}
                className={`block text-center font-bold py-3 rounded-xl transition-all ${
                  plan.highlight
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Service Marketplace ───────────────────────────────────────────────────────
function Marketplace() {
  return (
    <section id="marketplace" className="py-20 px-5 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            🔧 Coming Soon — Service Marketplace
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            When AI isn&apos;t enough, find a local pro
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Sometimes a job needs hands on it. Our marketplace connects you with
            vetted local installation technicians — book directly through the app.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: ICONS.map,
              title: "Find local techs",
              desc: "Browse verified installation professionals near you. Ratings, reviews, and specialties all in one place.",
              color: "bg-blue-100 text-blue-600",
            },
            {
              icon: ICONS.calendar,
              title: "Book in seconds",
              desc: "See real availability and book a time that works for you — no phone tag, no waiting for a callback.",
              color: "bg-emerald-100 text-emerald-600",
            },
            {
              icon: ICONS.shield,
              title: "Vetted & insured",
              desc: "Every tech in our marketplace is screened, insured, and backed by our satisfaction guarantee.",
              color: "bg-purple-100 text-purple-600",
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <Icon path={f.icon} className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Mock booking card */}
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon path={ICONS.map} className="w-4 h-4 text-white" />
            </div>
            <div className="text-white font-bold text-sm">Nearby Technicians</div>
          </div>
          <div className="p-5 space-y-3">
            {[
              { name: "Carlos M.", specialty: "TV & Home Theater", rating: "4.9", jobs: "312", badge: "Top Rated" },
              { name: "Sarah K.", specialty: "Smart Home & Networking", rating: "4.8", jobs: "198", badge: "Fast Response" },
              { name: "David L.", specialty: "Security Cameras & Doorbells", rating: "4.9", jobs: "241", badge: "" },
            ].map((tech) => (
              <div key={tech.name} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
                  {tech.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{tech.name}</span>
                    {tech.badge && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                        {tech.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{tech.specialty}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">⭐ {tech.rating}</div>
                  <div className="text-xs text-gray-400">{tech.jobs} jobs</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <button className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm opacity-70 cursor-not-allowed">
              Coming Soon — Join the Waitlist
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── For Installation Companies ─────────────────────────────────────────────────
function ForCompanies() {
  return (
    <section id="for-companies" className="py-20 px-5 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 md:p-14 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full translate-y-1/3 -translate-x-1/3" />

          <div className="relative grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                🏢 For Installation Companies
              </div>
              <h2 className="text-4xl font-bold text-white leading-tight mb-5">
                Reduce callbacks.<br />Gain new customers.
              </h2>
              <p className="text-gray-300 leading-relaxed mb-8">
                Partner with Tech Pros Home to give your customers world-class AI support
                after every install. Fewer callbacks means lower costs — and your company
                gets discovered by new homeowners through our marketplace.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: ICONS.phone, text: "AI handles post-install questions so your techs focus on new jobs" },
                  { icon: ICONS.zap, text: "Customers get instant answers — no waiting, no frustrated callbacks" },
                  { icon: ICONS.map, text: "Get listed in our marketplace and reach new homeowners in your area" },
                  { icon: ICONS.chart, text: "Dashboard shows customer activity, questions, and satisfaction" },
                  { icon: ICONS.shield, text: "White-label option available — your brand, our AI" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex-shrink-0 flex items-center justify-center">
                      <Icon path={icon} className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-gray-300 text-sm leading-relaxed pt-1">{text}</span>
                  </div>
                ))}
              </div>
              <a
                href="mailto:partners@techpros.app"
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50"
              >
                Contact us about partnering
                <Icon path={ICONS.arrow} className="w-4 h-4" />
              </a>
            </div>

            {/* Value metrics */}
            <div className="bg-gray-800/60 backdrop-blur rounded-2xl p-6 border border-gray-700">
              <div className="text-gray-400 text-sm font-semibold mb-5 uppercase tracking-wide">
                📉 The callback problem
              </div>
              <div className="space-y-4">
                {[
                  { label: "Avg. callbacks per 10 installs", value: "2–3", sub: "industry average" },
                  { label: "Cost per callback visit", value: "$75–150", sub: "labor + travel", highlight: true },
                  { label: "Questions AI resolves instantly", value: "~80%", sub: "no tech dispatch needed" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`rounded-xl p-4 ${
                      row.highlight ? "bg-blue-600 text-white" : "bg-gray-700/50"
                    }`}
                  >
                    <div className={`text-xs mb-1 ${row.highlight ? "text-blue-200" : "text-gray-400"}`}>
                      {row.label}
                    </div>
                    <div className="flex items-end justify-between">
                      <span className={`text-2xl font-extrabold ${row.highlight ? "text-white" : "text-white"}`}>
                        {row.value}
                      </span>
                      <span className={`text-xs ${row.highlight ? "text-blue-200" : "text-gray-500"}`}>
                        {row.sub}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-4 text-center">
                Partner pricing starts at a flat monthly fee — no commissions, no per-question charges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-20 px-5 bg-blue-600 text-white text-center">
      <div className="max-w-2xl mx-auto">
        <div className="text-5xl mb-6">🛡️</div>
        <h2 className="text-4xl font-bold mb-5">
          Your tech problems stop here
        </h2>
        <p className="text-blue-200 text-xl leading-relaxed mb-10">
          Start free today. No credit card, no jargon, no waiting on hold.
          Just clear, friendly help whenever you need it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-lg"
          >
            Get started free
            <Icon path={ICONS.arrow} className="w-5 h-5" />
          </Link>
          <a
            href="#for-companies"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-2xl border border-blue-500 hover:bg-blue-800 transition-all"
          >
            For installation companies
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Icon path={ICONS.shield} className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-sm">Tech Pros</span>
                <span className="text-blue-400 font-semibold text-xs ml-1">Home</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed">Tech help that actually makes sense — for real people.</p>
          </div>

          {/* Product */}
          <div>
            <div className="text-white font-semibold text-sm mb-3">Product</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
            </ul>
          </div>

          {/* Marketplace */}
          <div>
            <div className="text-white font-semibold text-sm mb-3">Marketplace</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#marketplace" className="hover:text-white transition-colors">Find a technician</a></li>
              <li><a href="#for-companies" className="hover:text-white transition-colors">For companies</a></li>
              <li><a href="mailto:partners@techpros.app" className="hover:text-white transition-colors">Partner with us</a></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <div className="text-white font-semibold text-sm mb-3">Account</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign up</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
              <li><a href="mailto:support@techpros.app" className="hover:text-white transition-colors">Contact us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <span>© 2025 Tech Pros Home. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PainPoints />
        <Features />
        <ForEveryone />
        <HowItWorks />
        <Pricing />
        <Marketplace />
        <ForCompanies />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
