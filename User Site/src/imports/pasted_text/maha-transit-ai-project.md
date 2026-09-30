MahaTransit AI: Intelligent Complaint Management & Monitoring System for Mumbai Public Transport
Major Project (BE Information Technology)
1. Project Objective

The objective of MahaTransit AI is to develop an AI-powered responsive web application that serves as a centralized complaint management platform for Mumbai's public transport systems, including Mumbai Metro, BEST Buses, and Mumbai Local Trains.

The platform enables citizens to report transport-related issues through text, images, videos, or voice. Artificial Intelligence assists by automatically understanding the complaint, categorizing it, detecting issues from uploaded images, predicting complaint priority, and identifying duplicate complaints.

Once analyzed, the complaint is forwarded to the respective transport management dashboard (Metro, BEST, or Railway Management). The concerned management authority reviews the complaint, updates its status, and communicates progress back to the citizen through the platform.

The system focuses on intelligent complaint processing, efficient routing, transparency, and complaint tracking. It does not manage the internal workflow of transport authorities; instead, it provides a digital bridge between citizens and the appropriate transport management.

2. Problem Statement

Mumbai's public transport systems serve millions of passengers daily. Citizens often face challenges while reporting issues such as:

Dirty coaches
Broken seats
AC failures
Escalator problems
Platform cleanliness
Driver behaviour
Safety concerns
Water leakage
Overcrowding

Existing complaint mechanisms are often scattered across different platforms, making it difficult for citizens to know where to report issues and track their resolution.

The proposed system provides one unified platform that intelligently routes complaints to the appropriate management authority.

3. Project Scope
Transport Systems Covered
Mumbai Metro (All Operational Lines)
BEST Bus Services
Mumbai Local Trains
Western Railway
Central Railway
Harbour Line
4. Main Users
Citizen

Citizens can:

Register/Login
Submit Complaint
Upload Images
Upload Videos
Record Voice Complaint
Track Complaint Status
View Complaint History
Receive Notifications
Rate Complaint Resolution
Management

Separate Management Portals

Metro Management
BEST Management
Railway Management

Management can:

Login
View Complaints
Filter Complaints
Search Complaints
View AI Analysis
Change Complaint Status
Add Remarks
Upload Resolution Image
Close Complaint
View Analytics
5. Complete System Workflow
Citizen Login

↓

Select Transport

↓

Select Location

↓

Upload Image / Video (Optional)

↓

Write Complaint

↓

AI Processing

↓

Complaint Category

↓

Priority Prediction

↓

Duplicate Detection

↓

Store Complaint

↓

Forward to Appropriate Management Dashboard

↓

Management Reviews Complaint

↓

Status Updated

↓

Citizen Receives Notification

↓

Complaint Closed
6. Citizen Side Workflow
Step 1

Register/Login

↓

Dashboard Opens

Step 2

Choose Transport

Metro
BEST Bus
Local Train
Step 3

Select Details

Example

Metro

Line
Station

BEST

Bus Number
Route

Local

Railway Line
Station
Direction
Fast/Slow
Step 4

Describe Issue

Example

"Escalator is not working at Andheri Metro Station."

Step 5

Upload Evidence

Optional

Images
Videos
Voice Recording
Step 6

AI Analysis

Automatically generates:

Complaint Category
Priority
Duplicate Check
Step 7

Complaint Submitted

Citizen receives

Complaint ID
Submission Time
Current Status
Step 8

Track Complaint

Status Flow

Submitted

↓

Received

↓

Under Review

↓

In Progress

↓

Resolved

↓

Closed
7. Management Side Workflow
Metro Management Login

↓

Dashboard

↓

View Metro Complaints Only

↓

Open Complaint

↓

View

Citizen Details
Complaint Description
Uploaded Images
AI Category
AI Priority

↓

Update Status

↓

Add Remarks

↓

Mark Resolved

↓

Citizen Gets Notification

Same workflow applies for BEST and Railway Management.

8. AI Features
AI Feature 1
Complaint Classification

Purpose

Automatically understand complaint text.

Example

Input

"The AC is not working."

Output

Category

Electrical Issue

AI Feature 2
Image Detection

Purpose

Detect visible transport issues.

Possible Detection

