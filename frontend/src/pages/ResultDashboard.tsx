import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ResultDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔒 Result Dashboard is disabled. Redirecting to home-page.");
    navigate("/home-page", { replace: true });
  }, [navigate]);

  return null;
}
