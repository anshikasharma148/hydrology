import React from "react";
import Image from "next/image";

export default function Compass({ direction }) {
  const angle = parseFloat(direction);
  const isValid = !isNaN(angle);
  const safeAngle = isValid ? angle : 0;

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Compass image + needle */}
      <div className="relative w-[80px] h-[80px] overflow-hidden rounded-full">
        <Image
          src="/images/compass.png"
          alt="Compass Base"
          fill
          className="object-contain"
        />
        <div
          className="absolute top-1/2 left-1/2 w-1 h-[40%] bg-red-600 rounded-full origin-bottom"
          style={{
            transform: `translate(-50%, -100%) rotate(${safeAngle}deg)`,
          }}
        />
      </div>

      {/* Degree value */}
      <div className="mt-1 text-sm text-gray-800 font-semibold">
        {safeAngle.toFixed(0)}°
      </div>
    </div>
  );
}
