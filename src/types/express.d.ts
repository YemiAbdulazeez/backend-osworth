import type { StaffActor } from "./staff.js";

declare global {
  namespace Express {
    interface Request {
      staff?: StaffActor;
    }
  }
}

export {};
