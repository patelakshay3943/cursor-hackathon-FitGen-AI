import { welcomeController } from "@/backend/controllers/welcome.controller";

export function GET() {
  return welcomeController();
}
