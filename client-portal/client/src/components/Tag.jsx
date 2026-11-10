const TONE = {
  Active: "t-ok", Paid: "t-ok", Approved: "t-ok", Received: "t-ok",
  Paid: "t-ok",
  Approved: "t-ok",
  Overdue: "t-bad", Rejected: "t-bad", Failed: "t-bad",
  Rejected: "t-bad",
  "Awaiting approval": "t-warn", Pending: "t-warn",
  Pending: "t-warn",
   Sent: "t-info", New: "t-info", Draft: "t-info",
  New: "t-info",
  Draft: "t-info",
};

export default function Tag({ status }) {
  return <span className={`tag ${TONE[status] || "t-info"}`}>{status}</span>;
}