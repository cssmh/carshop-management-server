import express from "express";
const welcomeRoute = express.Router();

welcomeRoute.get("/", (req, res) => {
  const currentYear = new Date().getFullYear();

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>TSGB API Server</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet" />
      <style>
       * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          font-family: 'Montserrat', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #fff;
          overflow: hidden;
          position: relative;
        }
        .container {
          text-align: center;
          position: relative;
          z-index: 1;
          padding: 3rem 2rem;
          background: rgba(24,27,52,0.85);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          box-shadow: 0 25px 45px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 580px;
          width: 100%;
          animation: fadeIn 1.2s cubic-bezier(.5,.2,.2,1);
          overflow: hidden;
          margin-bottom: 20px;
        }
        .container::before {
          content: '';
          position: absolute;
          top: -90px;
          left: -90px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, #00dbde 0%, transparent 70%);
          opacity: 0.17;
          z-index: -1;
        }
        .container::after {
          content: '';
          position: absolute;
          bottom: -90px;
          right: -90px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, #fc00ff 0%, transparent 70%);
          opacity: 0.12;
          z-index: -1;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .status {
          display: inline-block;
          margin-bottom: 1.2rem;
          padding: 0.35rem 1.3rem;
          background: linear-gradient(90deg, #00dbde 0%, #fc00ff 100%);
          color: #fff;
          border-radius: 30px;
          font-weight: 700;
          letter-spacing: 0.08em;
          font-size: 0.95rem;
          box-shadow: 0 2px 12px rgba(0,219,222,0.14);
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 0.6rem;
          background: linear-gradient(90deg, #00dbde 0%, #fc00ff 33%, #e62245 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .subtitle {
          font-size: 0.95rem;
          color: #d9dbe9;
          margin-bottom: 1.9rem;
          font-weight: 400;
        }
        .divider {
          width: 60px;
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, #00dbde, #fc00ff);
          margin: 0 auto 1.7rem auto;
          animation: slide 2.2s infinite alternate cubic-bezier(.5, .2, .2, 1);
        }
        @keyframes slide {
          from {
            width: 40px;
          }
          to {
            width: 60px;
          }
        }
        .now-time {
          font-size: 0.95rem;
          color: #00dbde;
          margin-bottom: 1rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-align: center;
        }
        .now-time .line-break {
          display: block;
        }
        .cta-row {
          margin: 1.8rem 0;
        }
        .cta-button {
          display: inline-block;
          padding: 10px 28px;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.06em;
          box-shadow: 0 4px 18px rgba(0,219,222,0.14);
          transition: background 0.21s, transform 0.13s;
          background: linear-gradient(90deg, #00dbde 0%, #fc00ff 100%);
          color: #fff;
        }
        .cta-button:hover {
          background: linear-gradient(90deg, #fc00ff 0%, #00dbde 100%);
          transform: scale(1.035);
          box-shadow: 0 8px 32px rgba(0,219,222,0.22);
        }
        .footer {
          color: #c2c4e1;
          line-height: 1.8;
          font-size: 0.85rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .footer a {
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer a:first-of-type {
          color: #00dbde;
        }
        .footer a:last-of-type {
          color: #fc00ff;
        }
        .footer a:hover {
          opacity: 0.9;
        }
        .footer-names {
          display: inline;
          white-space: nowrap;
        }
        .circles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: -1;
        }
        .circles li {
          position: absolute;
          display: block;
          list-style: none;
          width: 20px;
          height: 20px;
          background: rgba(255,255,255,0.1);
          animation: animate 25s linear infinite;
          bottom: -150px;
          border-radius: 50%;
        }
        .circles li:nth-child(1) { left: 25%; width: 80px; height: 80px; animation-delay: 0s; }
        .circles li:nth-child(2) { left: 10%; width: 20px; height: 20px; animation-delay: 2s; animation-duration: 12s;}
        .circles li:nth-child(3) { left: 70%; width: 20px; height: 20px; animation-delay: 4s;}
        .circles li:nth-child(4) { left: 40%; width: 60px; height: 60px; animation-delay: 0s; animation-duration: 18s;}
        .circles li:nth-child(5) { left: 65%; width: 20px; height: 20px; animation-delay: 0s;}
        .circles li:nth-child(6) { left: 75%; width: 110px; height: 110px; animation-delay: 3s;}
        .circles li:nth-child(7) { left: 35%; width: 150px; height: 150px; animation-delay: 7s;}
        .circles li:nth-child(8) { left: 50%; width: 25px; height: 25px; animation-delay: 15s; animation-duration: 45s;}
        .circles li:nth-child(9) { left: 20%; width: 15px; height: 15px; animation-delay: 2s; animation-duration: 35s;}
        .circles li:nth-child(10) { left: 85%; width: 150px; height: 150px; animation-delay: 0s; animation-duration: 11s;}
        @keyframes animate {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; border-radius: 0;}
          100% { transform: translateY(-1000px) rotate(720deg); opacity: 0; border-radius: 50%;}
        }
        /* Responsive adjustments */
        @media (min-width: 1536px) {
          .container {
            max-width: 520px;
          }
          h1 { font-size: 1.8rem; }
          .status { font-size: 0.9rem; }
          .subtitle { font-size: 0.9rem; }
          .now-time { font-size: 0.9rem; }
          .cta-button { font-size: 0.9rem; padding: 9px 26px; }
          .footer { font-size: 0.8rem; }
        }
        @media (min-width: 1280px) and (max-width: 1535px) {
          .container {
            max-width: 480px;
          }
          h1 { font-size: 1.7rem; }
          .status { font-size: 0.88rem; }
          .subtitle { font-size: 0.88rem; }
          .now-time { font-size: 0.88rem; }
          .cta-button { font-size: 0.88rem; padding: 8px 24px; }
          .footer { font-size: 0.78rem; }
        }
        @media (min-width: 1024px) and (max-width: 1279px) {
          .container {
            max-width: 420px;
            padding: 2.5rem 1.5rem;
          }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          .status { font-size: 0.8rem; margin-bottom: 1rem; padding: 0.3rem 1.1rem; }
          .subtitle { font-size: 0.8rem; margin-bottom: 1.5rem; }
          .divider { margin: 0 auto 1.4rem auto; }
          .now-time { font-size: 0.8rem; margin-bottom: 0.8rem; }
          .cta-button { font-size: 0.8rem; padding: 7px 20px; }
          .footer { font-size: 0.7rem; margin-top: 1.2rem; padding-top: 1.2rem; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .container {
            max-width: 400px;
            padding: 2rem 1.2rem;
          }
          h1 { font-size: 1.5rem; }
          .status { font-size: 0.82rem; }
          .subtitle { font-size: 0.82rem; }
          .now-time { font-size: 0.82rem; }
          .cta-button { font-size: 0.82rem; padding: 7px 20px; }
          .footer { 
            font-size: 0.74rem;
          }
          .footer-names {
            display: block;
            white-space: normal;
          }
          .footer a {
            display: inline-block;
            margin: 0 2px;
          }
        }
        @media (max-width: 767px) {
          .container {
            padding: 2rem 1.2rem;
            margin: 1rem;
            max-width: 420px;
            border-radius: 16px;
          }
          .status {
            margin-bottom: 1.1rem;
            font-size: 0.8rem;
            padding: 0.35rem 1.3rem;
          }
          h1 {
            font-size: 1.4rem;
            margin-bottom: 0.6rem;
          }
          .subtitle {
            font-size: 0.8rem;
            margin-bottom: 1.8rem;
          }
          .divider {
            margin: 0 auto 1.6rem auto;
          }
          .now-time {
            font-size: 0.8rem;
            margin-bottom: 1rem;
            line-height: 1.4;
          }
          .cta-row {
            margin: 1.7rem 0;
          }
          .cta-button {
            padding: 6px 18px;
            font-size: 0.8rem;
          }
          .footer {
            font-size: 0.75rem;
            margin-top: 1.4rem;
            padding-top: 1.4rem;
          }
          .footer-names {
            display: block;
            white-space: normal;
          }
          .footer a {
            display: inline-block;
            margin: 0 2px;
          }
        }
        @media (max-width: 400px) {
          .container {
            max-width: 340px;
            padding: 1.8rem 1rem;
            border-radius: 12px;
          }
          .status {
            margin-bottom: 0.9rem;
            font-size: 0.75rem;
            padding: 0.3rem 1.1rem;
          }
          h1 {
            font-size: 1.3rem;
            margin-bottom: 0.5rem;
          }
          .subtitle {
            font-size: 0.75rem;
            margin-bottom: 1.4rem;
          }
          .divider {
            margin: 0 auto 1.3rem auto;
          }
          .now-time {
            font-size: 0.75rem;
            margin-bottom: 0.8rem;
          }
          .cta-row {
            margin: 1.4rem 0;
          }
          .cta-button {
            padding: 5px 16px;
            font-size: 0.75rem;
          }
          .footer {
            font-size: 0.7rem;
            margin-top: 1.2rem;
            padding-top: 1.2rem;
          }
          .footer a:last-of-type {
            display: block;
            margin-top: 0.2rem;
          }
        }
      </style>
    </head>
    <body>
      <ul class="circles">
        <li></li><li></li><li></li><li></li><li></li>
        <li></li><li></li><li></li><li></li><li></li>
      </ul>
      <div class="container">
        <div class="status">SERVER RUNNING</div>
        <h1>TSGB API Server</h1>
        <div class="subtitle">Official Backend API</div>
        <div class="divider"></div>
        <div class="now-time" id="now-time">Loading time...</div>
        <div class="cta-row">
          <a href="https://ts-geosystems.com.bd" class="cta-button" target="_blank" rel="noopener">Discover Our Solutions</a>
        </div>
        <div class="footer">
          &copy; ${currentYear} TSGB. All rights reserved.
          <br />
          <span class="footer-names">
          Made with ❤️ by
          <a href="https://www.linkedin.com/in/momin-dev" target="_blank" rel="noopener noreferrer">Md. Momin Hossain</a>
          &amp; <a href="https://www.linkedin.com/in/swapnilahmedshishir" target="_blank" rel="noopener noreferrer">Swapnil Ahmmed Shishir</a>
          </span>
        </div>
      </div>

      <script>
        function updateTime() {
          const now = new Date();
          const dateOptions = {
            timeZone: "Asia/Dhaka",
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          };
          const formattedDate = now.toLocaleString("en-BD", dateOptions);
          const timezone = "(Asia/Dhaka)";

          document.getElementById("now-time").innerHTML = formattedDate + '<span class="line-break">' + timezone + '</span>';
        }
        setInterval(updateTime, 1000);
        updateTime();
      </script>
    </body>
    </html>
  `);
});

export default welcomeRoute;
