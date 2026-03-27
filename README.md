# Alpha-Control

Alpha-Control is a React + TypeScript web application centered on an interactive 3D Star Wars galaxy map. It combines a public landing experience with authenticated map access, a news/blog surface, user settings, feedback collection, and admin tooling backed by Supabase.

## What It Is

The application has two main sides. The public side includes the landing page plus a content surface for news, blog, services, legal pages, and article reading. The authenticated side unlocks the galaxy map experience, settings, feedback submission, and role-based admin/editor tools.

At the center of the project is the interactive galaxy map. It is a 3D Star Wars sandbox where authenticated users can move through different map views, inspect systems and fleets, work with faction data, use timeline controls, and interact with a broader command-style interface built around the map.

The wider site wraps that map with a publishing and community layer. Articles can be displayed through the news surface, administrators can manage content and user-facing settings, and the project includes legal, profile, notification, and feedback flows that support the broader application rather than treating the map as a standalone demo.

From a product standpoint, this repository is a combined frontend for:

- A public-facing Star Wars themed homepage and content site
- A protected interactive galaxy management/map experience
- A lightweight publishing surface for articles and updates
- Admin tooling for audit visibility and user management

## Technology

The application is built with React, TypeScript, Vite, Three.js, React Three Fiber, Zustand, Supabase, Tailwind CSS, React Router, Framer Motion, and Tiptap.
