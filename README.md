# Zahava – Power of Awareness and Resilience

## Project Description
Zahava – Power of Awareness and Resilience is a digital project developed as part of an academic workshop.  
The project demonstrates the analysis, design, and implementation of an interactive information system focused on mindfulness and emotional support.

The system simulates a platform that connects users with mindfulness sessions, enables session search and registration, and provides an interactive chat interface that represents a supportive virtual agent.

The project emphasizes user experience, structured system flows, and the integration of frontend, backend, database, and external APIs.

---

## Project Goals
- Demonstrate a web-based interactive information system
- Implement a structured session registration and approval process
- Enable location-based session search using geographic distance
- Work with real-world data in a production-like environment
- Integrate third-party services such as AI, email, and geolocation APIs

---

## Core Features
- Interactive chat interface
- Location-based session search (by city and radius)
- Display of upcoming sessions only
- Session registration flow
- Registration approval process
- Automated email notifications
- Data management and cleanup in a production environment

---

## Registration and Approval Flow
The system includes a session registration process followed by an approval mechanism.

Users submit registration requests through the application.  
Each request requires approval before it is confirmed.  
Email notifications are sent as part of the registration and approval process.

---

## Technologies Used

### Frontend
- React
- HTML5 / CSS3
- JavaScript
- Mobile-first responsive design

### Backend
- Node.js
- Express
- REST API

### Database
- MySQL  

Main tables:
- users
- lessons
- user_lessons

### External APIs and Services
- OpenAI API – conversational logic for the chat interface
- Nominatim / Geo services – location and distance calculations
- Resend – email delivery service
- Deployment environment: Render / Railway

---

## System Architecture Overview
- Client – user interface and chat experience
- Server – business logic and REST API
- Database – session and registration data management
- External APIs – AI, email, and geolocation services

---

## Repository Structure
## Local Setup and Run Instructions

### Prerequisites
- Node.js (version 18 or higher)
- MySQL
- npm

### Installation
1. Clone the repository:
```bash
git clone https://github.com/inaama8888/AI-agent-for-healthcare-.git
cd AI-agent-for-healthcare-
