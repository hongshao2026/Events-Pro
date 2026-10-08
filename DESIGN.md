---
version: alpha
name: 赛事自选 · Poker Planner
description: A local tournament discovery and shortlist product, covering KPC Jeju, QPC Circuit Hanoi, Jeju Poker Festival, Triton ONE North Cyprus and Wynn WPT.
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
  eventCard: {}
  entryDetails: {}
  eventDetailSheet: {}
  eventTags: {}
  discoveryHeader: {}
  discoveryFilters: {}
---

## Overview

Product register: a Chinese-speaking player's festival directory and personal decision desk for the 2026 KPC Jeju, QPC Circuit Hanoi, Jeju Poker Festival, Triton ONE North Cyprus and Wynn WPT series. Actual supplied schedule drives every row. No marketing hero, decorative casino photography, or wagering simulation.

Signature: independent flight labels, a bounded festival calendar, and a personal planning table with a fixed event-name column. The user requested a phone-style product with a dedicated daily agenda, then replaced the shortlist basket with a full table page on 2026-10-08. The same day's accepted WSOP reference informs a left date/time column, a right title-and-price area and a dedicated detail Sheet; the user's later confirmation retains the pale purple identity and the product's own assets. Muted purple recalls the supplied poster, with white working surfaces and tabular money. It must feel like a usable tournament notebook, not a casino advertisement.

Runtime token ownership is Model B: `app/globals.css` owns CSS variables and Tailwind aliases; this file records their values and rationale. No independent theme provider. Light theme only. zh-CN UI, original English tournament names, series-local dates and times (WPT PST; Triton North Cyprus EET; QPC Hanoi ICT; KPC Jeju and JPF Jeju each KST). USD, VND and KRW retain exact comma-grouped native amounts. PriceAmount appends an approximate parenthesized conversion using the saved display currency (CNY default; USD/VND/HKD/KRW or original-only available). Same-currency amounts never repeat. Native totals remain separate. Exchange rates are an editable dated local reference, never presented as live.

## Colors

Primary → --primary; background → --background; surface → --card; ink → --foreground; muted → --muted-foreground; line → --border. Classification has four distinct colors: undecided blue → --undecided, attendance green → --attend, interest gold → --watch, exclusion gray → --skip. Matching tint variables own row backgrounds. The same data-status mapping colors discovery cards, agenda rows, calendar dots, filters, detail badges and shortlist entries. Text and icons accompany every status badge; calendar dots are described in each date's accessible label.

## Typography

Body 15px, search 14px, classification controls 13px, compact metadata 11–12px. Full-page headings use 25px; the discovery series title is a smaller, visible single-line h1 within its compact header, with a complete accessible name. One-line agenda names use 13px with an accessible full name and a detail view for overflow. Discovery event names also stay on one line with ellipsis, while official number and trailing flight retain their own space; the detail heading and button accessible name preserve the full title. This density is deliberate for the requested phone layout. Financial values use tabular numerals. Chinese fallback uses Microsoft YaHei. No web font dependency or font-swap shifts.

## Layout

A single responsive app canvas fills phones and stays centered at a maximum 480px on larger screens. Bottom navigation provides festivals, my schedule, shortlist and my profile; shortlist uses the lucide Table2 icon. Profile contains username, real account state, VIP 0 base display, currency and both backup flows. Its management link opens exchange-rate and tournament tabs. Discovery has a compact horizontal series strip containing a native back-icon button, official logo, visible series-title h1 and basic local facts. There is no separate large complete-schedule heading or discovery series selector; returning to the catalog preserves the chosen region and lets the user choose another series. Its white filter surface retains only search, one date trigger, a filter button and a small result count, with a concise active-condition summary and reset path when constrained. The homepage uses region chips, chronological month groups and linked series cards. Each card has a locally bundled brand logo on a purple surface, country/city, venue, dates and a complete-schedule action. Opening a series leads to its 15-flight paginated schedule. My schedule retains its series selector and month calendar followed by date groups, with one activity per line; inactive weeks before the festival are compact. The dedicated shortlist table and existing calendar page both expose a compact table/calendar view switch above their content.

