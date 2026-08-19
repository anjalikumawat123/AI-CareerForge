function HeroSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-20 text-center">
      {/* Badge */}
      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
        Powered by IBM watsonx.ai
      </span>

      {/* Headline */}
      <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
        Forge Your Career <br />
        <span className="text-blue-600">with the Power of AI</span>
      </h1>

      {/* Sub-headline */}
      <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
        AI CareerForge helps college students build standout resumes, practice
        interviews, and land their dream placements — all in one intelligent platform.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors text-base">
          Get Started Free
        </button>
        <button className="border border-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors text-base">
          See How It Works
        </button>
      </div>

      {/* Feature pills */}
      <div className="mt-16 flex flex-wrap justify-center gap-3">
        {[
          '📄 AI Resume Analysis',
          '🎤 Interview Simulator',
          '📊 Career Analytics',
          '💼 Job Matching',
          '🎓 Placement Tracker',
        ].map((feature) => (
          <span
            key={feature}
            className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm"
          >
            {feature}
          </span>
        ))}
      </div>
    </section>
  )
}

export default HeroSection
