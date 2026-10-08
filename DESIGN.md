---
version: alpha
name: 赛事自选 · Poker Planner
description: A local tournament discovery and shortlist product, covering KPC Jeju, QPC Circuit Hanoi, Triton ONE North Cyprus and Wynn WPT.
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

Product register: a Chinese-speaking player's festival directory and personal decision desk for the 2026 KPC Jeju, QPC Circuit Hanoi, Triton ONE North Cyprus and Wynn WPT series. Actual supplied schedule drives every row. No marketing hero, decorative casino photography, or wagering simulation.

Signature: independent flight labels, a bounded festival calendar, and the persistent shortlist basket. The current user explicitly requested a phone-style product with a dedicated daily agenda. Muted purple recalls the supplied poster, with white working surfaces and tabular money. It must feel like a usable tournament notebook, not a casino advertisement.

Runtime token ownership is Model B: `app/globals.css` owns CSS variables and Tailwind aliases; this file records their values and rationale. No independent theme provider. Light theme only. zh-CN UI, original English tournament names, series-local dates and times (WPT PST; Triton North Cyprus EET; QPC Hanoi ICT; KPC Jeju KST). USD, VND and KRW retain exact comma-grouped native amounts. PriceAmount appends an approximate parenthesized conversion using the saved display currency (CNY default; USD/VND/HKD/KRW or original-only available). Same-currency amounts never repeat. Native totals remain separate. Exchange rates are an editable dated local reference, never presented as live.

## Colors

Primary → --primary; background → --background; surface → --card; ink → --foreground; muted → --muted-foreground; line → --border. Classification has four distinct colors: undecided blue → --undecided, attendance green → --attend, interest gold → --watch, exclusion gray → --skip. Matching tint variables own row backgrounds. The same data-status mapping colors discovery cards, agenda rows, calendar dots, filters, detail badges and shortlist entries. Text and icons accompany every status badge; calendar dots are described in each date's accessible label.

## Typography

Body 15px, search 14px, classification controls 13px, compact metadata 11–12px. Headings use 25px. One-line agenda names use 13px with an accessible full name and a detail view for overflow. This density is deliberate for the requested phone layout. Financial values use tabular numerals. Chinese fallback uses Microsoft YaHei. No web font dependency or font-swap shifts.

## Layout

A single responsive app canvas fills phones and stays centered at a maximum 480px on larger screens. Bottom navigation provides festivals, my schedule, shortlist and my profile. Profile contains username, real account state, VIP 0 base display, currency and both backup flows. Its management link opens exchange-rate and tournament tabs. Discovery dates, classification, search and filters share one white bar; redundant helper copy and quick-budget preset are removed. The homepage uses region chips, chronological month groups and linked series cards. Each card has a locally bundled brand logo on a purple surface, country/city, venue, dates and a complete-schedule action. Opening a series leads to its 15-flight paginated schedule; a visible back link returns to the catalog and retains the chosen region. My schedule uses a month calendar followed by date groups, with one activity per line; inactive weeks before the festival are compact. A modal shortlist sheet and the agenda detail sheet fit the same canvas. Document owns main-page vertical scrolling; sheet bodies and the bounded discovery date popover scroll independently. Safe-area padding keeps bottom actions visible. Page-specific scroll positions are retained on navigation.

## Elevation & Depth

Subtle border separates panels. Shadows only for popovers. No glass, gradients or repeated raised cards.

## Shapes

8px controls, 12px containers. Event date squares are 8px. Icons use lucide-react at 16–20px with text for meaningful actions.

## Components

Radix-backed supplied Select, Checkbox, RadioGroup, Tabs, Sheet, Popover, AlertDialog and Sonner are canonical. Profile and admin forms use labeled fields, inline validation and first-error focus. Management tabs use the existing purple tokens; event edits use the existing modal sheet. Dirty drafts require discard confirmation when leaving, including browser Back. Read-only VIP and future blind structure explicitly indicate their unavailable features. Status-only success toasts do not intercept pointer input; fixed navigation has document scroll padding. Region chips are a single-choice RadioGroup, with an explicit all-regions option. Series cards are native links; logo slots reserve 156×60px, preserve original proportions with contain/left-center alignment, and fall back to single-line brand text (28px), using the compact series mark in the detail header (21px). WPT, Triton ONE, Quads and KPC use official locally stored artwork; source colors stay unchanged on the existing purple brand surface. Compact headers retain their 70×50px padded slot. A failed image affects only that source. Large archival masters stay outside the bundle; the rendered PNG/SVG assets are embedded offline. Regions with no catalog entries explain that no schedules are collected yet and offer all-regions recovery. Calendar wraps React DayPicker with the full zh-CN locale. StatusBadge and EntryDetails are shared owners across both pages. Selection has four reversible states and a stable saving label; the personal calendar only shows attend/watch rows, markers and counts. Focus-visible purple outline; disabled controls retain geometry. Hover and pressed states are explicit. Discovery date filters use an inclusive range with Apply and Cancel. The agenda month calendar applies a single day immediately. All dates resets only the corresponding date choice. Select popups match trigger width. Global scrollbars use --scrollbar-* tokens with forced-colors fallbacks. Toasts sit above bottom navigation.

Motion is limited to color changes and canonical overlay transitions; reduced motion disables transitions. Monetary summaries default to one buy-in per selected flight; the basket offers a persistent alternative counting each event once. Guarantees are never summed. Satellites show seat guarantees separately from cash guarantees. The shared money formatter owns amount labels; filter thresholds follow the active native currency. PriceAmount owns original-plus-converted buy-ins across discovery, agenda, details, shortlist and BudgetAmounts. BudgetAmounts renders separate USD, VND and KRW lines, keeping full amounts readable at 320px. Missing rates display 汇率未设置, never a zero estimate. Mixed-series amount filters state the native currency, and monetary sorting groups by currency. KPC uses its original official gold-and-black transparent PNG in both card and compact header; the brand-text fallback appears only if the image fails. Source IDs stay internal; unnumbered QPC satellites show 未编号.

## Do's and Don'ts

- Do preserve source date, exact buy-in, restrictions, continuation days and original-versus-supplement provenance.
- Each starting flight is a separate actionable listing. Continuation days appear once per event/day in the agenda and in event details, inherit the event's selected-flight status and carry no new buy-in.
- Status filters use OR across checked statuses; filtering never mutates classifications.
- The catalog contains the supplied WPT and Triton ONE North Cyprus schedules and the official QPC Circuit Hanoi and KPC Jeju schedules. A shared FilterSelect switches the active series on discovery and agenda; shortlist and budget cover all series, with a separate total for each currency. Never fabricate series, guarantees or live availability.
- Do make participation a personal plan, never a real casino registration.
- Don't preselect events, imply guaranteed profit, or count continuation days as new entries.
- Don't communicate saved state before a successful browser-local write.
- Offline delivery remains the default: bundle all assets in one HTML file and force authentication off. The user-requested optional online account module follows AUTH.md and remains disabled until deliberately configured.
- Account UI reuses the existing 480px Radix Sheet, purple primary buttons, system fonts, global scrollbar and neutral bordered controls. No visual token changes. The email and OTP forms share components/auth/account-control.tsx and validation in lib/auth/config.ts; errors reserve space, code input allows paste/autofill and reveal, account email wraps on phones.
- Export and restore use the same button hierarchy as filters. Restore previews the backup and requires explicit confirmation; failed validation preserves current data.