The dedicated discovery filter Sheet holds category, buy-in, guarantee, game, sort and supplement controls, reusing the shared controls rather than introducing a second filter system. Changes take effect immediately; its result-count completion button only closes the Sheet. The persistent footer keeps reset and completion reachable above safe-area padding. Reset clears all discovery conditions, including search and dates, but leaves the Sheet open with focus inside. The filter trigger counts non-default conditions held inside the Sheet; compact summary text keeps these hidden controls understandable, while search and dates remain visible in their own controls. Date filtering remains a separate draft-and-apply interaction: the single trigger displays all dates or the selected date/range, and the all-dates action lives inside its popover. Default page height prioritizes the event rows without reducing control touch targets or losing filter state visibility.

The shortlist has a compact budget summary, category controls and one semantic table. Its 154px event-name column stays fixed on the left; time, buy-in, status, counted budget, guarantee/seats and series/location columns scroll horizontally inside the table container. A visible swipe hint and the global scrollbar make the remaining columns discoverable. The table never widens the document or changes its vertical scroll owner. Names can wrap within the first column, with full event information in the shared detail sheet. Agenda and shortlist detail sheets fit the same 480px canvas. Document owns main-page vertical scrolling; the table owns horizontal overflow, while sheet bodies and the bounded discovery date popover scroll independently. Safe-area padding keeps bottom actions visible. Page-specific scroll positions are retained on navigation.

Discovery starting-flight rows use a fixed-width date/time area on the left and a flexible event-content area on the right. The title band is a single line: official number, an ellipsized event-name span, then an independently preserved flight label. Only the name may truncate; the detail heading and accessible row-button name expose it in full. Native buy-in and its estimate sit immediately next to each other, sharing a line when space allows. At narrow widths, complete amount segments may move to another line; money is never ellipsized or cropped. Labeled event-guarantee or satellite-seat information remains, with 无保底 for absent guarantee information under PRODUCT.md's presentation rule. Very long guarantee amounts occupy a separate full-width line within the right content area so trailing digits do not split into an isolated line; ordinary amounts keep the compact layout. The game-type explanation row is removed; qualification and supplemental provenance survive as compact markers beside the relevant row facts. The entire main row opens its detail Sheet; a distinct quick-watch control remains a separate target. Attending rows use an inert 计划参加 marker in the shortcut position so a casual watch action cannot remove attendance. Status accents still follow the shared four-color mapping. The layout uses the existing pale purple, white and gray tokens, not a copied brand palette or fabricated live tournament indicators.

Discovery details open in a dedicated EventDetailSheet with a clear return action, event identity, local timing and money summary, a scrolling detail body and a persistent personal-plan footer. A compact group of named hashtag controls in discovery detail offers source-backed game/category filtering, including satellite, hold’em, Omaha, mixed games, draw, Stud and other games when applicable. These are real buttons with visible hover/focus treatment, not decorative badges. The four EntryActions live in the personal-plan footer with at least 44px touch targets, selected text/icons, focus treatment and shared status colors. They are absent from discovery rows. EntryDetails supplies labeled registration, structure, continuation arrangements, and supplemental/source groups to this Sheet and to the existing agenda/shortlist Sheets. Flat sections, fine separators and definition-list values keep the long content scannable; the summary and body must not needlessly duplicate complete conditions. Source notes remain fully accessible, and a continuation's own occurrence is distinguished from a starting flight. The dedicated discovery Sheet uses the canonical modal behavior and existing 480px canvas, without introducing a separate route or data model.

The whole-plan image export extends the notebook layout beyond the phone viewport: a white sheet with a purple-tinted table header, fine gray row rules, all seven columns and wrapped event names. The top summary includes the complete plan's budget and calculation mode; the image retains series-local times, status text and the personal-plan caveat. It captures the full plan rather than the scrolled viewport or active display category. The image preview uses the same 480px Sheet and an internally scrolling body; save controls remain outside that body's overflow. A small local plan aims for 2× output; long plans scale to at most 8,192 pixels on either edge and 12 megapixels overall, preserving the full table in one image.

## Elevation & Depth

Subtle border separates panels. Shadows only for popovers. No glass, gradients or repeated raised cards.

## Shapes

8px controls, 12px containers. Discovery date and time occupy a stable left-hand area; the title and labeled amount badges occupy the flexible right-hand area. Icons use lucide-react at 16–20px with text for meaningful actions.

## Components

