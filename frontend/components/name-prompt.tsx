"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface NamePromptProps {
  isOpen: boolean;
  defaultName?: string;
  onConfirm: (name: string) => void;
}

export function NamePrompt({ isOpen, defaultName, onConfirm }: NamePromptProps) {
  const [name, setName] = useState(defaultName || "");

  useEffect(() => {
    if (isOpen && defaultName) {
      setName(defaultName);
    }
  }, [isOpen, defaultName]);

  useEffect(() => {
    // Auto-focus input when dialog opens
    if (isOpen) {
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>("#name-input");
        input?.focus();
        input?.select();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length > 0 && trimmedName.length <= 20) {
      onConfirm(trimmedName);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#3a3a3a] bg-[#1a1a1a] p-8 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Enter your name
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          This name will be shown to others when you&apos;re collaborating.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="mb-4 w-full rounded-lg border border-[#555] bg-[#232323] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
            autoComplete="off"
          />
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!name.trim() || name.trim().length > 20}
              className="flex-1 rounded-lg bg-white text-black hover:bg-slate-100 disabled:opacity-50"
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
