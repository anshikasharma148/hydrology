"use client";
import Image from "next/image";

export default function AuthSlider() {
  return (
    <div className="w-1/2 h-screen hidden md:flex flex-col justify-center items-center bg-black">
      <div className="relative w-full h-full">
        <Image
          src="/images/slider1.png"
          alt="Auth background"
          fill
          style={{ objectFit: "cover" }}
          className="rounded-none"
          priority
        />
      </div>
    </div>
  );
}