Radix-backed supplied Select, Checkbox, RadioGroup, Tabs, Sheet, Popover, AlertDialog and Sonner are canonical. Profile and admin forms use labeled fields, inline validation and first-error focus. Management tabs use the existing purple tokens; event edits use the existing modal sheet. Dirty drafts require discard confirmation when leaving, including browser Back. Read-only VIP and future blind structure explicitly indicate their unavailable features. Status-only success toasts do not intercept pointer input; fixed navigation has document scroll padding. Region chips are a single-choice RadioGroup, with an explicit all-regions option. Series cards are native links; logo slots reserve 156×60px, preserve original proportions with contain/left-center alignment, and fall back to single-line brand text (28px), using the compact series mark in the detail header (21px). WPT, Triton ONE, Quads, KPC and JPF use official locally stored artwork (JPF masthead rendered from the supplied PDF); source colors stay unchanged on the existing purple brand surface. The discovery strip uses a dedicated 48×38px logo slot; other compact series headers retain their 70×50px padded slot. A failed image affects only that source. Large archival masters stay outside the bundle; the rendered PNG/SVG assets are embedded offline. Regions with no catalog entries explain that no schedules are collected yet and offer all-regions recovery. Calendar wraps React DayPicker with the full zh-CN locale. StatusBadge, EntryDetails and EntryActions are shared owners across discovery, calendar and shortlist. MyShortlist owns the table surface; lib/shortlist.ts derives rows and budget attribution from the managed catalog and local state. The former shopping-cart Sheet is removed. Existing cart-* geometry classes remain shared by agenda and shortlist details; their names do not imply a shopping-cart workflow. Selection has four reversible states and a stable saving label; the personal calendar only shows attend/watch rows, markers and counts. Focus-visible purple outline; disabled controls retain geometry. Hover and pressed states are explicit. Discovery date filters use an inclusive range with Apply and Cancel. The discovery-only singleTrigger variant places the all-dates reset inside the date popover; its trigger shows the current date/range or 全部日期. The agenda month calendar applies a single day immediately. All dates resets only the corresponding date choice. Select popups match trigger width with a 180px minimum. Mixed-currency amount filters use the shared fitOptions variant to grow for full amounts and currency labels within viewport bounds. Global scrollbars use --scrollbar-* tokens with forced-colors fallbacks, including the shortlist horizontal container. Toasts sit above bottom navigation.

The table reuses the existing Model B token path: app/globals.css semantic colors and --font-body/--font-display/--font-data feed the shortlist selectors and shared controls; DESIGN.md records the accepted values. No new color palette, font stack, theme or independent token source is introduced. The fixed first-column width is table geometry, not a new global spacing token.

app/planner.tsx owns the compact discovery header, default search/date/filter surface, active-condition count and summary, and URL-backed filter state. components/planner/discovery-filter-sheet.tsx owns the dedicated filter modal and its instant-update, reset and completion controls, reusing the canonical Sheet, FilterSelect and StatusFilter. components/planner/festival-calendar.tsx owns the discovery single-trigger date variant. These variants use app/globals.css and existing semantic tokens; no independent theme, filter state or overlay system is introduced. The back icon is a native button named 返回赛事列表, and the visible series h1 remains the page-navigation focus target.

components/planner/event-card.tsx owns the discovery row composition, native detail-opening button and separate quick-watch affordance. components/planner/event-detail-sheet.tsx owns the discovery detail modal, return behavior, summary and personal-plan footer, reusing EntryActions for the four classifications. PriceAmount remains the native/converted buy-in owner. components/planner/entry-details.tsx supplies the shared detail content for discovery, agenda and shortlist; lib/registration.ts owns registrationDeadline(slot, timeLabel), providing compact and full labels from the same sourced deadline. Card and detail geometry live in app/globals.css and consume the existing semantic color/font variables through the Model B path. No screen-local deadline formatter or independent set of four-state controls is introduced. Quick watch is a deliberate reversible shortcut with the restricted transitions in UX-CONTRACT.md; attendance changes use the shared detail controls. lib/event-tags.ts owns eventTags, matchesEventGame and eventGameOptions for source-backed classification, tag labels and matching in the detail tags and discovery type filter; the detail Sheet renders the tags and the planner owns their navigation/history transition. Tag styling consumes the existing --primary, --secondary, --border and focus tokens. No screen-local game classifier is introduced.

