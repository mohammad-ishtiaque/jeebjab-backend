import config from "../config/index.js"; // কনফিগ থেকে ইমেজ ইউআরএল নেওয়ার জন্য

const addAdminEmailTemp = (data) => {
  // কনফিগ থেকে ইমেজ ইউআরএল নিচ্ছি, ফলব্যাক হিসেবে খালি স্ট্রিং
  const logoImage = config.variables.email_temp_image || ""; 

  return ` 
        <html>
          <head>
            <style>
              body {
                font-family: 'Verdana', 'Arial', sans-serif;
                background-color: #f2f3f8;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #022C22;
                font-size: 26px;
                margin-bottom: 20px;
                font-weight: bold;
                text-align: center;
              }
              p {
                color: #555555;
                line-height: 1.8;
                font-size: 16px;
                margin-bottom: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              table th, table td {
                padding: 12px;
                text-align: left;
                border: 1px solid #ddd;
              }
              table th {
                background-color: #f2f3f8;
                font-weight: bold;
              }
              .logo {
                text-align: center;
              }
              .logo-img {
                max-width: 150px; /* লোগো সাইজ কন্ট্রোল করার জন্য */
                margin-bottom: 20px;
              }            
              .footer {
                margin-top: 30px;
                font-size: 13px;
                color: #9e9e9e;
                text-align: center;
              }
              a {
                color: #8A53FE;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <img src="${logoImage}" alt="${process.env.SERVICE_NAME} Logo" class="logo-img" />
              </div>        
              <h1>Welcome to ${process.env.SERVICE_NAME}!</h1>
              <p>Hello, ${data.name || 'Admin'},</p>
              <p>We are thrilled to welcome you as a new admin in our team. Below are your account details:</p>
              
              <table>
                <tr>
                  <th>Email</th>
                  <td>${data.email}</td>
                </tr>
                <tr>
                  <th>Password</th>
                  <td>${data.password}</td>
                </tr>
                <tr>
                  <th>Phone Number</th>
                  <td>${data.phoneNumber || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Address</th>
                  <td>${data.address || 'N/A'}</td>
                </tr>
              </table>
    
              <p>As an admin at ${process.env.SERVICE_NAME}, you play a vital role in ensuring a smooth and safe experience for our customers. Please log in to your account to get started.</p>
              <p>If you have any questions, reach out to us at <a href="mailto:support@${process.env.SERVICE_NAME}.com">support@${process.env.SERVICE_NAME}.com</a>.</p>
              <p>Best regards,<br><strong>The ${process.env.SERVICE_NAME} Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.SERVICE_NAME} - All Rights Reserved.</p>
              <p><a href="#">Privacy Policy</a> | <a href="#">Contact Support</a></p>
            </div>
          </body>
        </html>
      `;
};

// ESM Export
export default addAdminEmailTemp;