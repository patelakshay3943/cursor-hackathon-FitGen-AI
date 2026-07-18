import { getPlanDayController } from "@/backend/controllers/plan.controller";

type Params = { params: Promise<{ id: string; n: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id, n } = await params;
  return getPlanDayController(id, Number(n));
}
