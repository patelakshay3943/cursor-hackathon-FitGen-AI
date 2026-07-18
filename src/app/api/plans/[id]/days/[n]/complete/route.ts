import { completePlanDayController } from "@/backend/controllers/plan.controller";

type Params = { params: Promise<{ id: string; n: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id, n } = await params;
  return completePlanDayController(id, Number(n));
}