components/planner/shortlist-export.tsx owns the export action, busy/error feedback and preview Sheet; lib/shortlist-image.ts owns the full-plan image model and local canvas rendering. The canvas reads resolved color and font CSS variables from app/globals.css instead of maintaining a separate palette. Header and totals use --primary on --secondary, paper uses --card, rules use --border, body copy uses --foreground/--muted-foreground, and status text colors follow --attend/--watch. The preview keeps the canonical Sheet title, close, focus and safe-area behavior. Export button geometry is stable while busy, errors are inline, and the UI distinguishes a generated image from a confirmed device save.

Motion is limited to color changes and canonical overlay transitions; reduced motion disables transitions. Monetary summaries default to one buy-in per selected flight; the shortlist offers a persistent alternative counting each event once. Each row explains its counted amount without changing the budget rules in PRODUCT.md. Unknown fees display 未公布 and remain excluded with an explicit count. Guarantees are never summed. Satellites show seat guarantees separately from cash guarantees. Discovery rows and their dedicated detail summary use the requested 无保底 label for absent guarantee information, preserving the source null and all budget semantics. The shared guarantee formatter accepts this explicit empty label while other consumers keep their established wording; it makes no claim about a live prize pool. The shared money formatter owns amount labels; filter thresholds follow the active native currency. PriceAmount owns original-plus-converted buy-ins across discovery, agenda, details, shortlist and BudgetAmounts. BudgetAmounts renders separate USD, VND and KRW lines, keeping full amounts readable at 320px. Missing rates display 汇率未设置, never a zero estimate. KPC and JPF amount filters use explicit KRW: or USD: prefixes and compare matching native currencies; monetary sorting groups by currency and puts unknown amounts last. KPC uses its original official gold-and-black transparent PNG in both card and compact header; the brand-text fallback appears only if the image fails. Source IDs stay internal; unnumbered QPC satellites show 未编号. The PNG uses the same native amounts, display preference and dated exchange-rate settings through lib/money.ts; no fixed USD-to-CNY rate or combined native total is introduced. Admin overrides affect both the table and its exported snapshot; hiding an already selected event does not remove it.

## Do's and Don'ts

- Do preserve source date, exact buy-in, restrictions, continuation days and original-versus-supplement provenance.
- Do keep sourced registration exceptions and complete notes reachable in shared details. Compact labels must not invent exact deadlines, fees, re-entry rules, field counts or live prize pools.
- Each starting flight is a separate actionable listing. Continuation days appear once per event/day in the agenda and in event details, inherit the event's selected-flight status and carry no new buy-in.
- Status filters use OR across checked statuses; filtering never mutates classifications.
- The catalog contains the supplied WPT, Triton ONE North Cyprus and JPF Jeju schedules and the official QPC Circuit Hanoi and KPC Jeju schedules. KPC, QPC and JPF are three separate APAC entries; KPC and JPF retain separate IDs, dates and calendars even though both use KST. Discovery changes series through the catalog, while the shared FilterSelect remains the agenda series switch; shortlist and budget cover all series, with a separate total for each currency. Never fabricate series, guarantees or live availability.
- Do make participation a personal plan, never a real casino registration.
- Don't preselect events, imply guaranteed profit, or count continuation days as new entries.
- Don't communicate saved state before a successful browser-local write.
- Offline delivery remains the default: bundle all assets in one HTML file and force authentication off. The user-requested optional online account module follows AUTH.md and remains disabled until deliberately configured.
- Account UI reuses the existing 480px Radix Sheet, purple primary buttons, system fonts, global scrollbar and neutral bordered controls. No visual token changes. The email and OTP forms share components/auth/account-control.tsx and validation in lib/auth/config.ts; errors reserve space, code input allows paste/autofill and reveal, account email wraps on phones.
- Export and restore use the same button hierarchy as filters. Restore previews the backup and requires explicit confirmation; failed validation preserves current data.
- Image export is a local, read-only snapshot of the entire plan. Keep all seven columns and rows in the PNG; never hide content because the phone or active category shows only part of the table. Release preview object URLs when closed or unmounted.

JPF reuses the existing card, date picker, filters, price and settings owners. No new theme tokens or screen layouts. Native KRW and USD stay explicit within one series; null fees use 未公布, and the budget states how many fees are excluded. Currency-qualified filter labels and grouped amount-sort labels explain the native-unit comparison. JPF branding uses the original supplied masthead colors; the original PDF remains the archival master.

- KPC 与 JPF 共用的混合币种筛选弹层至少 180px 且不窄于按钮，按选项文字扩展并受视口约束；手机窄按钮不应让金额菜单逐字换行。
