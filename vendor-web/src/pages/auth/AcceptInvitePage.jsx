
import { Link } from "react-router-dom";

import {
  LockKeyhole,
  MailCheck,
} from "lucide-react";


export default function AcceptInvitePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f5f8f4",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "36px",
          borderRadius: "18px",
          background: "#ffffff",
          border: "1px solid #e0e8dd",
          boxShadow:
            "0 18px 48px rgba(25, 65, 38, 0.08)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "18px",
            background: "#edf6ed",
            color: "#277b41",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
          }}
        >
          <MailCheck size={28} />
        </div>

        <h1
          style={{
            fontSize: "25px",
            marginBottom: "12px",
            color: "#173d26",
          }}
        >
          AUMVEDA Staff Invitation
        </h1>

        <p
          style={{
            color: "#617365",
            fontSize: "14px",
            lineHeight: 1.7,
          }}
        >
          This page will securely verify your
          employee invitation and guide you
          through creating your account password.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "22px",
            padding: "14px",
            borderRadius: "10px",
            background: "#f3f7f1",
            color: "#48654f",
            fontSize: "12px",
            textAlign: "left",
          }}
        >
          <LockKeyhole size={18} />

          Invitation activation is being configured.
          No employee account is activated by
          opening this page.
        </div>

        <Link
          to="/login"
          style={{
            display: "inline-block",
            marginTop: "24px",
            color: "#267c43",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Return to Vendor Login
        </Link>
      </section>
    </main>
  );
}
