import Imap from "imap-simple";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
dotenv.config();

const config = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_IMAP_PORT) || 993,
    tls: true,
    authTimeout: 3000,
    tlsOptions: { servername: process.env.EMAIL_HOST },
  },
};

export const fetchInbox = async (req, res) => {
  try {
    const connection = await Imap.connect(config);
    await connection.openBox("INBOX", true);

    const searchCriteria = ["UNSEEN"];
    const fetchOptions = { bodies: [""], markSeen: false };
    const results = await connection.search(searchCriteria, fetchOptions);

    // Parse emails with mailparser
    const emails = await Promise.all(
      results.map(async (res, idx) => {
        const raw = res.parts[0].body;
        const parsed = await simpleParser(raw);
        return {
          id: res.attributes.uid || idx,
          sender: parsed.from?.text || "",
          recipient: parsed.to?.text || "",
          subject: parsed.subject || "",
          text: parsed.text || "",
          html: parsed.html || "",
          date: parsed.date || "",
          folder: "inbox",
        };
      })
    );

    // Sort by date DESCENDING (latest first)
    emails.sort((a, b) => new Date(b.date) - new Date(a.date));

    await connection.end();
    // res.status(200).json(emails);
    return emails;
  } catch (err) {
    console.error("IMAP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
