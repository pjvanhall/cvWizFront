# CV Wizard Frontend - Architecture Document

This document outlines the high-level architecture and technical design of the **CV Wizard Frontend Application**.

## Overview
The application is built using modern **Angular (Standalone Components)**. It is a single-page application (SPA) designed to manage "Medewerkers" (Employees), "Beheerders" (Managers), "Curriculum Vitae" (CVs), and "Techniek Matrix" (Skill Matrices). It uses **Angular Material** for its UI component library, providing a highly responsive, accessible, and modern user experience.

## Core Architecture

### 1. Feature Component Structure
The application employs a feature-based modular structure. The main `AppComponent` acts purely as the application shell and layout container, utilizing Angular Routing (`@angular/router`) to load feature components based on the URL path.

* **App Shell Layout**: Defined in `AppComponent`, this uses an Angular Material Sidenav (`<mat-sidenav-container>`) and Toolbar to establish persistent navigation.
* **Feature Components:**
  * `MedewerkerComponent` (`/medewerkers`): Implements a Master-Detail pattern using an Angular Material Data Grid (`MatTable`) to display all consultants. Employs `MedewerkerDetailDialogComponent` for adding or editing consultant records via modal dialogs.
  * `CvComponent` (`/cv`): Manages the complex Curriculum Vitae structures, including profiles, arrays of experiences, and attached skill matrices.
  * `BeheerderComponent` (`/beheerders`): Manages the system administrators or manager records.
  * `MatrixComponent` (`/matrix`): Interfaces with the dynamic categorizations of tools, programming languages, and proficiency levels.

### 2. Authentication & Security
The application uses JWT-based authentication to secure routes and API requests.
* **AuthService**: Manages the authentication state (`BehaviorSubject`), token storage (`localStorage`), and login/logout logic.
* **AuthGuard**: Protects routes (like `/medewerkers`, `/cv`) by redirecting unauthenticated users to the `/login` screen.
* **AuthInterceptor**: Automatically intercepts outgoing HTTP requests and injects the JWT token into the `Authorization: Bearer` header.
* **Login Flows**: The app distinguishes between a standard login (`LoginComponent`) and a first-time login (`FirstloginComponent`). The first-time login features a multi-step `MatStepper` wizard guiding the user to complete their initial CV configuration.

### 3. State Management
State is managed locally within each individual feature component to prevent namespace collision and crossover bugs. 
* **Reactive Forms:** The application relies heavily on Angular's `ReactiveFormsModule` (`FormBuilder`, `FormGroup`, `FormArray`). Every feature component maintains its own isolated form logic.
* **Component State:** Tracking variables (e.g., `isBusy` for loading spinners, `cvLookupId`, `selectedMedewerker`) reside in the class instance of the active component. State is localized to the active route.

### 3. API Communication & Services
Communication with the backend is abstracted into a dedicated service: `CvwizApiService`.
* **HttpClient:** It uses Angular's `HttpClient` to perform CRUD operations.
* **Proxy Configuration:** The app uses a proxy (`proxy.conf.json`) to route requests starting with `/api` to the backend server running at `http://localhost:8080`, successfully bypassing CORS issues during local development.

### 4. Data Models (DTOs)
The application enforces strict typing using TypeScript interfaces defined in `cvwiz.models.ts`. Key data transfer objects (DTOs) include:
* `MedewerkerDto`: Represents an employee, including their original CV and a list of alternative CVs.
* `CurriculumVitaeDto`: Contains profile info, education, competencies, experience (`ErvaringDto`), and a skill matrix.
* `TechniekMatrixDto` & `SkillMatrix`: Represents the skill categories and tool proficiency levels.
* `BeheerderDto`: Represents a system administrator/manager.

### 5. Styling and UI (Angular Material)
* **UI Components**: The UI is built purely with Angular Material components (e.g., `mat-card`, `mat-form-field`, `mat-input`, `mat-table`, `mat-snack-bar`).
* **Theme**: The project uses the `indigo-pink` pre-built Material theme.
* **Typography & Icons**: Material Typography (Roboto font) is strictly enforced globally. Material Icons (`mat-icon`) are used for visual queues.
* **Custom Styling (SCSS)**: Component-scoped custom styles focus purely on layout (e.g., CSS Grids, spacing) rather than theming, delegating UI responsibilities entirely to Material.
