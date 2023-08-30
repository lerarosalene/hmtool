import zod from "zod";

const config = zod.object({
  output: zod.string(),
  base: zod.optional(zod.string()),
  mods: zod.array(
    zod.object({
      path: zod.string(),
      prefix: zod.string(),
    }),
  ),
  sse: zod.optional(
    zod.object({
      plugins: zod.optional(zod.string()),
      nemesis_patch: zod.optional(zod.string()),
    }),
  ),
});

type Config = zod.infer<typeof config>;

export { Config, config };
