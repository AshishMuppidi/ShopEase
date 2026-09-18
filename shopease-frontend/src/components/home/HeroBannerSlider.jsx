import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const slides = [
  {
    id: 1,
    title: "Shop the Latest Electronics",
    subtitle: "Up to 50% off on top brands",
    cta: "Shop Now",
    link: "/products?categoryId=1",
    bgColor: "from-blue-600 to-indigo-700",
  },
  {
    id: 2,
    title: "Fashion Sale Up to 70% Off",
    subtitle: "Refresh your wardrobe today",
    cta: "Explore Fashion",
    link: "/products",
    bgColor: "from-orange-500 to-pink-600",
  },
  {
    id: 3,
    title: "Fresh Groceries Delivered",
    subtitle: "Get daily essentials at your door",
    cta: "Order Now",
    link: "/products",
    bgColor: "from-emerald-500 to-teal-700",
  }
]

export default function HeroBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const next = () => setCurrentSlide(prev => (prev + 1) % slides.length)
  const prev = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)

  return (
    <div className="relative overflow-hidden rounded-2xl h-48 sm:h-64 md:h-80 shadow-md group">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-center bg-gradient-to-r ${slide.bgColor} ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="text-center text-white px-4">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">{slide.title}</h2>
            <p className="text-sm sm:text-lg mb-6 sm:mb-8 opacity-90">{slide.subtitle}</p>
            <Link to={slide.link} className="bg-white text-slate-900 font-medium px-6 py-2.5 sm:px-8 sm:py-3 rounded-sm shadow-sm hover:bg-slate-50 transition-colors">
              {slide.cta}
            </Link>
          </div>
        </div>
      ))}

      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/50">
        &larr;
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/50">
        &rarr;
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-y-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}
