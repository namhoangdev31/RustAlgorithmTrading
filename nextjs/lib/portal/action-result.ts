export type ActionResult<T = undefined> = {
  ok: boolean;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
};
