export default function MapPin({ lat, lng }) {
  if (!lat || !lng) return null;

  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x200&markers=color:red|${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_KEY || ''}`;

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 my-2">
      <img src={src} alt="location" className="w-full h-32 object-cover" />
    </div>
  );
}
