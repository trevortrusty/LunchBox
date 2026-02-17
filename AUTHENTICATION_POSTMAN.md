To authenticate your GET requests in Postman for this application, you'll need to simulate the login process to obtain a session cookie. The application uses `iron-session` for session management, which relies on cookies.

Here's a step-by-step guide:

### Step 1: Make a POST Request to the Login Endpoint

1.  **Open Postman.**
2.  **Create a new request.**
3.  **Set the method to `POST`.**
4.  **Set the request URL:**
    Assuming your local development server is running on `http://localhost:3000`, the URL will be:
    `http://localhost:3000/api/auth/login`
5.  **Set the `Content-Type` header:**
    *   Go to the "Headers" tab.
    *   Add a header: `Content-Type`, value: `application/json`
6.  **Set the Request Body:**
    *   Go to the "Body" tab.
    *   Select `raw` and choose `JSON` from the dropdown.
    *   Enter a JSON body with a valid `username` and `pin`. For example:
        ```json
        {
            "username": "your_username",
            "pin": "your_pin"
        }
        ```
        *(Replace `your_username` and `your_pin` with actual credentials from your database. You might need to seed your database first if you haven't already).*
7.  **Send the request.**

### Step 2: Observe the Response and Session Cookie

Upon a successful login, you should see a JSON response containing user details (id, username, shopId, departmentId). More importantly, Postman will automatically capture and store the `Set-Cookie` header from the response. This cookie is your session token.

### Step 3: Make an Authenticated GET Request

1.  **Create a new request** (or use an existing one for your GET request).
2.  **Set the method to `GET`.**
3.  **Set the request URL** for the protected resource you want to access (e.g., `http://localhost:3000/api/me`).
4.  **Ensure cookies are automatically sent:**
    Postman is usually smart enough to automatically send cookies that it has stored for a given domain. To verify, you can:
    *   Go to the "Cookies" link on the right sidebar of Postman (below the "Send" button).
    *   You should see the `iron-session` cookie listed for `localhost:3000`.
    *   When you send your GET request, Postman will include this cookie in the request headers.

5.  **Send the GET request.**

You should now receive a successful response from the authenticated endpoint.

---

**Important Notes:**

*   **Valid Credentials:** Ensure you are using valid `username` and `pin` combinations that exist in your database.
*   **Database Seeding:** If you are running locally and haven't set up users, you might need to run `npm run db:seed` to populate your database with initial data, or manually create a user.
*   **Cookie Expiration:** Session cookies have an expiration. If your session expires, you will need to perform the login POST request again to obtain a new session cookie.
*   **Environment Variables:** If your application is deployed or running on a different port/domain, adjust the URLs accordingly.
