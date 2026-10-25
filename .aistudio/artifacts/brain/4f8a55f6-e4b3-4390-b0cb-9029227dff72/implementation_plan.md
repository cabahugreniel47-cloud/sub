# Clinic Login Page Background Image Update

Set the uploaded real-world photograph of the Pampanga State University Medical and Dental Clinic facade as the background of the login page, formatted with a soft readability overlay to preserve form legibility and brand aesthetics.

## User Review & Critical Decisions

> [!IMPORTANT]
> The background image will replace the generic placeholder reception photo in `src/components/auth/LoginPage.tsx` with the real campus Medical and Dental Clinic facade. All login fields, credentials, validation, logos, and UI layout remain completely unchanged.

- **Confirmed Decision**: Soft overlay applied across the clinic building image so that inputs, text, labels, and action buttons remain clear and readable.
- **Image Source**: `/assets/aistudio/Messenger_creation_1874702003709410_43f1a040.jpeg` (uploaded by user).

---

## 1. Overview & Core Concept

- **What It Does**: Enhances the user authentication experience by replacing the stock interior photo on the login screen with the official exterior facade of the university's "Medical and Dental Clinic".
- **Target Audience**: Students, clinic physicians, registered triage nurses, administrative officers, and university staff accessing the clinic portal.
- **Key Value**: Provides immediate institutional recognition, professional campus authenticity, and visual consistency with the physical university clinic.

---

## 2. User Experience & Visual Design

- **Visual Layout**:
  - The real campus building photo (`Messenger_creation_1874702003709410_43f1a040.jpeg`) spans the full viewport background behind the login panel.
  - An architectural gradient overlay ensures high contrast and clarity for all login form controls, typography, and status indicators.
  - The university crimson accent wave, MCIS dual logo lockup, input fields, password toggle, and modal buttons retain their exact current styling and responsive layout.
- **Readability & Atmosphere**:
  - Balanced opacity and backdrop filtering ensure zero interference with accessibility, text contrast (WCAG standards), or quick-login shortcuts.

---

## 3. Key Product Decisions & Trade-Offs

- **Asset Reference**:
  - *Approach*: Directly reference `/assets/aistudio/Messenger_creation_1874702003709410_43f1a040.jpeg` from the public directory.
  - *Why*: Eliminates bundle bloat, loads instantly via static serving, and uses the exact original photo uploaded by the user.
- **Zero UI Disruption**:
  - *Approach*: Keep the existing form container, input styles, error messaging, and button interactions intact.
  - *Why*: Adheres strictly to the requirement of preserving layout, colors, fonts, spacing, and component behavior.

---

## 4. Technical Architecture & Component Changes

```
┌─────────────────────────────────────────────────────────────┐
│                      LoginPage.tsx                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Background Layer (z-0)                                │  │
│  │  - img: /assets/aistudio/..._43f1a040.jpeg             │  │
│  │  - Soft gradient overlay for text readability          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐  │
│  │ Left: University Brand  │   │ Right: Login Form Card  │  │
│  │  - McisLogo + PSU Seal  │   │  - Username/Email field │  │
│  │  - 5 Core Highlights    │   │  - Password + eye toggle│  │
│  │                         │   │  - Sign In / Modals     │  │
│  └─────────────────────────┘   └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- **Files to Modify**:
  - `src/components/auth/LoginPage.tsx`: Update the background image `src` to `/assets/aistudio/Messenger_creation_1874702003709410_43f1a040.jpeg` and adjust the overlay opacity for soft, crisp readability.