Garbage
Broken Seat
Water Leakage
Damaged Infrastructure
Crowd Level
AI Feature 3
Priority Prediction

Purpose

Automatically estimate urgency.

Example

High

Fire
Electrical Hazard
Security Threat

Medium

Broken Seat
Garbage
AC Issue

Low

Minor Suggestions
AI Feature 4
Duplicate Complaint Detection

Purpose

Identify multiple reports for the same issue.

Example

100 complaints about

"Dadar Platform Dirty"

↓

Merged

↓

Management sees

100 affected users.

9. Technology Stack
Frontend
React.js

Function

Builds the responsive user interface.

Tailwind CSS

Function

Responsive UI styling.

ShadCN UI

Function

Modern reusable UI components.

React Router

Function

Navigation between pages.

Axios

Function

Connect frontend to backend APIs.

React Hook Form

Function

Efficient form validation.

Framer Motion

Function

Animations and smooth transitions.

Backend
FastAPI

Function

Develop REST APIs and integrate AI services.

Uvicorn

Function

Runs the FastAPI application.

SQLAlchemy

Function

Object Relational Mapping (ORM).

Alembic

Function

Database migrations.

Pydantic

Function

Request validation and data serialization.

Database
PostgreSQL

Function

Stores:

Users
Complaints
Management Accounts
Status Updates
AI Results
Authentication
JWT

Function

Secure login authentication.

bcrypt

Function

Encrypt passwords before storage.

Artificial Intelligence
Hugging Face Transformers (DistilBERT/BERT)

Function

Complaint text classification.

YOLOv8

Function

Object detection from uploaded images.

OpenCV

Function

Image preprocessing.

Sentence Transformers

Function

Duplicate complaint detection using semantic similarity.

Scikit-learn

Function

Priority prediction model.

Pandas

Function

Dataset preprocessing and analytics.

NumPy

Function

Numerical computations.

Voice Processing
OpenAI Whisper (or Vosk for offline)

Function

Convert voice complaints to text.

Storage
Cloudinary

Function

Store uploaded images and videos.

Notifications
WebSockets (FastAPI)

Function

Real-time dashboard updates.

Email (Optional)

Function

Complaint submission and status alerts.

Charts
Chart.js

Function

Complaint analytics.

Examples

Complaint Categories
Resolution Rate
Monthly Complaints
Pending vs Resolved
Maps
OpenStreetMap + Leaflet.js

Function

Select complaint location and display complaint heatmaps without paid API usage.

Deployment
Docker

Function

Containerize the application.

GitHub

Function

Version control and collaboration.

Render / Railway / AWS (Choose One)

Function

Host the application.

10. Database Tables
Users
User ID
Name
Email
Mobile
Password
Management
Management ID
Organization
Email
Password
Complaints
Complaint ID
User ID
Transport
Route
Station
Description
Category
Priority
Image URL
Status
Created Date
Complaint Updates
Update ID
Complaint ID
Status
Remarks
Updated By
Timestamp
AI Analysis
Complaint ID
Predicted Category
Confidence
Priority
Duplicate Score
11. Team Responsibilities
Member 1 – Frontend
Citizen UI
Authentication
Complaint Forms
Complaint Tracking
Responsive Design
Member 2 – Backend
APIs
Authentication
Database
Complaint Management
Notifications
Member 3 – AI/NLP
Complaint Classification
Priority Prediction
Duplicate Detection
Member 4 – Computer Vision
Image Upload
YOLO Model
OpenCV Processing
Image Detection APIs
Member 5 – Dashboard & Analytics
Management Dashboard
Charts
Heatmaps
Reports
Deployment
12. Future Scope
Integration with official Mumbai Metro, BEST, and Railway complaint APIs (if available).
Multilingual interface (English, Hindi, Marathi).
Predictive analytics to identify recurring issues.
AI chatbot for complaint tracking.
SLA monitoring for complaint resolution times.
Officer performance dashboard.
SMS and WhatsApp notifications.
13. Expected Outcome

The completed system will provide a single, AI-enabled platform that simplifies complaint reporting for citizens while giving transport management a centralized dashboard to receive, organize, prioritize, and track complaints. By reducing manual sorting, highlighting duplicate issues, and providing transparent status updates, the platform improves communication between citizens and transport authorities and supports faster, more informed decision-making.