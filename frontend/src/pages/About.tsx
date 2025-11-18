import React from "react";
import { Leaf, GraduationCap, Camera, Users } from "lucide-react";
import CampusImage from "../assets/san-jose-state.jpg";

/**
 * AboutPage – NatureShare
 *
 * Drop this file in src/pages/About.tsx (or similar) and route to it.
 * Uses TailwindCSS and lucide-react icons.
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="mx-auto max-w-4xl px-6 pt-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <Leaf className="h-5 w-5 text-emerald-600" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Eco-Leveling
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          A community platform for students to discover and share the natural
          beauty hiding in plain sight on their school campuses
        </p>
      </header>

      {/* Hero image */}
      <section className="mx-auto mt-8 max-w-4xl px-6">
        <div className="overflow-hidden rounded-2xl ring-1 ring-gray-200">
          {/* Replace the src below with your own image in /public or a URL */}
          <img
            src={CampusImage}
            alt="Campus buildings surrounded by trees and greenery"
            className="h-64 w-full object-cover sm:h-80"
          />
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto mt-8 max-w-4xl px-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-emerald-200">
              <Leaf className="h-5 w-5 text-emerald-600" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Our Mission
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Every school campus has hidden natural treasures—from morning
                dew on grass to golden hour shadows across buildings, from
                campus wildlife to seasonal blooms. NatureShare empowers
                students to slow down, observe, and celebrate the natural world
                right where they learn. By sharing these moments, we build a
                community that appreciates the beauty around us and encourages
                environmental awareness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What is Eco-Leveling? */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <h3 className="mb-6 text-center text-sm font-medium tracking-wide text-gray-900">
          Why Eco-Leveling?
        </h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<GraduationCap className="h-6 w-6" aria-hidden />}
            title="Campus-Focused"
            description="Share and discover nature photography specifically from school campuses, making exploration easy and relevant."
          />
          <FeatureCard
            icon={<Camera className="h-6 w-6" aria-hidden />}
            title="Student Photographers"
            description="Showcase your photography skills and develop your artistic eye by capturing moments that matter."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" aria-hidden />}
            title="Community Building"
            description="Connect with fellow students who appreciate nature, swap tips, and join campus-focused initiatives."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-6 pb-6 pt-2">
        <h3 className="mb-6 text-center text-sm font-medium tracking-wide text-gray-900">
          How It Works
        </h3>
        <div className="grid gap-5 md:grid-cols-2">
          <HowItWorksCard
            step={1}
            title="Explore Your Campus"
            description="Take your phone or camera and discover the natural beauty on your school grounds—trees, flowers, wildlife, or landscapes."
          />
          <HowItWorksCard
            step={2}
            title="Capture the Moment"
            description="Photograph what catches your eye and tells a story about nature on your campus."
          />
          <HowItWorksCard
            step={3}
            title="Share with Students"
            description="Post your photos to the feed and add your school to connect with your campus community."
          />
          <HowItWorksCard
            step={4}
            title="Inspire Others"
            description="See your photos inspire classmates to notice and appreciate the nature around them."
          />
        </div>
      </section>

      
    </div>
  );
}

function HowItWorksCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
        {step}
      </div>
      <div>
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        {icon}
      </div>
      <h4 className="text-center text-base font-semibold text-gray-900">
        {title}
      </h4>
      <p className="mt-2 text-center text-sm leading-6 text-gray-600">
        {description}
      </p>
    </div>
  );
}
