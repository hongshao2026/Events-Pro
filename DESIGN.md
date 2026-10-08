---
version: alpha
name: 赛事自选 · Poker Planner
description: A local tournament discovery and shortlist product, covering the Wynn WPT and Triton ONE North Cyprus festivals.
colors:
  primary: "#542887"
  background: "#f5f6f9"
  surface: "#ffffff"
  ink: "#222335"
  muted: "#686979"
  line: "#e3e3ec"
  attend: "#176843"
  watch: "#8b6012"
  undecided: "#3a60a8"
  skip: "#6c7280"
typography:
  sans:
    fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif'
  display:
    fontFamily: '"Bahnschrift", "Segoe UI", "Microsoft YaHei", sans-serif'
  mono:
    fontFamily: '"Consolas", monospace'
rounded:
  DEFAULT: "0.5rem"
  lg: "0.75rem"
spacing:
  page: "1rem"
  control: "0.75rem"
components:
  classification: {}
  agenda: {}
  seriesCatalog: {}
  select: {}
---

## Overview

Product register: a Chinese-speaking player's festival directory and personal decision desk for the 2026 Wynn WPT and Triton ONE North Cyprus series. Actual supplied schedule drives every row. No marketing hero, decorative casino photography, or wagering simulation.

Signature: independent flight labels, a bounded festival calendar, and a personal planning table with a fixed event-name column. The user requested a phone-style product with a dedicated daily agenda, then replaced the shortlist basket with a full table page on 2026-10-08. Muted purple recalls the supplied poster, with white working surfaces and tabular money. It must feel like a usable tournament notebook, not a casino advertisement.

Runtime token ownership is Model B: `app/globals.css` owns CSS variables and Tailwind aliases; this file records their values and rationale. No independent theme provider. Light theme only. zh-CN UI, original English tournament names, series-local dates and times (WPT PST; Triton North Cyprus EET), fixed planning FX 6.7.

## Colors

Primary → --primary; background → --background; surface → --card; ink → --foreground; muted → --muted-foreground; line → --border. Classification has four distinct colors: undecided blue → --undecided, attendance green → --attend, interest gold → --watch, exclusion gray → --skip. Matching tint variables own row backgrounds. The same data-status mapping colors discovery cards, agenda rows, calendar dots, filters, detail badges and shortlist entries. Text and icons accompany every status badge; calendar dots are described in each date's accessible label.

## Typography

Body 15px, search 14px, classification controls 13px, compact metadata 11–12px. Headings use 25px. One-line agenda names use 13px with an accessible full name and a detail view for overflow. This density is deliberate for the requested phone layout. Financial values use tabular numerals. Chinese fallback uses Microsoft YaHei. No web font dependency or font-swap shifts.

## Layout

A single responsive app canvas fills phones and stays centered at a maximum 480px on larger screens. Bottom navigation provides festivals, my schedule and shortlist; shortlist uses the lucide Table2 icon. The homepage uses region chips, chronological month groups and linked series cards. Each card has a locally bundled brand logo on a purple surface, country/city, venue, dates and a complete-schedule action. Opening a series leads to its 15-flight paginated schedule; a visible back link returns to the catalog and retains the chosen region. My schedule uses a month calendar followed by date groups, with one activity per line; inactive weeks before the festival are compact. The dedicated shortlist table and existing calendar page both expose a compact table/calendar view switch above their content.

The shortlist has a compact budget summary, category controls and one semantic table. Its 154px event-name column stays fixed on the left; time, buy-in, status, counted budget, guarantee/seats and series/location columns scroll horizontally inside the table container. A visible swipe hint and the global scrollbar make the remaining columns discoverable. The table never widens the document or changes its vertical scroll owner. Names can wrap within the first column, with full event information in the shared detail sheet. Agenda and shortlist detail sheets fit the same 480px canvas. Document owns main-page vertical scrolling; the table owns horizontal overflow, while sheet bodies and the bounded discovery date popover scroll independently. Safe-area padding keeps bottom actions visible. Page-specific scroll positions are retained on navigation.

## Elevation & Depth

Subtle border separates panels. Shadows only for popovers. No glass, gradients or repeated raised cards.

## Shapes

8px controls, 12px containers. Event date squares are 8px. Icons use lucide-react at 16–20px with text for meaningful actions.

## Components

Radix-backed supplied Select, Checkbox, RadioGroup, Sheet, Popover, AlertDialog and Sonner are canonical. Region chips are a single-choice RadioGroup, with an explicit all-regions option. Series cards are native links; logo slots reserve dimensions and fall back to single-line brand text (28px), using the compact series mark in the detail header (21px). Regions with no catalog entries explain that no schedules are collected yet and offer all-regions recovery. Calendar wraps React DayPicker with the full zh-CN locale. StatusBadge, EntryDetails and EntryActions are shared owners across discovery, calendar and shortlist. MyShortlist owns the table surface; lib/shortlist.ts derives rows and their budget attribution from the existing catalog and local state. The former shopping-cart Sheet is removed. Existing cart-* sheet geometry classes remain shared by agenda and shortlist details; their names do not imply a shopping-cart workflow. Selection has four reversible states and a stable saving label; the personal calendar only shows attend/watch rows, markers and counts. Focus-visible purple outline; disabled controls retain geometry. Hover and pressed states are explicit. Discovery date filters use an inclusive range with Apply and Cancel. The agenda month calendar applies a single day immediately. All dates resets only the corresponding date choice. Select popups match trigger width. Global scrollbars use --scrollbar-* tokens with forced-colors fallbacks, including the shortlist's horizontal container. Toasts sit above bottom navigation.

The table reuses the existing Model B token path: app/globals.css semantic colors and --font-body/--font-display/--font-data feed the shortlist selectors and shared controls; DESIGN.md records the accepted values. No new color palette, font stack, theme or independent token source is introduced. The fixed first-column width is table geometry, not a new global spacing token.

Motion is limited to color changes and canonical overlay transitions; reduced motion disables transitions. Monetary summaries default to one buy-in per selected flight; the shortlist offers a persistent alternative counting each event once. A row's counted amount explains its contribution without changing the budget rules in PRODUCT.md. Guarantees are never summed. Satellites show seat guarantees separately from cash guarantees.

## Do's and Don'ts

- Do preserve source date, exact buy-in, restrictions, continuation days and original-versus-supplement provenance.
- Each starting flight is a separate actionable listing. Continuation days appear once per event/day in the agenda and in event details, inherit the event's selected-flight status and carry no new buy-in.
- Status filters use OR across checked statuses; filtering never mutates classifications.
- The catalog contains the supplied WPT and Triton ONE North Cyprus schedules. A shared FilterSelect switches the active series on discovery and agenda; shortlist and budget cover both series. Never fabricate series, guarantees or live availability.
- Do make participation a personal plan, never a real casino registration.
- Don't preselect events, imply guaranteed profit, or count continuation days as new entries.
- Don't communicate saved state before a successful browser-local write.
- Offline delivery remains the default: bundle all assets in one HTML file and force authentication off. The user-requested optional online account module follows AUTH.md and remains disabled until deliberately configured.
- Account UI reuses the existing 480px Radix Sheet, purple primary buttons, system fonts, global scrollbar and neutral bordered controls. No visual token changes. The email and OTP forms share components/auth/account-control.tsx and validation in lib/auth/config.ts; errors reserve space, code input allows paste/autofill and reveal, account email wraps on phones.
- Export and restore use the same button hierarchy as filters. Restore previews the backup and requires explicit confirmation; failed validation preserves current data.
