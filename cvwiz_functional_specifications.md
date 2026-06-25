# CV Wizard Frontend - Functional Specifications

This document outlines the functional specifications of the CV Wizard frontend, reverse-engineered directly from the application's unit test suites. It serves as a source of truth for the expected behavior of the system's core modules.

## 1. Authentication & Authorization (`Auth`)

### 1.1 Login & Access Control
- **Route Guarding**: The `AuthGuard` restricts access to protected routes (e.g., `/medewerkers`, `/cv`, `/matrix`).
- **Unauthenticated Access**: Users attempting to access protected routes without a valid session are intercepted and redirected to `/login`.
- **JWT Interceptor**: The `AuthInterceptor` automatically attaches credentials (`withCredentials: true`) to all outgoing HTTP requests, ensuring the HTTP-only JWT cookie is sent to the backend.

## 2. Curriculum Vitae Management (`CvComponent`)

### 2.1 Initialization & Routing Flows
- **Own Profile (Default Fallback)**: 
  - If no specific `id` or `medewerkerId` is provided in the query string, the system defaults to fetching the logged-in user's profile (`getMijzelf`).
  - If the user does not have an original CV (`orgineleCv`), the system automatically provisions a new CV and links it to the user.
- **Consultant Profile (`medewerkerId=...`)**:
  - Fetches the profile of a specific consultant.
  - Automatically provisions a new CV for the consultant if they do not already have one, then redirects the route to load the newly created CV ID.
- **Direct CV Load (`id=...`)**:
  - Fetches and loads a specific CV directly by its ID.
  - Populates the reactive form with the profile, education, competencies, experience (`ervaring`), and skill matrix categories.

### 2.2 Skill Matrix Form Management
- **Category Management**:
  - Users can dynamically add and remove skill categories.
  - The system prevents adding a category if all available categories defined in the Base Matrix have already been added.
- **Technology Management**:
  - Within a category, users can add and remove specific technologies.
  - The available technologies dropdown is dynamically filtered: it only shows technologies that belong to the selected category (based on the Base Matrix) and have not already been selected in the current category block.
  - The system prevents adding a new technology row if all available technologies for the selected category are already in use.
- **Validation**:
  - Empty categories or skills with a rating of 0 are automatically stripped out when building the final DTO for saving.

### 2.3 Saving & Data Integrity
- **Create vs. Update**: 
  - If the CV lacks an ID, the system issues a `POST` request to create a new CV.
  - If the CV has an ID, the system issues a `PUT` request to update the existing CV.
- **Error Handling**: 
  - If matrix mapping fails (e.g., invalid JSON generation), saving is aborted and the user is notified via a snackbar.

## 3. Technology Matrix Management (`MatrixComponent`)

### 3.1 Viewing the Matrix
- **Loading & Categorization**:
  - The system fetches the global base matrix (`getBaseMatrix`) and extracts all unique categories.
  - Users can filter the displayed matrix tools by selecting a specific category from a dropdown.

### 3.2 Modifying the Matrix
- **Adding Tools**:
  - Clicking "Add Tool" opens the `MatrixDetailDialogComponent` in creation mode (no initial data).
  - Saving the dialog triggers a `POST` request to add the new tool to the base matrix.
- **Editing Tools**:
  - Clicking "Edit" on a tool row opens the `MatrixDetailDialogComponent` populated with the tool's current details.
  - Saving the dialog triggers a `PUT` request to update the tool.
- **Deleting Tools**:
  - Deleting a tool requires explicit user confirmation via a native prompt (`window.confirm`).
  - If confirmed, a `DELETE` request is sent. If rejected, no action is taken.
- **State Refresh**: 
  - After any successful Add, Edit, or Delete operation, the matrix data is automatically re-fetched to reflect the updated state.

## 4. Manager Administration (`BeheerderComponent`)

### 4.1 Administrator Profiles
- **Validation Rules**:
  - The administrator detail form mandates standard fields: First Name, Last Name, and Email Address.
  - **Password Policies**: Creating or updating an administrator requires a password that meets complexity requirements (e.g., must be a "strong password").

## 5. Consultant Administration (`MedewerkerComponent`)

### 5.1 Consultant Profiles
- **Validation Rules**:
  - The consultant detail form requires First Name, Last Name, and Email Address. Missing properties are handled gracefully during form patching.
- **Deletion**:
  - Deleting a consultant requires explicit confirmation via `window.confirm`.
  - The system correctly handles deletion flows even if the consultant's metadata (e.g., associated CV list or names) is partially undefined or missing.
