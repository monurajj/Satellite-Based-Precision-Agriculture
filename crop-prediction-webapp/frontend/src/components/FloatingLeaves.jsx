/**
 * FloatingLeaves - Decorative animated leaves for hero sections
 */
const leaves = [
  { emoji: '🍃', top: '10%', left: '5%', size: 'text-4xl', delay: '0s', duration: '6s' },
  { emoji: '🌿', top: '20%', right: '8%', size: 'text-3xl', delay: '1s', duration: '7s' },
  { emoji: '🍃', top: '60%', right: '15%', size: 'text-2xl', delay: '2s', duration: '5s' },
  { emoji: '🌱', top: '40%', left: '10%', size: 'text-3xl', delay: '3s', duration: '8s' },
  { emoji: '🍃', top: '75%', left: '20%', size: 'text-xl', delay: '1.5s', duration: '6s' },
  { emoji: '🌿', top: '15%', right: '25%', size: 'text-2xl', delay: '4s', duration: '7s' },
  { emoji: '🍃', top: '50%', right: '5%', size: 'text-3xl', delay: '0.5s', duration: '5.5s' },
  { emoji: '🌱', top: '80%', right: '30%', size: 'text-xl', delay: '2.5s', duration: '6.5s' },
];

export default function FloatingLeaves() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {leaves.map((leaf, i) => (
        <div
          key={i}
          className={`absolute ${leaf.size} opacity-[0.08]`}
          style={{
            top: leaf.top,
            left: leaf.left,
            right: leaf.right,
            animation: `leaf-drift ${leaf.duration} ease-in-out infinite`,
            animationDelay: leaf.delay,
          }}
        >
          {leaf.emoji}
        </div>
      ))}
    </div>
  );
}
