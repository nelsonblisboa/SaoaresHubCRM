# Design System: Emerald Sanctuary (SOARES HUB CRM)

## Global Rules
- **No Solid Borders:** Areas are separated by background color differences, spacing, or tonal transitions. NEVER use `1px solid`.
- **Typography:** Headlines in 'Manrope', body and labels in 'Inter'.
- **Shadows:** No dark shadows. Depth via surface layers (surface-container-low, surface-container-lowest) or colored shadows (surface_tint #1b6b51 at 6%, blur 32px).
- **Glassmorphism:** Sidebar and floating headers use 80-85% opacity with 20px backdrop-blur.
- **Buttons:** Primary buttons use a 135deg gradient from `primary` (#065F46) to `primary_container` (#004532).
- **Inputs:** No borders at rest, `surface_container` background. Focus has 40% opacity primary ghost border.
- **Lists:** No dividers. Use generous spacing and `surface-container-low` on hover.

## Color Palette (Light Mode)
- primary: #065F46
- primary_container: #004532
- secondary: #617D70
- tertiary: #16A34A
- neutral: #F8FAFC
- surface: #f7f9fb
- surface_container_low: #f2f4f6
- surface_container_lowest: #ffffff
- surface_container_high: #e0e3e5
- outline_variant: #bec9c2
- on_surface: #191c1e
- on_primary: #ffffff
- success: #16A34A
- surface_tint: #1b6b51

## Color Palette (Dark Mode)
- surface: #191c1e
- primary: #8bd6b6
- primary_container: #065F46
- surface_container_low: #1e2124
- surface_container_lowest: #25282b
- surface_container_high: #2d3135
- on_surface: #e1e3e5
- on_primary: #003827
- glass_blur: 30px

## Components Requirements
- **ThemeToggle:** 48px circular button with sun/moon icon. Persistent in localStorage.
- **MetricTile:** Card with display-sm primary value, secondary label, and 10% fill gradient success sparkline.
- **LeadCard:** Avatar, name, last message, temperature badge (🔥 Quente, 🌡️ Morno, ❄️ Frio), and channel indicator.
- **HandoverAlert:** Bar with countdown and "Assumir" button.
- **ChatBubble:** IA (light blue background, "IA" badge) vs Human (surface_container_high background).
- **KanbanColumn:** Titled column with lead count; cards only have elevation shadows during drag.
- **AIActiveIndicator:** Animated icon for "IA typing..." or "IA paused".
