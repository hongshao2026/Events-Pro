# WPT selector behavior

## Product and source

Current user requirements and PRODUCT.md override the earlier event-grouped list and desktop layout. Starting flights are separate: 75 original events become 102 entries; 11 optional satellites bring the total to 113. My schedule adds 23 conditional continuation activities, yielding 125 original activities or 136 with supplements. Each flight has an independent status. USD is primary, CNY uses 6.7. Budget defaults to one buy-in per attending flight, with a persistent alternative counting each event once. Guarantees are shared by flights and never summed. Selection does not register with the casino. Local-only delivery remains authoritative.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | components/ui/select.tsx, components/planner/controls.tsx FilterSelect | DESIGN.md | authored | keyboard and popup |
| Table Selection | components/planner/controls.tsx EntryActions and StatusFilter | PRODUCT.md | exclusive row status, OR checkbox filters | independent flights, multi-filter |
| Date | components/ui/calendar.tsx, components/planner/festival-calendar.tsx, components/planner/my-schedule.tsx | PRODUCT.md | authored zh-CN range and agenda single-day view | boundaries, range, keyboard, phone |
| Scrollbar | app/globals.css | DESIGN.md | global baseline | computed styles |
| Toast | components/ui/sonner.tsx | this contract | success/error | aria live region |
| CRUD | lib/local-store.ts | PRODUCT.md | local state revision, v1 migration, confirmed restore | migration, offline, persistence, conflict, failure |
| Overlay | components/ui/sheet.tsx, popover.tsx, alert-dialog.tsx | this contract | cart, calendar, restore | focus, Escape, viewport |
| Classification color | app/globals.css, components/planner/status.tsx | DESIGN.md | blue/green/gold/gray; text and icon | equal colors on both pages |
| Entry detail | components/planner/entry-details.tsx | actual schedule occurrence | inline discovery and modal agenda | correct flight or continuation date |
| Series catalog | lib/series.ts, components/planner/series-home.tsx | PRODUCT.md | chronological month groups, single-choice region chips using shared RadioGroup | region empty state, ordering, keyboard, mobile |
| Series logo | components/planner/series-home.tsx SeriesLogo, assets/ | local catalog metadata | reserved image dimensions, brand-text fallback | bundled offline image and failed-image recovery |

## State and recovery

The delivered HTML contains all assets and schedule data. It runs directly from file:// without a server, login, remote API, or external resources. CSP denies network connections. An explicit source PDF link is the only outbound navigation.

Browser localStorage is authoritative; the UI commits only after successful setItem. Storage or parse failures retain the raw record and show recovery. Version 2 uses poker-planner-local-v2. The v1 key is retained and converted as defined in PRODUCT.md. Unassigned old attendance stays pending; no flight is guessed. A whole-state revision is reread before updates; stale changes reject and refresh. Storage/visibility events refresh other tabs. localStorage has no transaction guarantee for perfectly simultaneous writes.

Export includes selections, pending legacy attendance and budget mode. Restore validates schema, known IDs, statuses, revisions, consistency and file size; previews date/counts in a Radix alert dialog; then replaces data only on confirmation and successful local write. Invalid imports, cancel and write errors preserve current data. Restore errors appear inside the dialog; save errors remain visible in an open cart. Clearing browser data, changing browser or moving the HTML requires a backup.

## Navigation, locale and accessibility

The default view is the series homepage (view=home). Region options are all, apac, north-america, south-america and europe; the URL region parameter restores the selection. All regions means one combined catalog, ascending by start date and grouped by starting month, not grouped by region first. The finite catalog currently contains only Wynn WPT in North America / US. No invented series appear in empty regions. Cards use native links with view=discover and a stable series ID; normal click opens the detailed schedule, and modified clicks retain browser link behavior. A back link and the Events bottom navigation return to the homepage. Region choice survives entering a series, returning and reloading. Invalid regions become all; unknown series show an explicit recovery page. Logo images are bundled in the HTML and fall back to brand text on failure. Adding future live series also requires their own schedule, bounds, currency and time-zone integration; catalog metadata alone does not implement that data pipeline.

Search, OR categories, inclusive date range, other filters and page belong to URL hash parameters for file:// compatibility. Legacy status/date hashes are recognized. Local search waits for IME composition end; clear is immediate. 15 flights/page, page clamps when results shrink. Budget includes all attending records independent of filters. Category filters use OR, other filters use AND. All-checkbox is checked/indeterminate/unchecked; no statuses selected produces an actionable empty state. Hide skipped removes only skip; filter changes never mutate saved classifications.

Old hashes without an explicit view open the new homepage; their detailed-schedule filters remain and apply on entering WPT. Explicit view=schedule links still open the agenda. Home region filters never alter starting-flight classifications or hide a festival based on its individual flight filters. No personal-storage schema changes accompany the new homepage.

Discovery: all dates precedes its calendar popover. DayPicker uses full zh-CN locale, date-only values and bounded Nov 27–Dec 21 navigation. A day or range stays draft until Apply. Cancel/Escape retains the old filter. The phone canvas shows one month, with planned-day dots. Discovery filters concern starting dates.

My schedule: a dedicated page selected by bottom navigation. The single-month calendar covers the same festival; selecting a day immediately displays and scrolls to that day's rows. Selecting the same date again retains it; the explicit all-dates button clears the choice. All dates shows every date group. Date dots and counts reflect the current agenda categories and continuation/supplement choices. Agenda categories are independent of discovery filters, support OR multi-select and hide skip, and have a one-click attend+watch choice. Hash fields view, day, agendaStatuses, continuations and month restore the page and its choices on reload; existing discovery hashes remain valid. Calendar state and discovery filters survive switching pages. Browser Back/Forward updates the view. Each activity is one row sorted by day/time and opens a modal detail. Starting-row detail offers the shared four classifications; continuation detail directs to its starting flights.

Continuation activities appear once even if multiple starting flights are selected. Status precedence is any attend (including pending legacy attendance), then any watch, then skip only if all starting flights are skip, otherwise undecided. They are conditional on qualifying and have zero added buy-in. The UI labels them explicitly, and shows their actual date/time. No new storage schema or guessed flight assignment is introduced.

My shortlist is a Radix modal sheet, grouped by start day. Attend and watch enter the list; only attendance enters budget. Row actions are shared across discovery, agenda and shortlist. Pending legacy records offer a choose-flight path. Cart has category views and budget mode. No fake other festivals, billing, advertisements or cloud synchronization are exposed.

zh-CN interface and aria labels, en-US USD numbers, Las Vegas PST dates. Native button/link semantics, visible keyboard focus, Radix controls, text plus status color and phone layout. Empty results have recovery. Errors persist until resolved. No native alert/confirm/prompt. Calendar and sheet return focus on close. Main page scrolls naturally; only sheet body and calendar popup scroll within viewport bounds. Reduced motion disables transitions. Feature-detected browser tools target flight IDs.

## Current verification

2026-10-02 regional homepage delivery: TypeScript and ESLint pass; 8 local-state, 7 agenda/route and 2 catalog-model checks pass. Isolated, offline Chrome exercises 29 UI checks including all regional empty states, local logo and fallback, homepage/card/history navigation, legacy hashes, identical classification colors, calendar boundaries, independent filters, conditional continuations, backup/restore, failed writes, browser restart, keyboard focus, and 320/390/1440px layouts. No HTTP requests or page errors. Reviewed screenshots show the new series catalog and empty state, four-color daily rows, full-width phone detail and centered desktop canvas. Strict UI audit reports zero findings; DESIGN.md lint has zero errors and seven descriptive-token reference warnings. User browser records are untouched by QA.
