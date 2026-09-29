// SunoAPI requires a callBackUrl on every task. The app polls for results itself,
// so this endpoint only acknowledges deliveries (avoids CALLBACK_EXCEPTION states).
export default async () =>
  new Response(JSON.stringify({ status: "received" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

export const config = { path: "/api/callback" };
