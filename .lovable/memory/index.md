# Memory: index.md
Updated: today

# Project Memory

## Core
- **No Chat**: Chat system removed. Do not re-add.
- **Aesthetics**: 'Playful-educational' design. Circular avatars, fade/slide animations, full-width layouts, custom green scrollbar (#1a5632).
- **Typography**: Rawline for web body text (larger on mobile), Ubuntu for PDF documents. No custom OS cursors.
- **Mobile Safe Areas**: Always use `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to prevent notch/gesture overlap.
- **Security**: Strict RLS. Admins only for `students` view and `materials` bucket. `user_roles` is globally readable.
- **Tech Stack**: Vite PWA plugin. Supabase Realtime Channels for instant user presence sync (no polling).
- **Roles**: Gamification (XP, ranking, levels) is strictly disabled for Admin accounts.
- **Avatars**: Always circular, globally used, with initials fallback.
- **Sidebar Order**: Home, Mural, Fórum, LíderAI, Videoaulas, Materiais, Ao Vivo, Resultados.
- **Certificates**: Functionality temporarily DISABLED (no admin tab, no menu). Verify route `/verificar/:code` remains active. Data preserved in DB.
- **Home block**: 'Clima da Turma' (escala emojis 1x/semana) replaced old Sala/Avisos/Online blocks.
- **Texts**: "Líder da Sala (X)" instead of "Painel do líder de classe". "Painel Administrativo" stays.
- **Proposal votes**: Use ✅ Check / ❌ X icons (not ThumbsUp/Down). Proposal images forced to 1920x1080 via smart center-crop on upload (`cropImageToResolution`).

## Memories
- [Clima da Turma](mem://features/clima-da-turma) — Sistema semanal de feedback com escala emoji 1x/semana e relatório admin
- [Edital de Propostas](mem://features/edital-propostas) — Sistema completo de propostas com fases, votos +/-, ranking
- [Home Page Mobile Layout](mem://ui-ux/home-page-mobile-layout) — Mobile layout specifics for Home page counters
- [Forum User Categorization](mem://functional-corrections/forum-user-categorization) — Forum separation of Online Admins and Leaders
- [Forum RLS for Roles](mem://technical-decisions/forum-rls-for-roles) — RLS rule allowing global read for user roles
- [LíderAI Chatbot Interface](mem://features/lider-ai/chatbot-interface) — Glassmorphism UI, sticky header, animations and markdown support
- [User Sala Badges](mem://ui-ux/user-sala-badges) — Badges indicating user's 'Sala' displayed globally
- [Notice Targeting Logic](mem://features/notices/targeting-logic) — Global/targeted notices and pinned functionality
- [Notification Redirection Logic](mem://features/notifications/redirection-logic) — Deep-linking and automatic redirection for notifications
- [Home Page Definition](mem://structure/home-page-definition) — Content organization sequence for the Home page
- [Admin Management Capabilities](mem://features/admin/management-capabilities) — Card-based admin panel, PDF/CSV exports, and limits
- [Layout Constraints](mem://design/layout-constraints) — Full-width layouts, max 3 items per row on desktop grids
- [Video Lessons Comment Threads](mem://features/video-lessons/comment-threads) — Nested threaded replies with mandatory avatars
- [Forum Pinned Topics](mem://features/forum/pinned-topics) — Pinned topics prioritization and visual badges
- [Notifications Clear All](mem://features/notifications/clear-all-functionality) — Cleared_at timestamp logic for hiding notifications
- [Home Page LíderAI Button](mem://ui-ux/home-page-lider-ai-button) — Prominent LíderAI button placement and styling
- [LíderAI Mobile Layout](mem://ui-ux/lider-ai-mobile-layout) — Mobile layout: input bar fixed/sticky integrated with bottom nav
- [Gamification Progression System](mem://features/gamification/progression-system) — 10-level progression system, disabled for admins
- [Password Management](mem://auth/password-management) — User password change interface with validation
- [Avatar Navigation Menu](mem://ui-ux/avatar-navigation-menu) — User avatar acts as a Popover menu for settings
- [System Wide Avatars](mem://ui-ux/system-wide-avatars) — Universal circular avatars with initials fallback
- [Forum UI Design](mem://features/forum/ui-redesign) — Twitter-inspired design, custom admin category colors, image preview with gradient on collapsed cards
- [Gamification Ranking System](mem://features/gamification/ranking-system) — Top 10 non-admin leaderboard with podium icons
- [Google Drive Materials Integration](mem://features/materials/google-drive-integration) — Google Drive links used instead of local uploads
- [Home Banner System](mem://features/home/banner-system) — Rotating carousel banner system supporting images and videos
- [Live Streaming Platform](mem://features/live-streaming/broadcast-platform) — Live stream integration with YouTube/Twitch, real-time presence
- [Scrollbar Design](mem://ui-ux/scrollbar-design) — Custom solid green scrollbar on desktop
- [Data Access Security Rules](mem://security/regras-acesso-dados) — Strict RLS policies for students, materials, and avatars
- [Presence Sync Strategy](mem://technical-decisions/presence-sync-strategy) — Supabase Realtime Channels for presence
- [Events Calendar Integration](mem://features/events/home-calendar-integration) — Events calendar integrated on Home, linked with notices
- [PWA Configuration](mem://technical-decisions/pwa-configuration) — Vite PWA setup, theme color #1a5632, SW disabled in previews
- [Push Notifications System](mem://features/pwa/push-notifications-system) — Native push notifications via SW and Supabase
- [Loading Screen Design](mem://ui-ux/loading-screen-design) — Splash screen with logo, institutional gradient, animations
- [Login Screen Design](mem://features/auth/login-screen-design) — Split-screen desktop login + Política/Termos links
- [Opinion Surveys System](mem://features/surveys/opinion-system) — Opinion surveys system with PDF reports and leader dashboard
- [Global Loading Logic](mem://ui-ux/global-loading-logic) — Splash screen blocks UI until essential data loads
- [Mobile Safe Areas Configuration](mem://ui-ux/mobile-safe-areas-config) — Use env(safe-area-inset) for header and bottom navigation
- [Sidebar Menu Order](mem://ui-ux/sidebar-menu-order-config) — Strict ordering of sidebar menu items
- [Aesthetic Direction](mem://design/aesthetic-direction-config) — Playful-educational visual direction, Ubuntu/Rawline fonts
- [Certificates Management](mem://features/certificates/management-and-verification) — DISABLED in UI; verification route remains; data preserved
- [Notices Functionality and Interaction](mem://features/notices/functionality-and-interaction) — WhatsApp full text share, no truncation
- [Typography Usage](mem://style/typography-usage) — Rawline for body/web, Ubuntu for PDF documents
- [Chat System Removed](mem://functional-changes/chat-system-status) — Chat system has been completely removed
