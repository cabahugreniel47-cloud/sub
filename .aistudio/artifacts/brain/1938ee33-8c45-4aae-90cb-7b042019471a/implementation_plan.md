# Implementation Plan: Move Live TV Waiting Board from Sidebar to Role Perspective Switcher

Remove the "Live TV Waiting Board" item from the navigation sidebar and place it inside the 5 points of view (role perspective) switcher dropdown directly below the Student view.

## Proposed Changes

### `src/components/layout/Sidebar.tsx`
- Remove the "Clinic Displays" / "Live TV Waiting Board" quick access section from the sidebar navigation.

### `src/components/layout/Navbar.tsx`
- In the "Switch Interface View" dropdown (which lists Admin View, Doctor View, Nurse View, Staff View, and Student View), add a new option below Student View:
  - Label: **Live TV Waiting Board** (with TV icon and active status indicator).
  - Action: Triggers `setActiveModal('tv-queue')` and closes the dropdown menu.

## Verification
- Confirm "Live TV Waiting Board" is no longer visible in the left sidebar.
- Open the role dropdown in the top navbar and verify "Live TV Waiting Board" appears below "Student View" and launches the TV board when clicked.
- Run build check (`compile_applet`) to ensure no syntax or typing issues.
