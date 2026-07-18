import { NextResponse } from "next/server";
import { getWelcomeMessage } from "../services/welcome.service";

export function welcomeController() {
  const data = getWelcomeMessage();
  return NextResponse.json(data, { status: 200 });
}
