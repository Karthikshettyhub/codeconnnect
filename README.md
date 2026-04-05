# CodeConnect

## Project Overview
CodeConnect is a project designed to [brief description of the project purpose and goals].

## Architecture
- **Overview**: [Description of the overall architecture of the project]
- **Components**:
  - **Frontend**: [Technologies used, frameworks, and brief description]
  - **Backend**: [Technologies used, frameworks, and brief description]
  - **Database**: [Database used and its role]
  
## Project Flow
1. [Step 1: Description of the initial step in the process]
2. [Step 2: Description of the second step]
3. [Step 3: Description of any further steps]
  
## Components
- **Component 1**: [Description and function]
- **Component 2**: [Description and function]
  
## Code Functions
- **Function 1**: [Description of what this function does]
- **Function 2**: [Description of what this function does]

## Installation
1. [Clone the repository]
2. [Install dependencies]
3. [Run the project]

## Usage
[Instructions on how to use the project]

## Contribution
[Guidelines on how others can contribute to the project]

## License
[License information]\

TODOS 1. MongoDB Atlas setup          → free cloud database
2. Mongoose connection          → connect backend to MongoDB
3. User model                   → username, email, password, avatar, created at
4. Room model                   → room name, passcode, creator, created at, members
5. Message model                → message, sender, room, timestamp
6. Code snapshot model          → save code at end of session per room
7. Auth endpoints               → register, login with JWT
8. User endpoints               → get profile, update profile, avatar upload
9. Room endpoints               → get room history, rooms user created, rooms user joined
10. Message endpoints           → get chat history per room
11. Protect routes with JWT     → middleware
12. Connect socket to userId    → attach user info to socket connection
13. Update roomManager          → use MongoDB instead of memory
14. Room cleanup                → delete empty rooms after X minutes
