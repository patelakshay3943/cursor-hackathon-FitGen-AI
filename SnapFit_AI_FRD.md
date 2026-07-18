  
**FUNCTIONAL REQUIREMENTS DOCUMENT**

**SnapFit AI**

*AI-Powered Fitness Coaching & Motion Tracking Platform*

**Version 1.0**

Prepared for: Cursor Hackathon Submission

Module Scope: AI Fitness Assessment · Adaptive Workout Planning · Real-Time Motion Tracking · Progress Analytics

# 1\. Introduction

## 1.1 Purpose

This document defines the functional and non-functional requirements for SnapFit AI, an AI-powered fitness platform that combines large language model (LLM) reasoning with computer-vision-based motion tracking to deliver a personalized, adaptive, real-time personal training experience.

## 1.2 Project Summary

SnapFit AI guides a user from initial onboarding through a personalized monthly workout program, live AI-assisted exercise tracking via webcam, and continuous plan adaptation based on actual performance. The system removes the need for a human trainer by combining pose estimation, rule-based biomechanical analysis, and generative AI coaching feedback.

## 1.3 Out of Scope

* Meal planning / nutrition recommendations (explicitly excluded from this version)

* Social features (friends, leaderboards, sharing)

* Wearable device integration (future consideration)

* Native mobile app (web-based, responsive only, for this version)

## 1.4 Target Users

* Individuals who want structured, personalized workout guidance without a gym membership or personal trainer

* Home and gym exercisers across beginner to advanced levels

* Hackathon demo audience/judges evaluating AI \+ CV integration

# 2\. System Overview

SnapFit AI is composed of four functional pillars:

| Pillar | Description |
| :---- | :---- |
| Assessment Engine | Collects user profile data to seed all personalization |
| AI Planning Engine | LLM-driven generation and adaptation of monthly/weekly workout plans |
| Motion Tracking Engine | Computer-vision pipeline for pose detection, rep counting, and form analysis |
| Analytics & Coaching Engine | Aggregates session data into summaries, dashboards, and AI-generated coaching feedback |

# 3\. User Journey (End-to-End)

**Sign Up**

**↓**

**AI Fitness Assessment**

**↓**

**Personalized Monthly Plan (with image)**

**↓**

**Weekly Workout Schedule**

**↓**

**Daily Workout Session**

**↓**

**Motion Tracking \+ AI Coaching**

**↓**

**Progress Dashboard**

**↓**

**AI Updates Next Week's Plan**

## 3.1 Narrative Walkthrough

**Step 1 — Sign Up**

User creates an account (email/password or OAuth). A user profile record is initialized and linked to the authenticated user ID.

**Step 2 — AI Fitness Assessment**

User completes a multi-step onboarding form capturing physical stats, goals, experience level, equipment access, schedule, and injury/medical flags. This produces a structured profile that seeds every downstream AI call.

**Step 3 — Personalized Monthly Plan (with image)**

The AI Planning Engine generates a structured 4-week program. Each exercise in the plan is paired with a visual reference (static illustration, demo GIF/video, or a cached generated thumbnail) so the user can preview correct form before starting.

**Step 4 — Weekly Workout Schedule**

The monthly plan is sliced into the current week's view — a 7-day card layout showing daily focus areas (e.g., Legs, Push, Rest) and exercise previews.

**Step 5 — Daily Workout Session**

User opens "Today's Workout," sees a warm-up → exercise sequence → cooldown structure, with each exercise showing instructions, target sets/reps, and a "Start Motion Tracking" action.

**Step 6 — Motion Tracking \+ AI Coaching**

Webcam activates. The system detects body landmarks in real time, tracks joint angles, counts repetitions via a state machine, validates form against rule-based checks, and surfaces live feedback (visual \+ text cues) during the set.

**Step 7 — Progress Dashboard**

After the session, the user sees a summary (reps, form accuracy, estimated calories, mistakes detected) and a broader dashboard showing trends over time — streaks, accuracy history, completed sessions.

**Step 8 — AI Updates Next Week's Plan**

At the end of a week (or session, for demo purposes), the system compares planned vs. actual performance (completion rate, form scores) and sends this back to the LLM, which regenerates the following week's plan — increasing difficulty where the user excelled, reducing/adjusting where they struggled, with a natural-language explanation of what changed and why.

# 4\. Functional Requirements

Each requirement is tagged with an ID for traceability (FR-\<module\>-\<number\>).

## 4.1 Authentication & Onboarding

