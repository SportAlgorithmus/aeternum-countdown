import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Ceremony, CeremonyInput } from "@/lib/ceremony";
import type { HomePayload } from "@/lib/ceremony.server";

export const loadHome = createServerFn({ method: "GET" }).handler(async (): Promise<HomePayload> => {
  const { readHome } = await import("./ceremony.server");
  return readHome();
});

export const enterVault = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().max(120),
      password: z.string().max(80),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const { enterVault: enter } = await import("./ceremony.server");
    return enter(data.email, data.password);
  });

export const leaveVault = createServerFn({ method: "POST" }).handler(async () => {
  const { leaveVault: leave } = await import("./ceremony.server");
  return leave();
});

export const saveCeremony = createServerFn({ method: "POST" })
  .validator((input: CeremonyInput) => input)
  .handler(async ({ data }): Promise<{ ok: true; ceremony: Ceremony } | { ok: false; error: string }> => {
    const { saveCeremony: save } = await import("./ceremony.server");
    return save(data);
  });
