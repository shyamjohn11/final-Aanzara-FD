"use client";

import { useState } from "react";
import { X, Image } from "lucide-react";

type ImagePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
};

export function ImagePopup({ isOpen, onClose, imageUrl, alt }: ImagePopupProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
    >
      <div className="relative w-full max-w-full max-h-[90%] bg-white rounded-lg shadow-xl">
        <img
          src={imageUrl}
          alt={alt}
          className="object-contain w-full h-full max-w-full max-h-[90%]"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl focus:outline-none"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}