| ID | Requirement |
| :---- | :---- |
| FR-AUTH-01 | System shall allow user sign-up via email/password or OAuth provider |
| FR-AUTH-02 | System shall persist a unique user profile record per authenticated user |
| FR-AUTH-03 | System shall prevent access to plan/tracking features until onboarding is complete |

## 4.2 AI Fitness Assessment

| ID | Requirement |
| :---- | :---- |
| FR-ASSESS-01 | System shall present a multi-step form capturing: age, sex, height, weight |
| FR-ASSESS-02 | System shall capture primary fitness goal (Lose Weight, Build Muscle, Improve Fitness, Increase Strength, Improve Mobility) |
| FR-ASSESS-03 | System shall capture experience level (Beginner, Intermediate, Advanced) |
| FR-ASSESS-04 | System shall capture workout environment (Home, Gym, Hybrid) and available equipment |
| FR-ASSESS-05 | System shall capture session duration preference and days-per-week availability |
| FR-ASSESS-06 | System shall capture injury/medical flags (knee, back, shoulder, none) and restrict exercise selection accordingly |
| FR-ASSESS-07 | System shall capture general activity level (Sedentary, Moderate, Active) |
| FR-ASSESS-08 | System shall validate and persist all responses into a structured user profile before proceeding |

## 4.3 AI Planning Engine

| ID | Requirement |
| :---- | :---- |
| FR-PLAN-01 | System shall generate a 4-week workout plan using an LLM, constrained to a predefined exercise catalog |
| FR-PLAN-02 | System shall compute baseline numeric parameters (e.g., estimated calorie burn, volume targets) via deterministic backend logic, not the LLM |
| FR-PLAN-03 | LLM output shall be returned strictly as structured data matching a predefined schema |
| FR-PLAN-04 | System shall reject or reprocess any LLM output that references an exercise outside the approved catalog |
| FR-PLAN-05 | System shall associate each exercise in the plan with a visual reference (thumbnail/demo video) from the exercise catalog |
| FR-PLAN-06 | System shall respect user injury flags and equipment constraints when generating the plan |
| FR-PLAN-07 | System shall persist the generated plan, linked to the user and week number |
| FR-PLAN-08 | System shall regenerate the following week's plan based on aggregated performance data (see 4.6) |

## 4.4 Weekly Schedule & Daily Session

| ID | Requirement |
| :---- | :---- |
| FR-SCHED-01 | System shall display the current week's plan as a 7-day schedule with daily focus labels |
| FR-SCHED-02 | System shall allow the user to open "Today's Workout" showing warm-up, main exercises, and cooldown in sequence |
| FR-SCHED-03 | Each exercise entry shall display: name, image/video reference, instructions, target sets/reps, and a "Start Motion Tracking" control |
| FR-SCHED-04 | System shall mark a day/session as complete once all exercises are tracked or manually skipped |

## 4.5 Motion Tracking Engine

| ID | Requirement |
| :---- | :---- |
| FR-TRACK-01 | System shall request webcam permission and initialize pose detection (MediaPipe BlazePose) |
| FR-TRACK-02 | System shall detect and render approximately 33 body landmarks in real time from the video feed |
| FR-TRACK-03 | System shall calculate relevant joint angles per exercise (e.g., hip-knee-ankle for squats, shoulder-elbow-wrist for curls) |
| FR-TRACK-04 | System shall implement a per-exercise state machine to detect phase transitions (e.g., UP/DOWN) and increment rep count on valid transitions |
| FR-TRACK-05 | System shall validate posture against rule-based checks specific to each exercise (e.g., knee valgus, back angle, depth) |
| FR-TRACK-06 | System shall surface real-time feedback (visual overlay and/or short text cues) when a form violation is detected |
| FR-TRACK-07 | System shall track set count, total rep count, and elapsed time per session |
| FR-TRACK-08 | System shall be extensible — adding a new exercise shall require only a new state-machine/rule module, not core pipeline changes |
| FR-TRACK-09 | System shall degrade gracefully (pause tracking, notify user) if pose confidence drops below a usable threshold (e.g., user leaves frame) |

## 4.6 Analytics & Coaching Engine

