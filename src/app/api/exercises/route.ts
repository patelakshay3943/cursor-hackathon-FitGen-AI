import { listExercisesController } from "@/backend/controllers/plan.controller";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return listExercisesController(searchParams);
}
