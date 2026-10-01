# Technical Test - Todo App (FastAPI + Vite)

## Objectives

You will work on a set of improvements to the existing application. Each task is designed to test your skills in both backend and frontend development. The application is a simple Todo list manager, where users can add, delete, and mark tasks as completed. The backend is built with FastAPI and the frontend uses Vite with React and TypeScript.
The goal is to demonstrate your understanding of the codebase and your ability to implement new features.

### Tasks

1. **Implement task completion status functionality**
   You can select a task as completed, but the status is not saved in the backend.
   - [ ] Complete the implementation so that the status is saved in the backend and displayed in the frontend.

2. **Implement delete task functionality**.
   Allow users to delete individual todos from the list, both in the backend and frontend.
   - [ ] Add a delete button next to each task in the UI.
   - [ ] Implement the backend API endpoint to handle task deletion.

3. **Auto-load Tasks**. The application should automatically fetch the todo list when:
   - [ ] The page loads.
   - [ ] The user adds a new task.
   - [ ] The user deletes a task.
   - [ ] The user marks a task as completed.

4. **Add Descriptions and Favorite Tasks Section**
   - [ ] Add a description field to each task.
   - [ ] Introduce the concept of a `favorite` tasks.
   - [ ] Add a way to mark/unmark tasks as favorite.
   - [ ] Display favorite tasks in a separate section of the UI.

   _**Suggestion**: To maintain clean and scalable code, consider using routing or the repository pattern if you're adding numerous endpoints._

5. **Create a README**
   - [ ] Write a clear and concise README for this project.

## How to run the project

- **Backend:** FastAPI (Python)
- **Frontend:** Vite + React + TypeScript

1. Create a virtual environment and install the dependencies for the backend:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows use `.venv\Scripts\activate`
   pip install -r requirements.txt
   ```

2. Install the dependencies for the frontend:

   ```bash
   cd frontend
   npm install
   ```

3. Run the application:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` to see the application.

5. Click on the **Load Tasks** button to fetch the initial list of tasks from the backend.

## How to Send Your Solution

You can send us your solution in two different ways:

- Create a public repository on GitHub and push your code there. Share the link with us.
- Create a zip file of the project and send it to us via email.

---

Good luck! If you have any questions, feel free to ask.
