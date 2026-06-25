import { supabase } from "../supabase";

interface MailPayload {
  to: string;
  subject: string;
  html: string;
}

interface MailQueueRow {
  id: string;
}

export async function queueMail(payload: MailPayload) {
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("mail_queue")
    .insert({ id, to_email: payload.to, subject: payload.subject, html: payload.html });

  if (error) throw error;
  return { id } as MailQueueRow;
}

export async function sendQueuedMail(ids: string[]) {
  if (ids.length === 0) return;

  const { error } = await supabase.functions.invoke("send-mail", {
    body: { ids },
  });

  if (error) {
    console.error("Send mail function error:", error);
  }
}

export async function queueAndSendMail(payloads: MailPayload[]) {
  const queued = await Promise.all(payloads.map((payload) => queueMail(payload)));
  await sendQueuedMail(queued.map((mail) => mail.id));
}