| ID | Requirement |
| :---- | :---- |
| FR-ANALYTICS-01 | System shall generate a post-session summary: total reps, sets, duration, estimated calories burned, form accuracy score, detected mistakes |
| FR-ANALYTICS-02 | System shall pass session metrics (angles, rep count, speed, stability, mistakes) to an LLM to generate personalized natural-language coaching feedback |
| FR-ANALYTICS-03 | System shall persist session results, linked to user, date, and exercise |
| FR-ANALYTICS-04 | System shall display a Progress Dashboard including: workout streak, accuracy trend over time, sessions completed, calories burned trend |
| FR-ANALYTICS-05 | System shall compare planned vs. actual performance at the end of each week and feed the delta into the AI Planning Engine for next-week adaptation |
| FR-ANALYTICS-06 | System shall present adaptation changes to the user with a brief AI-generated explanation (e.g., "Reps reduced — form accuracy was below target") |

# 5\. Data Models

Each core entity in the system is described below in terms of the information it holds and its purpose, rather than a technical schema.

## 5.1 User Profile

Stores the information collected during onboarding. Includes: age, sex, height, weight, target weight (optional), primary fitness goal (weight loss, muscle gain, endurance, general fitness, rehab), experience level (beginner/intermediate/advanced), preferred workout environment (home/gym/hybrid), available equipment, days available per week, preferred session duration, any injuries or medical flags, and general activity level (sedentary/moderate/active). This record is created once during onboarding and referenced by every other module.

## 5.2 Exercise Catalog Entry

Represents a single exercise supported by the platform. Includes: exercise name and identifier, a thumbnail image and/or demo video for reference, written instructions, targeted muscle groups, and a flag indicating whether motion tracking is currently implemented for that exercise. This catalog is the shared reference used by both the AI Planning Engine (to select valid exercises) and the Motion Tracking Engine (to know which exercises it can track).

## 5.3 Workout Plan

Represents a generated multi-week program for a user. Organized by week number, and within each week by day, with each day listing a focus area (e.g., "Lower Body") and the exercises assigned that day — each with a target number of sets, reps, and rest duration. Plans are generated one month at a time and updated week-by-week based on performance.

## 5.4 Session Result

Captures the outcome of a single tracked exercise session. Includes: which exercise was performed, the date, the target reps versus actual reps completed, a form accuracy score (0–100), a list of detected mistakes, session duration, and an estimated calorie burn. These records feed both the Progress Dashboard and the weekly plan adaptation logic.

# 6\. API Design (High-Level)

Rather than specifying exact endpoint routes, the system's backend responsibilities are grouped as follows:

| Capability | Purpose |
| :---- | :---- |
| Account creation | Create a new user account and initialize their profile record |
| Onboarding submission | Save assessment responses as the user's profile |
| Plan generation | Generate a new monthly workout plan via the AI Planning Engine |
| Current week retrieval | Fetch the active week's schedule for display |
| Session initialization | Begin a motion-tracking session for a chosen exercise |
| Session completion | Persist results of a completed session (reps, form score, mistakes) |
| Coaching feedback generation | Produce a personalized AI coaching message from session metrics |
| Dashboard summary retrieval | Fetch aggregated progress data across sessions |
| Plan adaptation | Trigger regeneration of the following week's plan based on recent performance |

# 7\. Non-Functional Requirements

| ID | Requirement |
| :---- | :---- |
| NFR-01 | Motion tracking shall run at a minimum of 20–30 FPS on a standard laptop webcam for real-time usability |
| NFR-02 | Pose detection and rep counting shall run client-side (browser) to minimize latency |
| NFR-03 | LLM-dependent features (plan generation, coaching) shall handle API failures gracefully with retry/fallback messaging |
| NFR-04 | System architecture shall be modular — new exercises addable without modifying the core tracking pipeline |
| NFR-05 | UI shall be responsive and demo-ready across desktop and standard laptop webcam setups |
| NFR-06 | All LLM outputs shall be validated against a strict schema before being persisted or rendered |

# 8\. Assumptions & Constraints

* Demo/hackathon environment assumes a single well-lit room with the user fully visible in frame.

* Exercise catalog for motion tracking is limited to 2–3 exercises (e.g., Squat, Push-up, Bicep Curl) for MVP; plan generation is constrained to only reference these.

* Calorie estimates are approximations based on MET values and session duration, not clinically precise.

* No meal/nutrition functionality is included in this version.

# 9\. Success Criteria (Hackathon Demo)

* A user can complete onboarding and receive a generated monthly plan with exercise images in under 30 seconds.

* A user can perform a tracked exercise (e.g., squats) and see live rep counting and at least one real-time form correction cue.

* A post-session summary and AI coaching message are generated and displayed.

* A visible before/after comparison shows the plan adapting between week 1 and week 2 based on performance.