import { generatePlanController } from "@/backend/controllers/plan.controller";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return generatePlanController(body);
}
