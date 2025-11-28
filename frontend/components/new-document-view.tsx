"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image, FileImage, Sparkles } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  dimensions: string;
  icon: React.ComponentType<{ className?: string }>;
  preview: string;
}

const templates: Template[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start with an empty canvas",
    dimensions: "2560 × 1440",
    icon: FileImage,
    preview: "bg-gradient-to-br from-slate-800 to-slate-900",
  },
  {
    id: "web",
    name: "Web Design",
    description: "Perfect for web mockups",
    dimensions: "1920 × 1080",
    icon: Sparkles,
    preview: "bg-gradient-to-br from-blue-600 to-purple-600",
  },
  {
    id: "social",
    name: "Social Media",
    description: "Instagram, Twitter, Facebook posts",
    dimensions: "1080 × 1080",
    icon: Image,
    preview: "bg-gradient-to-br from-pink-500 to-rose-500",
  },
  {
    id: "print",
    name: "Print Design",
    description: "Posters, flyers, and print materials",
    dimensions: "3000 × 2000",
    icon: FileImage,
    preview: "bg-gradient-to-br from-amber-500 to-orange-500",
  },
];

interface NewDocumentViewProps {
  onSelectTemplate: (templateId: string) => void;
  onCancel: () => void;
}

export function NewDocumentView({
  onSelectTemplate,
  onCancel,
}: NewDocumentViewProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#181818] text-slate-100">
      <div className="flex h-10 items-center gap-4 border-b border-[#232323] bg-[#2d2d2d] px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="rounded-md bg-sky-500 px-2 py-0.5 text-xs uppercase tracking-[0.3em]">
            C
          </span>
          Tedit
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-12">
        <div className="w-full max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">
              Create New Document
            </h1>
            <p className="text-slate-400">
              Choose a template or start with a blank canvas
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="group cursor-pointer border-[#2b2b2b] bg-[#1a1a1a] transition-all hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/20"
                  onClick={() => onSelectTemplate(template.id)}
                >
                  <div
                    className={`mb-4 aspect-video rounded-lg ${template.preview} flex items-center justify-center`}
                  >
                    <Icon className="h-12 w-12 text-white/50 group-hover:text-white/80 transition-colors" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-white">
                    {template.name}
                  </h3>
                  <p className="mb-2 text-sm text-slate-400">
                    {template.description}
                  </p>
                  <p className="text-xs text-slate-500">{template.dimensions}</p>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              className="border-[#3a3a3a] text-slate-300 hover:bg-slate-800"
              onClick={() => onSelectTemplate("blank")}
            >
              Start with Blank Canvas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

