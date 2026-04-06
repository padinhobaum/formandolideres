import { supabase } from "@/integrations/supabase/client";

export async function sendPushNotification(title: string, body: string, url?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/send-push`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title, body, url }),
      }
    );

    if (!response.ok) {
      console.error("Push notification failed:", await response.text());
    }
  } catch (err) {
    console.error("Push notification error:", err);
  }
}
