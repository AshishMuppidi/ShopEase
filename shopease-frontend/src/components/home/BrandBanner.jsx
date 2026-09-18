import { Link } from 'react-router-dom'

export default function BrandBanner() {
  return (
    <section className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
      <div className="p-8 md:p-12 md:w-1/3 flex flex-col justify-center text-white">
        <span className="text-yellow-300 font-bold uppercase tracking-wider text-sm mb-2">Special Offer</span>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">UP TO 40% OFF</h2>
        <p className="text-white/80 mb-6 text-lg">On select brands</p>
        <div>
          <Link to="/products" className="inline-block bg-white text-brand-700 font-bold px-6 py-3 rounded-sm shadow hover:bg-slate-50 transition-colors">
            Shop Now
          </Link>
        </div>
      </div>
      <div className="p-4 md:p-6 md:w-2/3 bg-white/10 backdrop-blur grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-lg p-2 flex flex-col justify-between aspect-[3/4]">
            <div className="bg-slate-100 flex-1 rounded-md mb-2 flex items-center justify-center">
              <span className="text-2xl">🛍️</span>
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-800">Top Brand {i}</div>
              <div className="text-[10px] text-brand-600 font-bold mt-1">Min 20% Off</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
