export default function ErrorBox({ error }) {
  if (!error) return null;
  const msg = error instanceof Error ? error.message : String(error);
  return <div className="error-box">⚠ {msg}</div>;
}
