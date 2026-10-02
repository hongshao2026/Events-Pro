---
version: alpha
name: 赛事自选 · Poker Planner
description: A local tournament discovery and shortlist product, starting with the Wynn WPT festival.
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
  select: {}
---

## Overview

Product register: a Chinese-speaking player's personal decision desk for the November 27–December 21, 2026 Wynn WPT series. Actual supplied schedule drives every row. No marketing hero, decorative casino photography, or wagering simulation.

Signature: independent flight labels, a bounded festival calendar, and the persistent shortlist basket. The current user explicitly requested a phone-style product with a dedicated daily agenda. Muted purple recalls the supplied poster, with white working surfaces and tabular money. It must feel like a usable tournament notebook, not a casino advertisement.

Runtime token ownership is Model B: `app/globals.css` owns CSS variables and Tailwind aliases; this file records their values and rationale. No independent theme provider. Light theme only. zh-CN UI, original English tournament names, Las Vegas PST times, fixed planning FX 6.7.

## Colors

Primary → --primary; background → --background; surface → --card; ink → --foreground; muted → --muted-foreground; line → --border. Classification has four distinct colors: undecided blue → --undecided, attendance green → --attend, interest gold → --watch, exclusion gray → --skip. Matching tint variables own row backgrounds. The same data-status mapping colors discovery cards, agenda rows, calendar dots, filters, detail badges and shortlist entries. Text and icons accompany every status badge; calendar dots are described in each date's accessible label.

## Typography

Body 15px, search 14px, classification controls 13px, compact metadata 11–12px. Headings use 25px. One-line agenda names use 13px with an accessible full name and a detail view for overflow. This density is deliberate for the requested phone layout. Financial values use tabular numerals. Chinese fallback uses Microsoft YaHei. No web font dependency or font-swap shifts.

## Layout

A single responsive app canvas fills phones and stays centered at a maximum 480px on larger screens. Bottom navigation provides discovery, my schedule and shortlist. Discovery uses 15-flight paginated cards at every width. My schedule uses a month calendar followed by date groups, with one activity per line; inactive weeks before the festival are compact. A modal shortlist sheet and the agenda detail sheet fit the same canvas. Document owns main-page vertical scrolling; sheet bodies and the bounded discovery date popover scroll independently. Safe-area padding keeps bottom actions visible. Page-specific scroll positions are retained on navigation.

## Elevation & Depth

Subtle border separates panels. Shadows only for popovers. No glass, gradients or repeated raised cards.

## Shapes

8px controls, 12px containers. Event date squares are 8px. Icons use lucide-react at 16–20px with text for meaningful actions.

## Components

Radix-backed supplied Select, Checkbox, RadioGroup, Sheet, Popover, AlertDialog and Sonner are canonical. Calendar wraps React DayPicker with the full zh-CN locale. StatusBadge and EntryDetails are shared owners across both pages. Selection has four reversible states and a stable saving label. Focus-visible purple outline; disabled controls retain geometry. Hover and pressed states are explicit. Discovery date filters use an inclusive range with Apply and Cancel. The agenda month calendar applies a single day immediately. All dates resets only the corresponding date choice. Select popups match trigger width. Global scrollbars use --scrollbar-* tokens with forced-colors fallbacks. Toasts sit above bottom navigation.

Motion is limited to color changes and canonical overlay transitions; reduced motion disables transitions. Monetary summaries default to one buy-in per selected flight; the basket offers a persistent alternative counting each event once. Guarantees are never summed. Satellites show seat guarantees separately from cash guarantees.

## Do's and Don'ts

- Do preserve source date, exact buy-in, restrictions, continuation days and original-versus-supplement provenance.
- Each starting flight is a separate actionable listing. Continuation days appear once per event/day in the agenda and in event details, inherit the event's selected-flight status and carry no new buy-in.
- Status filters use OR across checked statuses; filtering never mutates classifications.
- Only the supplied WPT series is currently in the catalog. Do not fabricate other series, paid memberships, ads or live availability.
- Do make participation a personal plan, never a real casino registration.
- Don't preselect events, imply guaranteed profit, or count continuation days as new entries.
- Don't communicate saved state before a successful browser-local write.
- Local-only delivery is authoritative. Bundle all assets in one HTML file; no authentication or remote backend.
- Export and restore use the same button hierarchy as filters. Restore previews the backup and requires explicit confirmation; failed validation preserves current data.
