export default function PriceRangeSlider({ min = 0, max = 100000, value = [0, 100000], onChange }) {
  const handleMin = (e) => {
    const val = Math.min(Number(e.target.value), value[1] - 1)
    onChange([val, value[1]])
  }
  const handleMax = (e) => {
    const val = Math.max(Number(e.target.value), value[0] + 1)
    onChange([value[0], val])
  }

  return (
    <div className="w-full relative mt-4 h-6">
      <input type="range" min={min} max={max} value={value[0]} onChange={handleMin} className="absolute w-full appearance-none pointer-events-none h-1 bg-slate-200 rounded outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:rounded-full" />
      <input type="range" min={min} max={max} value={value[1]} onChange={handleMax} className="absolute w-full appearance-none pointer-events-none h-1 bg-transparent rounded outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:rounded-full" />
      <div className="flex justify-between mt-4 text-xs text-slate-500">
        <span>₹{value[0]}</span>
        <span>₹{value[1]}</span>
      </div>
    </div>
  )
}
