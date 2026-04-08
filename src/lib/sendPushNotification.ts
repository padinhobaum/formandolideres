import { supabase } from "@/integrations/supabase/client";

type PushContentType = "notice" | "forum_topic" | "material" | "video" | "live";

interface SendPushNotificationInput {
  title: string;
  body: string;
  url?: string;
  contentType: PushContentType;
  referenceId: string;
  targetUserIds?: string[];
}

export async function sendPushNotification({
  title,
  body,
  url,
  contentType,
  referenceId,
  targetUserIds,
}: SendPushNotificationInput) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.functions.invoke("send-push", {
      body: {
        title,
        body,
        url,
        contentType,
        referenceId,
        targetUserIds,
      },
    });

    if (error) {
      console.error("Push notification failed:", error.message);
    }
  } catch (err) {
    console.error("Push notification error:", err);
  }
}
