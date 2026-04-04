import React, { useMemo } from "react";
import "./RainfallDroplets.scss";

const DEFAULT_COUNT = 18;
const DEFAULT_DURATION_MIN = 3.5;
const DEFAULT_DURATION_MAX = 5.9;
const DEFAULT_OPACITY_MIN = 0.4;
const DEFAULT_OPACITY_MAX = 0.85;

/**
 * Builds a stable droplet config so positions/delays don't change between renders.
 */
function buildDropletConfig(count, durationMin, durationMax, opacityMin, opacityMax) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 5 + (i * 5.5) % 90,
    delay: (i * 0.4) % 5,
    duration: durationMin + Math.random() * (durationMax - durationMin), // ✅ improved
    size: 4 + (i % 3) * 2,
    opacity: opacityMin + (i % 4) * ((opacityMax - opacityMin) / 4),
  }));
}

const RainfallDroplets = ({
  count = DEFAULT_COUNT,
  color,
  className = "",
  zIndex = 0,
  durationMin = DEFAULT_DURATION_MIN,
  durationMax = DEFAULT_DURATION_MAX,
  opacityMin = DEFAULT_OPACITY_MIN,
  opacityMax = DEFAULT_OPACITY_MAX,
}) => {
  const config = useMemo(
    () => buildDropletConfig(count, durationMin, durationMax, opacityMin, opacityMax),
    [count, durationMin, durationMax, opacityMin, opacityMax]
  );

  const wrapperStyle = {
    zIndex: Number(zIndex),
    ...(color ? { "--rainfall-droplet-color": color } : {}),
  };

  return (
    <div
      className={`rainfall-droplets ${className}`.trim()}
      style={wrapperStyle}
      aria-hidden="true" // ✅ fixed
    >
      {config.map(({ id, left, delay, duration, size, opacity }) => (
        <span
          key={id}
          className="rainfall-droplets__droplet"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            width: size,
            height: size,
            opacity,
          }}
        />
      ))}
    </div>
  );
};

export default RainfallDroplets;