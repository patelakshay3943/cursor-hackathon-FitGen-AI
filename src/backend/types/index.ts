export type WelcomeResponse = {
  message: string;
  app: string;
  version: string;
  timestamp: string;
  status: "ok";
};

export type ApiErrorResponse = {
  error: string;
  status: "error";
};
